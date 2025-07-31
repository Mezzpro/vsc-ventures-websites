#!/usr/bin/env node

/**
 * Create .env file from .env.example
 * Helps users set up their environment quickly
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

async function promptUser(question, defaultValue = '') {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        const prompt = defaultValue ? `${question} (default: ${defaultValue}): ` : `${question}: `;
        rl.question(prompt, (answer) => {
            rl.close();
            resolve(answer || defaultValue);
        });
    });
}

async function main() {
    log('\n🔧 VSCode Ventures - Environment Setup\n', 'green');

    const envPath = path.join(__dirname, '..', '.env');
    const examplePath = path.join(__dirname, '..', '.env.example');

    // Check if .env already exists
    if (fs.existsSync(envPath)) {
        const overwrite = await promptUser('⚠️  .env file already exists. Overwrite? (y/n)', 'n');
        if (overwrite.toLowerCase() !== 'y') {
            log('\n👋 Keeping existing .env file', 'yellow');
            process.exit(0);
        }
    }

    // Check if .env.example exists
    if (!fs.existsSync(examplePath)) {
        log('❌ Error: .env.example file not found', 'red');
        process.exit(1);
    }

    log('Let\'s set up your environment variables:\n', 'blue');

    // Collect user inputs
    const config = {};

    // GitHub Token
    log('📌 GitHub Personal Access Token', 'cyan');
    log('   Get one from: https://github.com/settings/tokens', 'yellow');
    log('   Required scopes: repo (for creating and pushing to repositories)', 'yellow');
    config.GITHUB_TOKEN = await promptUser('GitHub Token');

    if (!config.GITHUB_TOKEN || config.GITHUB_TOKEN === 'ghp_YourGitHubTokenHere') {
        log('\n⚠️  Warning: You\'ll need to add a valid GitHub token to .env before using the scripts', 'yellow');
    }

    // GitHub Username
    config.GITHUB_USERNAME = await promptUser('\nGitHub Username');

    // Repository Configuration
    log('\n📦 Repository Configuration', 'cyan');
    config.REPO_NAME = await promptUser('Repository Name', 'vsc-ventures-websites');
    config.REPO_DESCRIPTION = await promptUser('Repository Description', 'VSCode Ventures - Multi-venture web distribution platform');
    
    const isPrivate = await promptUser('Private Repository? (y/n)', 'n');
    config.REPO_PRIVATE = isPrivate.toLowerCase() === 'y' ? 'true' : 'false';

    // Optional configurations
    log('\n🔧 Optional Configurations (press Enter to skip)', 'cyan');
    config.CLOUDFLARE_API_TOKEN = await promptUser('Cloudflare API Token (optional)');
    config.CLOUDFLARE_ACCOUNT_ID = await promptUser('Cloudflare Account ID (optional)');
    config.ANALYTICS_API_KEY = await promptUser('Analytics API Key (optional)');

    // Create .env file
    log('\n📝 Creating .env file...', 'blue');
    
    let envContent = `# GitHub Configuration
GITHUB_TOKEN=${config.GITHUB_TOKEN || ''}
GITHUB_USERNAME=${config.GITHUB_USERNAME || ''}

# Repository Configuration
REPO_NAME=${config.REPO_NAME}
REPO_DESCRIPTION=${config.REPO_DESCRIPTION}
REPO_PRIVATE=${config.REPO_PRIVATE}

# Optional: Cloudflare Configuration (for future use)
CLOUDFLARE_API_TOKEN=${config.CLOUDFLARE_API_TOKEN || ''}
CLOUDFLARE_ACCOUNT_ID=${config.CLOUDFLARE_ACCOUNT_ID || ''}

# Optional: Analytics Configuration
ANALYTICS_API_KEY=${config.ANALYTICS_API_KEY || ''}
`;

    fs.writeFileSync(envPath, envContent);
    log('✅ .env file created successfully!', 'green');

    // Show next steps
    log('\n📋 Next Steps:', 'yellow');
    log('1. Review your .env file and update any values if needed', 'yellow');
    log('2. Run setup-github.bat to create and push to GitHub', 'yellow');
    log('3. Use push-to-github.bat for future updates', 'yellow');
    
    log('\n🔒 Security Reminder:', 'red');
    log('   Never commit your .env file to git!', 'red');
    log('   The .gitignore is already configured to exclude it.', 'red');
}

// Run the setup
main().catch((error) => {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
});