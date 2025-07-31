#!/usr/bin/env node

/**
 * GitHub Repository Setup Script
 * Creates a new GitHub repository and performs initial push
 * Run this ONCE to set up the repository
 */

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./load-env');

// Load environment variables from .env file
loadEnv();

// Configuration (from .env or defaults)
const REPO_NAME = process.env.REPO_NAME || 'vsc-ventures-websites';
const REPO_DESCRIPTION = process.env.REPO_DESCRIPTION || 'VSCode Ventures - Multi-venture web distribution platform with individual branded websites';
const REPO_HOMEPAGE = 'https://vsc-ventures.com';

// Color codes for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createGitHubRepo(token) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            name: REPO_NAME,
            description: REPO_DESCRIPTION,
            homepage: REPO_HOMEPAGE,
            private: process.env.REPO_PRIVATE === 'true',
            has_issues: true,
            has_projects: false,
            has_wiki: false,
            auto_init: false
        });

        const options = {
            hostname: 'api.github.com',
            path: '/user/repos',
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'User-Agent': 'VSCode-Ventures-Setup',
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                const response = JSON.parse(responseData);
                
                if (res.statusCode === 201) {
                    resolve(response);
                } else if (res.statusCode === 422 && response.errors?.[0]?.message?.includes('already exists')) {
                    reject(new Error('REPO_EXISTS'));
                } else {
                    reject(new Error(`Failed to create repository: ${response.message || responseData}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

function runCommand(command, description) {
    try {
        log(`\n${description}...`, 'blue');
        execSync(command, { stdio: 'inherit' });
        log(`✓ ${description} completed`, 'green');
        return true;
    } catch (error) {
        log(`✗ ${description} failed: ${error.message}`, 'red');
        return false;
    }
}

async function main() {
    log('\n🚀 GitHub Repository Setup for VSCode Ventures\n', 'green');

    // Check for GitHub token
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        log('❌ Error: GITHUB_TOKEN environment variable not found', 'red');
        log('\nPlease set your GitHub token:', 'yellow');
        log('  Windows: set GITHUB_TOKEN=your_token_here', 'yellow');
        log('  Then run this script again\n', 'yellow');
        process.exit(1);
    }

    // Check if we're in the correct directory
    const currentDir = process.cwd();
    const expectedDir = 'vsc-ventures-websites';
    if (!currentDir.endsWith(expectedDir)) {
        log(`❌ Error: Must run from ${expectedDir} directory`, 'red');
        log(`Current directory: ${currentDir}`, 'yellow');
        process.exit(1);
    }

    try {
        // Step 1: Create GitHub repository
        log('📦 Creating GitHub repository...', 'blue');
        const repo = await createGitHubRepo(token);
        log(`✓ Repository created: ${repo.html_url}`, 'green');
        
        // Get username from repo URL
        const username = repo.owner.login;
        const repoUrl = `https://github.com/${username}/${REPO_NAME}.git`;

        // Step 2: Initialize git if needed
        if (!fs.existsSync('.git')) {
            runCommand('git init', 'Initializing git repository');
        } else {
            log('✓ Git repository already initialized', 'green');
        }

        // Step 3: Add all files
        runCommand('git add .', 'Adding all files');

        // Step 4: Create initial commit
        runCommand('git commit -m "Initial commit: VSCode Ventures V5 - Multi-venture web distribution platform"', 'Creating initial commit');

        // Step 5: Rename branch to main
        runCommand('git branch -M main', 'Renaming branch to main');

        // Step 6: Add remote origin
        runCommand(`git remote add origin ${repoUrl}`, 'Adding remote origin');

        // Step 7: Push to GitHub
        runCommand('git push -u origin main', 'Pushing to GitHub');

        // Success!
        log('\n✅ Repository setup complete!', 'green');
        log(`\n📍 Repository URL: ${repo.html_url}`, 'blue');
        log(`📍 Clone URL: ${repoUrl}`, 'blue');
        
        log('\n📋 Next steps:', 'yellow');
        log('1. Go to Cloudflare Pages: https://dash.cloudflare.com/?to=/:account/pages', 'yellow');
        log('2. Create a new project and connect this GitHub repository', 'yellow');
        log('3. Use build settings from CLOUDFLARE-DEPLOYMENT.md', 'yellow');
        log('\n💡 To push future updates, use: node scripts/github-push.js', 'yellow');

    } catch (error) {
        if (error.message === 'REPO_EXISTS') {
            log('\n⚠️  Repository already exists on GitHub', 'yellow');
            log('Attempting to connect to existing repository...', 'blue');
            
            // Try to set up with existing repo
            const username = process.env.GITHUB_USERNAME || 'YOUR_USERNAME';
            const repoUrl = `https://github.com/${username}/${REPO_NAME}.git`;
            
            if (!fs.existsSync('.git')) {
                runCommand('git init', 'Initializing git repository');
            }
            
            // Check if remote exists
            try {
                execSync('git remote get-url origin', { stdio: 'ignore' });
                log('✓ Remote origin already configured', 'green');
            } catch {
                runCommand(`git remote add origin ${repoUrl}`, 'Adding remote origin');
            }
            
            log('\n💡 Repository exists. Use github-push.js to push changes.', 'yellow');
            log(`   If the username is wrong, update it in: ${repoUrl}`, 'yellow');
        } else {
            log(`\n❌ Error: ${error.message}`, 'red');
            process.exit(1);
        }
    }
}

// Run the setup
main().catch(console.error);