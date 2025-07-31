#!/usr/bin/env node

/**
 * VSCode Ventures V5 - Simple Build System (No Dependencies)
 * Basic build system using only Node.js built-in modules
 */

const fs = require('fs');
const path = require('path');

class SimpleBuildSystem {
    constructor() {
        this.ventures = [
            'alpha-workspace.com'
        ];
        
        this.srcDir = process.cwd();
        this.distDir = path.join(process.cwd(), 'dist');
    }

    async build() {
        console.log('🏗️  VSCode Ventures V5 Simple Build System\n');
        
        try {
            this.clean();
            this.createDistStructure();
            this.buildVentures();
            this.generateMetadata();
            
            console.log('\n✅ Build completed successfully!');
            this.showBuildSummary();
        } catch (error) {
            console.error('\n❌ Build failed:', error.message);
            process.exit(1);
        }
    }

    clean() {
        console.log('🧹 Cleaning dist directory...');
        
        if (fs.existsSync(this.distDir)) {
            this.removeDirectory(this.distDir);
        }
        
        console.log('✅ Cleaned dist directory');
    }

    removeDirectory(dir) {
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.isDirectory()) {
                    this.removeDirectory(filePath);
                } else {
                    fs.unlinkSync(filePath);
                }
            }
            
            fs.rmdirSync(dir);
        }
    }

    createDistStructure() {
        console.log('📁 Creating distribution structure...');
        
        if (!fs.existsSync(this.distDir)) {
            fs.mkdirSync(this.distDir);
        }
        
        for (const venture of this.ventures) {
            const ventureDir = path.join(this.distDir, venture);
            if (!fs.existsSync(ventureDir)) {
                fs.mkdirSync(ventureDir);
            }
        }
        
        console.log('✅ Created distribution structure');
    }

    buildVentures() {
        for (const venture of this.ventures) {
            this.buildVenture(venture);
        }
    }

    buildVenture(ventureName) {
        console.log(`🔨 Building ${ventureName}...`);
        
        const srcPath = path.join(this.srcDir, ventureName);
        const distPath = path.join(this.distDir, ventureName);
        
        if (!fs.existsSync(srcPath)) {
            console.log(`⚠️  Source not found for ${ventureName} - skipping`);
            return;
        }
        
        // Copy all venture files
        this.copyDirectory(srcPath, distPath);
        
        // Copy shared directory
        const sharedSrc = path.join(this.srcDir, 'shared');
        const sharedDist = path.join(distPath, 'shared');
        
        if (fs.existsSync(sharedSrc)) {
            this.copyDirectory(sharedSrc, sharedDist);
        }
        
        // Process HTML files
        this.processHTMLFiles(distPath, ventureName);
        
        // Generate venture-specific files
        this.generateVentureFiles(distPath, ventureName);
        
        console.log(`✅ Built ${ventureName}`);
    }

    copyDirectory(src, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const files = fs.readdirSync(src);
        
        for (const file of files) {
            const srcFile = path.join(src, file);
            const destFile = path.join(dest, file);
            const stats = fs.statSync(srcFile);
            
            if (stats.isDirectory()) {
                this.copyDirectory(srcFile, destFile);
            } else {
                // Skip certain files
                if (file.startsWith('.') || file === 'package.json') {
                    continue;
                }
                
                fs.copyFileSync(srcFile, destFile);
            }
        }
    }

    processHTMLFiles(distPath, ventureName) {
        const htmlFiles = this.findFiles(distPath, '.html');
        
        for (const htmlFile of htmlFiles) {
            let content = fs.readFileSync(htmlFile, 'utf8');
            
            // Replace venture-specific placeholders
            content = this.replaceVenturePlaceholders(content, ventureName);
            
            fs.writeFileSync(htmlFile, content);
        }
    }

    findFiles(dir, extension) {
        let results = [];
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.isDirectory()) {
                results = results.concat(this.findFiles(filePath, extension));
            } else if (file.endsWith(extension)) {
                results.push(filePath);
            }
        }
        
        return results;
    }

    replaceVenturePlaceholders(content, ventureName) {
        const ventureConfig = this.getVentureConfig(ventureName);
        
        // Replace all placeholders
        Object.entries(ventureConfig).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            content = content.replace(new RegExp(placeholder, 'g'), value);
        });
        
        return content;
    }

    getVentureConfig(ventureName) {
        const configs = {
            'alpha-workspace.com': {
                TITLE: 'Alpha Workspace - Distraction-Free Writing & Productivity',
                DESCRIPTION: 'Clean, minimal writing environment designed for writers, content creators, and anyone who values focus.',
                VENTURE_NAME: 'Alpha Workspace',
                VENTURE_NAME_LOWER: 'alpha',
                CANONICAL_URL: 'https://alpha-workspace.com',
                OG_IMAGE: 'https://alpha-workspace.com/images/alpha-og.png',
                DOWNLOAD_COUNT: '12,847',
                USER_RATING: '4.8★'
            }
        };
        
        return configs[ventureName] || {};
    }

    generateVentureFiles(distPath, ventureName) {
        // Generate robots.txt
        this.generateRobotsTxt(distPath, ventureName);
        
        // Generate sitemap.xml
        this.generateSitemap(distPath, ventureName);
        
        // Generate manifest.json
        this.generateManifest(distPath, ventureName);
    }

    generateRobotsTxt(distPath, ventureName) {
        const domain = ventureName;
        const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://${domain}/sitemap.xml

# VSCode Ventures V5 - ${ventureName}
`;
        
        fs.writeFileSync(path.join(distPath, 'robots.txt'), robotsTxt);
    }

    generateSitemap(distPath, ventureName) {
        const domain = ventureName;
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://${domain}/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://${domain}/download/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
</urlset>`;
        
        fs.writeFileSync(path.join(distPath, 'sitemap.xml'), sitemap);
    }

    generateManifest(distPath, ventureName) {
        const config = this.getVentureConfig(ventureName);
        const manifest = {
            name: config.VENTURE_NAME || ventureName,
            short_name: config.VENTURE_NAME_LOWER || ventureName,
            description: config.DESCRIPTION || '',
            start_url: "/",
            display: "standalone",
            background_color: "#ffffff",
            theme_color: "#667eea",
            icons: [
                {
                    src: "/icon-192.png",
                    sizes: "192x192",
                    type: "image/png"
                }
            ]
        };
        
        fs.writeFileSync(
            path.join(distPath, 'manifest.json'), 
            JSON.stringify(manifest, null, 2)
        );
    }

    generateMetadata() {
        console.log('📊 Generating build metadata...');
        
        const metadata = {
            buildTime: new Date().toISOString(),
            version: "5.0.0",
            ventures: this.ventures,
            buildSystem: "VSCode Ventures V5 Simple Build System",
            nodeVersion: process.version,
        };
        
        fs.writeFileSync(
            path.join(this.distDir, 'build-metadata.json'),
            JSON.stringify(metadata, null, 2)
        );
        
        console.log('✅ Generated build metadata');
    }

    showBuildSummary() {
        console.log('\n📊 Build Summary:');
        console.log(`• Ventures built: ${this.ventures.length}`);
        console.log(`• Output directory: ${this.distDir}`);
        console.log(`• Build time: ${new Date().toLocaleString()}`);
        
        console.log('\n🚀 Ready for deployment to Cloudflare Pages!');
    }
}

// Run build if called directly
if (require.main === module) {
    const builder = new SimpleBuildSystem();
    builder.build().catch(console.error);
}

module.exports = SimpleBuildSystem;