#!/usr/bin/env node

/**
 * Charlie Pro - Standalone Build System
 * Self-contained build with embedded analytics and security
 */

const fs = require('fs');
const path = require('path');

class CharlieBuildSystem {
    constructor() {
        this.srcDir = process.cwd();
        this.distDir = path.join(process.cwd(), 'dist');
        this.ventureDir = 'charlie-pro.com';
    }

    async build() {
        console.log('🏗️  Charlie Pro Standalone Build System\n');
        
        try {
            await this.clean();
            await this.createDistStructure();
            await this.buildCharlie();
            await this.embedResources();
            await this.generateMetadata();
            
            console.log('\n✅ Charlie Pro build completed successfully!');
            this.showBuildSummary();
        } catch (error) {
            console.error('\n❌ Charlie Pro build failed:', error.message);
            process.exit(1);
        }
    }

    async clean() {
        console.log('🧹 Cleaning Charlie dist directory...');
        const charlieDistPath = path.join(this.distDir, this.ventureDir);
        if (fs.existsSync(charlieDistPath)) {
            fs.rmSync(charlieDistPath, { recursive: true, force: true });
        }
        console.log('✅ Cleaned Charlie dist directory');
    }

    async createDistStructure() {
        console.log('📁 Creating Charlie distribution structure...');
        const charlieDistPath = path.join(this.distDir, this.ventureDir);
        fs.mkdirSync(charlieDistPath, { recursive: true });
        console.log('✅ Created Charlie distribution structure');
    }

    async buildCharlie() {
        console.log('🔨 Building charlie-pro.com...');
        const srcPath = path.join(this.srcDir, this.ventureDir);
        const distPath = path.join(this.distDir, this.ventureDir);

        // Copy all files from source to dist
        this.copyDirectory(srcPath, distPath);
        console.log('✅ Built charlie-pro.com');
    }

    async embedResources() {
        console.log('📦 Embedding Charlie resources...');
        const indexPath = path.join(this.distDir, this.ventureDir, 'index.html');
        
        if (fs.existsSync(indexPath)) {
            let indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Remove external script references that cause loading issues
            indexContent = indexContent.replace(
                /<script src=".*?shared\/.*?".*?><\/script>/g, 
                ''
            );
            
            // Embed minimal analytics directly
            const embeddedAnalytics = `
<script>
// Charlie Pro Embedded Analytics
(function() {
    console.log('Charlie Pro Analytics: Page loaded');
    
    // Track downloads
    document.addEventListener('click', function(e) {
        if (e.target.href && e.target.href.includes('.exe')) {
            console.log('Charlie Pro Download:', e.target.href);
        }
    });
    
    // Basic page tracking
    window.charlieAnalytics = {
        track: function(event, data) {
            console.log('Charlie Pro Event:', event, data);
        }
    };
})();
</script>`;

            // Insert before closing head tag
            indexContent = indexContent.replace('</head>', embeddedAnalytics + '\n</head>');
            
            fs.writeFileSync(indexPath, indexContent);
        }
        console.log('✅ Embedded Charlie resources');
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
        console.log('📊 Generating Charlie build metadata...');
        const metadata = {
            venture: 'charlie-pro',
            buildTime: new Date().toISOString(),
            version: '1.1.0',
            files: this.getFileList(path.join(this.distDir, this.ventureDir))
        };
        
        fs.writeFileSync(
            path.join(this.distDir, this.ventureDir, 'build-metadata.json'),
            JSON.stringify(metadata, null, 2)
        );
        console.log('✅ Generated Charlie build metadata');
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
        console.log('\n📊 Charlie Pro Build Summary:');
        console.log('• Venture: Charlie Pro');
        console.log(`• Output directory: ${path.join(this.distDir, this.ventureDir)}`);
        console.log(`• Build time: ${new Date().toLocaleString()}`);
        console.log('\n🚀 Charlie Pro ready for deployment to Cloudflare Pages!');
    }
}

// Run build if called directly
if (require.main === module) {
    const builder = new CharlieBuildSystem();
    builder.build().catch(console.error);
}

module.exports = CharlieBuildSystem;