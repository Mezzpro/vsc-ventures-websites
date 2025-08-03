#!/usr/bin/env node

/**
 * Charlie Pro - Ultra Minimal Build (Debug)
 * Just copy files, no processing
 */

const fs = require('fs');
const path = require('path');

console.log('Charlie Minimal Build Starting...');

const srcDir = path.join(__dirname, '..', 'charlie-pro.com');
const distDir = path.join(__dirname, '..', 'dist', 'charlie-pro.com');

console.log('Source:', srcDir);
console.log('Dest:', distDir);

// Create dist directory
fs.mkdirSync(distDir, { recursive: true });

// Copy files
function copyDir(src, dest) {
    const items = fs.readdirSync(src);
    for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.statSync(srcPath).isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
            console.log('Copied:', item);
        }
    }
}

copyDir(srcDir, distDir);
console.log('Charlie Minimal Build Complete!');