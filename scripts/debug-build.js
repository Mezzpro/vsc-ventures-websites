#!/usr/bin/env node

/**
 * VSCode Ventures V5 - Debug Build System
 * Same as simple-build.js but with extensive debugging for timeout issues
 * USE ONLY FOR CHARLIE AND DELTA - DO NOT USE FOR WORKING SITES
 */

const fs = require('fs');
const path = require('path');

class DebugBuildSystem {
    constructor() {
        console.log('🐛 DEBUG BUILD SYSTEM STARTING...');
        console.log('📋 This is a DEBUG version - only use for non-working sites!');
        
        this.ventures = [
            'charlie-pro.com',      // Only Charlie
            'delta-terminal.com'    // Only Delta
        ];
        
        this.srcDir = process.cwd();
        this.distDir = path.join(process.cwd(), 'dist');
        
        console.log('🔍 Source directory:', this.srcDir);
        console.log('🔍 Dist directory:', this.distDir);
    }

    async build() {
        console.log('🏗️  VSCode Ventures V5 Debug Build System\n');
        console.log('⚠️  DEBUG MODE: Extra logging enabled for timeout detection\n');
        
        try {
            console.log('📝 Step 1: Cleaning...');
            this.clean();
            
            console.log('📝 Step 2: Creating structure...');
            this.createDistStructure();
            
            console.log('📝 Step 3: Building ventures...');
            this.buildVentures();
            
            console.log('📝 Step 4: Generating metadata...');
            this.generateMetadata();
            
            console.log('\n✅ DEBUG BUILD COMPLETED SUCCESSFULLY!');
            this.showBuildSummary();
        } catch (error) {
            console.error('\n❌ DEBUG BUILD FAILED:', error.message);
            console.error('🔍 Stack trace:', error.stack);
            process.exit(1);
        }
    }

    clean() {
        console.log('🧹 [DEBUG] Cleaning dist directory...');
        console.log('🔍 Checking if dist exists:', fs.existsSync(this.distDir));
        
        if (fs.existsSync(this.distDir)) {
            console.log('🗑️ Removing existing dist directory...');
            this.removeDirectory(this.distDir);
            console.log('✅ Dist directory removed');
        } else {
            console.log('ℹ️ Dist directory doesn\'t exist - nothing to clean');
        }
        
        console.log('✅ [DEBUG] Cleaned dist directory');
    }

