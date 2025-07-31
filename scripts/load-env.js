/**
 * Simple .env file loader
 * Loads environment variables from .env file
 */

const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    
    // Check if .env file exists
    if (!fs.existsSync(envPath)) {
        console.log('⚠️  No .env file found. Using example file as template...');
        
        // Check if .env.example exists
        const examplePath = path.join(__dirname, '..', '.env.example');
        if (fs.existsSync(examplePath)) {
            console.log('📋 Please create a .env file based on .env.example');
            console.log(`   Copy ${examplePath} to ${envPath}`);
            console.log('   Then update it with your actual values');
        }
        return false;
    }
    
    // Read and parse .env file
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
        // Skip empty lines and comments
        if (!line || line.trim().startsWith('#')) return;
        
        // Parse key=value
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        
        if (key && value) {
            process.env[key.trim()] = value;
        }
    });
    
    return true;
}

// Export for use in other scripts
module.exports = { loadEnv };