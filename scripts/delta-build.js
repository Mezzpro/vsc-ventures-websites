#!/usr/bin/env node

/**
 * Delta Terminal - Standalone Build System
 * Self-contained build with embedded analytics and security
 */

const fs = require('fs');
const path = require('path');

class DeltaBuildSystem {
    constructor() {
        this.srcDir = process.cwd();
        this.distDir = path.join(process.cwd(), 'dist');
        this.ventureDir = 'delta-terminal.com';
    }

    async build() {
        console.log('🏗️  Delta Terminal Standalone Build System\n');
        
        try {
            await this.clean();
            await this.createDistStructure();
            await this.buildDelta();
            await this.embedResources();
            await this.generateMetadata();
            
            console.log('\n✅ Delta Terminal build completed successfully!');
            this.showBuildSummary();
        } catch (error) {
            console.error('\n❌ Delta Terminal build failed:', error.message);
            process.exit(1);
        }
    }

    async clean() {
        console.log('🧹 Cleaning Delta dist directory...');
        const deltaDistPath = path.join(this.distDir, this.ventureDir);
        if (fs.existsSync(deltaDistPath)) {
            fs.rmSync(deltaDistPath, { recursive: true, force: true });
        }
        console.log('✅ Cleaned Delta dist directory');
    }

    async createDistStructure() {
        console.log('📁 Creating Delta distribution structure...');
        const deltaDistPath = path.join(this.distDir, this.ventureDir);
        fs.mkdirSync(deltaDistPath, { recursive: true });
        console.log('✅ Created Delta distribution structure');
    }

    async buildDelta() {
        console.log('🔨 Building delta-terminal.com...');
        const srcPath = path.join(this.srcDir, this.ventureDir);
        const distPath = path.join(this.distDir, this.ventureDir);

        // Copy all files from source to dist
        this.copyDirectory(srcPath, distPath);
        console.log('✅ Built delta-terminal.com');
    }

    async embedResources() {
        console.log('📦 Embedding Delta resources...');
        const indexPath = path.join(this.distDir, this.ventureDir, 'index.html');
        
        if (fs.existsSync(indexPath)) {
            let indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Remove external script references that cause loading issues
            indexContent = indexContent.replace(
                /<script src=".*?shared\/.*?".*?><\/script>/g, 
                ''
            );
            
            // Embed minimal analytics directly with retro theme
            const embeddedAnalytics = `
<script>
// Delta Terminal Embedded Analytics
(function() {
    console.log('[SYSTEM] Delta Terminal initialized');
    
    // Track downloads with retro styling
    document.addEventListener('click', function(e) {
        if (e.target.href && e.target.href.includes('.exe')) {
            console.log('[DOWNLOAD] System package:', e.target.href);
        }
    });
    
    // Retro terminal effects
    document.addEventListener('DOMContentLoaded', function() {
        // Add scan lines effect if not present
        if (!document.querySelector('.scanlines')) {
            const scanlines = document.createElement('div');
            scanlines.className = 'scanlines';
            scanlines.style.cssText = \`
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                background: linear-gradient(transparent 50%, rgba(0,255,0,0.03) 50%);
                background-size: 100% 4px;
                z-index: 1000;
            \`;
            document.body.appendChild(scanlines);
        }
    });
    
    // Basic terminal tracking
    window.deltaAnalytics = {
        track: function(event, data) {
            console.log('[ANALYTICS]', event, data);
        }
    };
})();
</script>`;

            // Insert before closing head tag
            indexContent = indexContent.replace('</head>', embeddedAnalytics + '\n</head>');
            
            fs.writeFileSync(indexPath, indexContent);
        }
        console.log('✅ Embedded Delta resources');
    }

    copyDirectory(src, dest) {
        if (!fs.existsSync(src)) return;
        
        fs.mkdirSync(dest, { recursive: true });
        const items = fs.readdirSync(src);
        
        for (const item of items) {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            
            if (fs.statSync(srcPath).isDirectory()) {
                this.copyDirectory(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    async generateMetadata() {
        console.log('📊 Generating Delta build metadata...');
        const metadata = {
            venture: 'delta-terminal',
            buildTime: new Date().toISOString(),
            version: '1.1.0',
            files: this.getFileList(path.join(this.distDir, this.ventureDir))
        };
        
        fs.writeFileSync(
            path.join(this.distDir, this.ventureDir, 'build-metadata.json'),
            JSON.stringify(metadata, null, 2)
        );
        console.log('✅ Generated Delta build metadata');
    }

    getFileList(dir) {
        const files = [];
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
            if (item.isFile()) {
                files.push(item.name);
            } else if (item.isDirectory()) {
                const subFiles = this.getFileList(path.join(dir, item.name));
                files.push(...subFiles.map(f => `${item.name}/${f}`));
            }
        }
        return files;
    }

    showBuildSummary() {
        console.log('\n📊 Delta Terminal Build Summary:');
        console.log('• Venture: Delta Terminal');
        console.log(`• Output directory: ${path.join(this.distDir, this.ventureDir)}`);
        console.log(`• Build time: ${new Date().toLocaleString()}`);
        console.log('\n🚀 Delta Terminal ready for deployment to Cloudflare Pages!');
    }
}

// Run build if called directly
if (require.main === module) {
    const builder = new DeltaBuildSystem();
    builder.build().catch(console.error);
}

module.exports = DeltaBuildSystem;