    removeDirectory(dir) {
        console.log('🔍 [DEBUG] Removing directory:', dir);
        
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            console.log(`🔍 Found ${files.length} items to remove`);
            
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.isDirectory()) {
                    console.log(`📁 Removing subdirectory: ${file}`);
                    this.removeDirectory(filePath);
                } else {
                    console.log(`📄 Removing file: ${file}`);
                    fs.unlinkSync(filePath);
                }
            }
            
            fs.rmdirSync(dir);
            console.log(`✅ Removed directory: ${dir}`);
        }
    }

    createDistStructure() {
        console.log('📁 [DEBUG] Creating distribution structure...');
        
        if (!fs.existsSync(this.distDir)) {
            console.log('📁 Creating main dist directory...');
            fs.mkdirSync(this.distDir);
        }
        
        for (const venture of this.ventures) {
            const ventureDir = path.join(this.distDir, venture);
            console.log(`📁 Creating directory for ${venture}...`);
            
            if (!fs.existsSync(ventureDir)) {
                fs.mkdirSync(ventureDir);
                console.log(`✅ Created: ${ventureDir}`);
            } else {
                console.log(`ℹ️ Already exists: ${ventureDir}`);
            }
        }
        
        console.log('✅ [DEBUG] Created distribution structure');
    }

    buildVentures() {
        console.log(`🔨 [DEBUG] Building ${this.ventures.length} ventures...`);
        
        for (const venture of this.ventures) {
            console.log(`\n🎯 [DEBUG] Starting build for: ${venture}`);
            this.buildVenture(venture);
            console.log(`✅ [DEBUG] Completed build for: ${venture}`);
        }
    }

    buildVenture(ventureName) {
        console.log(`🔨 [DEBUG] Building ${ventureName}...`);
        
        const srcPath = path.join(this.srcDir, ventureName);
        const distPath = path.join(this.distDir, ventureName);
        
        console.log(`🔍 Source path: ${srcPath}`);
        console.log(`🔍 Dest path: ${distPath}`);
        console.log(`🔍 Source exists: ${fs.existsSync(srcPath)}`);
        
        if (!fs.existsSync(srcPath)) {
            console.log(`⚠️ [DEBUG] Source not found for ${ventureName} - skipping`);
            return;
        }
        
        // Copy all venture files
        console.log(`📋 [DEBUG] Copying venture files...`);
        this.copyDirectory(srcPath, distPath);
        
        // Skip shared directory (potential cause of issues)
        console.log(`⚠️ [DEBUG] SKIPPING shared directory to avoid timeout issues`);
        
        // Process HTML files with debugging
        console.log(`🔧 [DEBUG] Processing HTML files...`);
        this.processHTMLFiles(distPath, ventureName);
        
        // Generate venture-specific files
        console.log(`📄 [DEBUG] Generating venture files...`);
        this.generateVentureFiles(distPath, ventureName);
        
        console.log(`✅ [DEBUG] Built ${ventureName}`);
    }

    copyDirectory(src, dest) {
        console.log(`📋 [DEBUG] Copying: ${src} -> ${dest}`);
        
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
            console.log(`📁 Created destination: ${dest}`);
        }
        
        const files = fs.readdirSync(src);
        console.log(`🔍 Found ${files.length} items to copy`);
        
        for (const file of files) {
            const srcFile = path.join(src, file);
            const destFile = path.join(dest, file);
            const stats = fs.statSync(srcFile);
            
            if (stats.isDirectory()) {
                console.log(`📁 Copying directory: ${file}`);
                this.copyDirectory(srcFile, destFile);
            } else {
                // Skip certain files
                if (file.startsWith('.') || file === 'package.json') {
                    console.log(`⏭️ Skipping: ${file}`);
                    continue;
                }
                
                console.log(`📄 Copying file: ${file} (${stats.size} bytes)`);
                fs.copyFileSync(srcFile, destFile);
            }
        }
        
        console.log(`✅ Completed copying: ${src}`);
    }

    processHTMLFiles(distPath, ventureName) {
        console.log(`🔧 [DEBUG] Processing HTML files for ${ventureName}...`);
        
        const htmlFiles = this.findFiles(distPath, '.html');
        console.log(`🔍 Found ${htmlFiles.length} HTML files`);
        
        for (const htmlFile of htmlFiles) {
            console.log(`🔧 Processing: ${htmlFile}`);
            
            let content = fs.readFileSync(htmlFile, 'utf8');
            console.log(`📊 File size: ${content.length} characters`);
            
            // Look for potential timeout-causing elements
            this.debugHTMLContent(content, htmlFile);
            
            // Replace venture-specific placeholders
            content = this.replaceVenturePlaceholders(content, ventureName);
            
            fs.writeFileSync(htmlFile, content);
            console.log(`✅ Processed: ${htmlFile}`);
        }
    }

    debugHTMLContent(content, filePath) {
        console.log(`🔍 [DEBUG] Analyzing HTML content: ${filePath}`);
        
        // Check for external resources that might cause timeouts
        const externalScripts = content.match(/<script[^>]*src[^>]*>/g) || [];
        const externalCSS = content.match(/<link[^>]*href[^>]*>/g) || [];
        const images = content.match(/<img[^>]*src[^>]*>/g) || [];
        
        console.log(`🔍 External scripts: ${externalScripts.length}`);
        externalScripts.forEach(script => console.log(`   📜 ${script}`));
        
        console.log(`🔍 External CSS: ${externalCSS.length}`);
        externalCSS.forEach(css => console.log(`   🎨 ${css}`));
        
        console.log(`🔍 Images: ${images.length}`);
        images.forEach(img => console.log(`   🖼️ ${img.substring(0, 80)}...`));
        
        // Check for favicon
        if (content.includes('favicon.ico')) {
            console.log(`⚠️ [DEBUG] FAVICON DETECTED - potential timeout cause!`);
        }
        
        // Check for shared directory references
        if (content.includes('../shared/') || content.includes('/shared/')) {
            console.log(`⚠️ [DEBUG] SHARED DIRECTORY REFERENCE DETECTED - potential timeout cause!`);
        }
    }

    findFiles(dir, extension) {
        console.log(`🔍 [DEBUG] Finding ${extension} files in: ${dir}`);
        
        let results = [];
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.isDirectory()) {
                results = results.concat(this.findFiles(filePath, extension));
            } else if (file.endsWith(extension)) {
                console.log(`✅ Found: ${filePath}`);
                results.push(filePath);
            }
        }
        
        return results;
    }

    replaceVenturePlaceholders(content, ventureName) {
        console.log(`🔧 [DEBUG] Replacing placeholders for: ${ventureName}`);
        
        const ventureConfig = this.getVentureConfig(ventureName);
        console.log(`🔍 Config keys: ${Object.keys(ventureConfig).join(', ')}`);
        
        // Replace all placeholders
        Object.entries(ventureConfig).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            const matches = (content.match(new RegExp(placeholder, 'g')) || []).length;
            if (matches > 0) {
                console.log(`🔄 Replacing ${matches} instances of ${placeholder}`);
            }
            content = content.replace(new RegExp(placeholder, 'g'), value);
        });
        
        return content;
    }

    getVentureConfig(ventureName) {
        const configs = {
            'charlie-pro.com': {
                TITLE: 'Charlie Pro - Holographic Professional Workspace',
                DESCRIPTION: 'Future-focused professional environment with holographic effects and advanced business workflows.',
                VENTURE_NAME: 'Charlie Pro',
                VENTURE_NAME_LOWER: 'charlie',
                CANONICAL_URL: 'https://charlie-pro.com',
                OG_IMAGE: 'https://charlie-pro.com/images/charlie-og.png',
                DOWNLOAD_COUNT: '6,238',
                USER_RATING: '4.7★'
            },
            'delta-terminal.com': {
                TITLE: 'Delta Terminal - Vintage Computing Experience',
                DESCRIPTION: 'Relive the golden age of computing with authentic 1980s amber terminal interface and vintage aesthetics.',
                VENTURE_NAME: 'Delta Terminal',
                VENTURE_NAME_LOWER: 'delta',
                CANONICAL_URL: 'https://delta-terminal.com',
                OG_IMAGE: 'https://delta-terminal.com/images/delta-og.png',
                DOWNLOAD_COUNT: '4,156',
                USER_RATING: '4.6★'
            }
        };
        
        return configs[ventureName] || {};
    }

    generateVentureFiles(distPath, ventureName) {
        console.log(`📄 [DEBUG] Generating venture files for: ${ventureName}`);
        
        // Generate robots.txt
        console.log(`🤖 Generating robots.txt...`);
        this.generateRobotsTxt(distPath, ventureName);
        
        // Generate sitemap.xml
        console.log(`🗺️ Generating sitemap.xml...`);
        this.generateSitemap(distPath, ventureName);
        
        // Generate manifest.json
        console.log(`📱 Generating manifest.json...`);
        this.generateManifest(distPath, ventureName);
        
        console.log(`✅ Generated all venture files for: ${ventureName}`);
    }

    generateRobotsTxt(distPath, ventureName) {
        const domain = ventureName;
        const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://${domain}/sitemap.xml

# VSCode Ventures V5 - ${ventureName} (DEBUG BUILD)
`;
        
        fs.writeFileSync(path.join(distPath, 'robots.txt'), robotsTxt);
        console.log(`✅ Created robots.txt for ${ventureName}`);
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
        console.log(`✅ Created sitemap.xml for ${ventureName}`);
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
        console.log(`✅ Created manifest.json for ${ventureName}`);
    }

    generateMetadata() {
        console.log('📊 [DEBUG] Generating build metadata...');
        
        const metadata = {
            buildTime: new Date().toISOString(),
            version: "5.0.0-debug",
            ventures: this.ventures,
            buildSystem: "VSCode Ventures V5 DEBUG Build System",
            nodeVersion: process.version,
            debugMode: true,
            warnings: [
                "This is a DEBUG build with extensive logging",
                "Only use for troubleshooting Charlie and Delta",
                "Do not use for production Alpha and Bravo sites"
            ]
        };
        
        fs.writeFileSync(
            path.join(this.distDir, 'debug-build-metadata.json'),
            JSON.stringify(metadata, null, 2)
        );
        
        console.log('✅ [DEBUG] Generated build metadata');
    }

    showBuildSummary() {
        console.log('\n📊 DEBUG BUILD SUMMARY:');
        console.log('🐛 Build System: DEBUG VERSION');
        console.log(`📁 Ventures built: ${this.ventures.join(', ')}`);
        console.log(`📂 Output directory: ${this.distDir}`);
        console.log(`⏰ Build time: ${new Date().toLocaleString()}`);
        console.log('\n⚠️ IMPORTANT: This is a DEBUG build - check logs for timeout clues!');
        console.log('🚀 Ready for deployment to Cloudflare Pages!');
    }
}

// Run build if called directly
if (require.main === module) {
    const builder = new DebugBuildSystem();
    builder.build().catch(console.error);
}

module.exports = DebugBuildSystem;