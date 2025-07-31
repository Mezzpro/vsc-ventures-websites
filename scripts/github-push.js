#!/usr/bin/env node

/**
 * GitHub Push Script
 * Use this to push updates to the GitHub repository
 * Run this whenever you want to push changes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { loadEnv } = require('./load-env');

// Load environment variables from .env file
loadEnv();

// Color codes for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description, showOutput = true) {
    try {
        log(`\n${description}...`, 'blue');
        const output = execSync(command, { encoding: 'utf8', stdio: showOutput ? 'inherit' : 'pipe' });
        log(`✓ ${description} completed`, 'green');
        return { success: true, output };
    } catch (error) {
        log(`✗ ${description} failed: ${error.message}`, 'red');
        return { success: false, error };
    }
}

function getGitStatus() {
    try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        return status.trim();
    } catch (error) {
        return null;
    }
}

function getCurrentBranch() {
    try {
        const branch = execSync('git branch --show-current', { encoding: 'utf8' });
        return branch.trim();
    } catch (error) {
        return 'unknown';
    }
}

async function promptUser(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function main() {
    log('\n🚀 GitHub Push Script for VSCode Ventures\n', 'green');

    // Check if we're in the correct directory
    const currentDir = process.cwd();
    const expectedDir = 'vsc-ventures-websites';
    if (!currentDir.endsWith(expectedDir)) {
        log(`❌ Error: Must run from ${expectedDir} directory`, 'red');
        log(`Current directory: ${currentDir}`, 'yellow');
        process.exit(1);
    }

    // Check if git is initialized
    if (!fs.existsSync('.git')) {
        log('❌ Error: Git repository not initialized', 'red');
        log('Please run github-setup.js first', 'yellow');
        process.exit(1);
    }

    // Check current branch
    const currentBranch = getCurrentBranch();
    log(`📍 Current branch: ${currentBranch}`, 'cyan');

    // Check for changes
    const status = getGitStatus();
    if (!status) {
        log('✓ No changes to commit', 'green');
        
        // Ask if user wants to push anyway
        const pushAnyway = await promptUser('\nDo you want to push anyway? (y/n): ');
        if (pushAnyway.toLowerCase() !== 'y') {
            log('\n👋 Exiting without pushing', 'yellow');
            process.exit(0);
        }
    } else {
        // Show changes
        log('\n📝 Changes detected:', 'yellow');
        runCommand('git status --short', 'Checking status');

        // Get commit message
        const defaultMessage = 'Update VSCode Ventures websites';
        const commitMessage = await promptUser(`\nEnter commit message (default: "${defaultMessage}"): `) || defaultMessage;

        // Add all changes
        const addResult = runCommand('git add .', 'Adding all changes');
        if (!addResult.success) {
            log('❌ Failed to add changes', 'red');
            process.exit(1);
        }

        // Commit changes
        const commitCommand = `git commit -m "${commitMessage.replace(/"/g, '\\"')}"`;
        const commitResult = runCommand(commitCommand, 'Creating commit');
        if (!commitResult.success) {
            log('❌ Failed to create commit', 'red');
            process.exit(1);
        }
    }

    // Pull latest changes (to avoid conflicts)
    log('\n📥 Pulling latest changes...', 'blue');
    const pullResult = runCommand('git pull origin main --rebase', 'Pulling from origin/main', false);
    if (!pullResult.success && !pullResult.error.message.includes('up to date')) {
        log('⚠️  Pull failed, but continuing...', 'yellow');
    }

    // Push to GitHub
    log('\n📤 Pushing to GitHub...', 'blue');
    const pushResult = runCommand('git push origin main', 'Pushing to origin/main');
    
    if (pushResult.success) {
        log('\n✅ Successfully pushed to GitHub!', 'green');
        
        // Show repository info
        try {
            const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
            const repoUrl = remoteUrl.replace('.git', '').replace('git@github.com:', 'https://github.com/');
            log(`\n📍 Repository: ${repoUrl}`, 'blue');
            log('📍 Branch: main', 'blue');
        } catch (error) {
            // Ignore if can't get remote URL
        }

        log('\n💡 Cloudflare Pages will automatically deploy your changes', 'yellow');
        log('   Check deployment status in your Cloudflare dashboard', 'yellow');
    } else {
        log('\n❌ Push failed!', 'red');
        log('\nPossible solutions:', 'yellow');
        log('1. Make sure you have push access to the repository', 'yellow');
        log('2. Check if your GitHub token has the necessary permissions', 'yellow');
        log('3. Try running: git push -u origin main', 'yellow');
        process.exit(1);
    }
}

// Run the push script
main().catch((error) => {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
});