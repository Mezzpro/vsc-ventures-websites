#!/usr/bin/env node

/**
 * VSCode Ventures V5 - Build System
 * Builds all venture websites for deployment to Cloudflare Pages
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');
const ora = require('ora');

class VentureBuildSystem {
    constructor() {
        this.ventures = [
            'alpha-workspace.com',
            'cyberpunk-code.com', 
            'charlie-pro.com',
            'delta-terminal.com',
            'vsc-ventures.com'
        ];
        
        this.srcDir = process.cwd();
        this.distDir = path.join(process.cwd(), 'dist');
        this.sharedDir = path.join(process.cwd(), 'shared');
    }

    async build() {
        console.log(chalk.blue('🏗️  VSCode Ventures V5 Build System\n'));
        
        try {
            await this.clean();
            await this.createDistStructure();
            await this.buildSharedAssets();
            await this.buildVentures();
            await this.generateMetadata();
            await this.validateBuild();
            
            console.log(chalk.green('\n✅ Build completed successfully!'));
            this.showBuildSummary();
        } catch (error) {
            console.error(chalk.red('\n❌ Build failed:'), error.message);
            process.exit(1);
        }
    }

    async clean() {
        const spinner = ora('Cleaning dist directory...').start();
        
        try {
            await fs.remove(this.distDir);
            spinner.succeed('Cleaned dist directory');
        } catch (error) {
            spinner.fail('Failed to clean dist directory');
            throw error;
        }
    }

    async createDistStructure() {
        const spinner = ora('Creating distribution structure...').start();
        
        try {
            await fs.ensureDir(this.distDir);
            
            for (const venture of this.ventures) {
                await fs.ensureDir(path.join(this.distDir, venture));
            }
            
            spinner.succeed('Created distribution structure');
        } catch (error) {
            spinner.fail('Failed to create distribution structure');
            throw error;
        }
    }

    async buildSharedAssets() {
        const spinner = ora('Building shared assets...').start();
        
        try {
            // Copy shared JavaScript files to each venture
            for (const venture of this.ventures) {
                const ventureSharedDir = path.join(this.distDir, venture, 'shared');
                await fs.copy(this.sharedDir, ventureSharedDir);
            }
            
            spinner.succeed('Built shared assets');
        } catch (error) {
            spinner.fail('Failed to build shared assets');
            throw error;
        }
    }

    async buildVentures() {
        for (const venture of this.ventures) {
            await this.buildVenture(venture);
        }
    }

    async buildVenture(ventureName) {
        const spinner = ora(`Building ${ventureName}...`).start();
        
        try {
            const srcPath = path.join(this.srcDir, ventureName);
            const distPath = path.join(this.distDir, ventureName);
            
            // Check if venture source exists
            if (!await fs.pathExists(srcPath)) {
                spinner.warn(`Source not found for ${ventureName} - skipping`);
                return;
            }
            
            // Copy all venture files
            await fs.copy(srcPath, distPath, {
                filter: (src) => {
                    // Skip certain files/directories
                    const basename = path.basename(src);
                    return !basename.startsWith('.') && 
                           basename !== 'node_modules' &&
                           basename !== 'package.json';
                }
            });
            
            // Process HTML files
            await this.processHTMLFiles(distPath, ventureName);
            
            // Process CSS files
            await this.processCSSFiles(distPath);
            
            // Generate venture-specific files
            await this.generateVentureFiles(distPath, ventureName);
            
            spinner.succeed(`Built ${ventureName}`);
        } catch (error) {
            spinner.fail(`Failed to build ${ventureName}`);
            throw error;
        }
    }

    async processHTMLFiles(distPath, ventureName) {
        const htmlFiles = glob.sync('**/*.html', { cwd: distPath });
        
        for (const htmlFile of htmlFiles) {
            const filePath = path.join(distPath, htmlFile);
            let content = await fs.readFile(filePath, 'utf8');
            
            // Replace venture-specific placeholders
            content = this.replaceVenturePlaceholders(content, ventureName);
            
            // Optimize HTML
            content = this.optimizeHTML(content);
            
            await fs.writeFile(filePath, content);
        }
    }

    async processCSSFiles(distPath) {
        const cssFiles = glob.sync('**/*.css', { cwd: distPath });
        
        for (const cssFile of cssFiles) {
            const filePath = path.join(distPath, cssFile);
            let content = await fs.readFile(filePath, 'utf8');
            
            // Optimize CSS
            content = this.optimizeCSS(content);
            
            await fs.writeFile(filePath, content);
        }
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
                HERO_TITLE: 'Write without distractions',
                HERO_SUBTITLE: 'Alpha Workspace provides a clean, minimal environment designed for writers, content creators, and anyone who values focus over features.',
                CTA_TEXT: 'Download Alpha Workspace',
                CANONICAL_URL: 'https://alpha-workspace.com',
                OG_IMAGE: 'https://alpha-workspace.com/images/alpha-og.png',
                DOWNLOAD_COUNT: '12,847',
                USER_RATING: '4.8★'
            },
            'cyberpunk-code.com': {
                TITLE: 'Cyberpunk Code - High-Contrast Coding Environment',
                DESCRIPTION: 'Dark, neon-themed coding environment for developers who code in the future.',
                VENTURE_NAME: 'Cyberpunk Code',
                VENTURE_NAME_LOWER: 'cyberpunk',
                HERO_TITLE: 'Code in the future',
                HERO_SUBTITLE: 'High-contrast cyberpunk interface designed for developers, programmers, and anyone who embraces the digital frontier.',
                CTA_TEXT: 'Download Cyberpunk Code',
                CANONICAL_URL: 'https://cyberpunk-code.com',
                OG_IMAGE: 'https://cyberpunk-code.com/images/cyberpunk-og.png',
                DOWNLOAD_COUNT: '8,432',
                USER_RATING: '4.9★'
            },
            'holographic-pro.com': {
                TITLE: 'Holographic Pro - Modern Professional Workspace',
                DESCRIPTION: 'Professional workspace with subtle holographic effects for modern business.',
                VENTURE_NAME: 'Holographic Pro',
                VENTURE_NAME_LOWER: 'holographic',
                HERO_TITLE: 'Professional workspace for modern business',
                HERO_SUBTITLE: 'Elegant, professional interface designed for consultants, analysts, and business professionals.',
                CTA_TEXT: 'Download Holographic Pro',
                CANONICAL_URL: 'https://holographic-pro.com',
                OG_IMAGE: 'https://holographic-pro.com/images/holographic-og.png',
                DOWNLOAD_COUNT: '5,291',
                USER_RATING: '4.7★'
            },
            'retro-terminal.com': {
                TITLE: 'Retro Terminal - 1980s Terminal Experience',
                DESCRIPTION: 'Vintage computing experience with authentic CRT monitor aesthetics.',
                VENTURE_NAME: 'Retro Terminal',
                VENTURE_NAME_LOWER: 'retro',
                HERO_TITLE: 'Computing like it\'s 1985',
                HERO_SUBTITLE: 'Authentic retro terminal experience for enthusiasts who appreciate vintage computing aesthetics.',
                CTA_TEXT: 'Download Retro Terminal',
                CANONICAL_URL: 'https://retro-terminal.com',
                OG_IMAGE: 'https://retro-terminal.com/images/retro-og.png',
                DOWNLOAD_COUNT: '3,156',
                USER_RATING: '4.6★'
            },
            'vsc-ventures.com': {
                TITLE: 'VSCode Ventures - Discover Your Perfect Workspace',
                DESCRIPTION: 'Platform discovery site to explore all VSCode Ventures and find your perfect workspace.',
                VENTURE_NAME: 'VSCode Ventures',
                VENTURE_NAME_LOWER: 'platform',
                HERO_TITLE: 'Discover your perfect workspace',
                HERO_SUBTITLE: 'Explore our collection of specialized development environments, each designed for different workflows and preferences.',
                CTA_TEXT: 'Explore All Workspaces',
                CANONICAL_URL: 'https://vsc-ventures.com',
                OG_IMAGE: 'https://vsc-ventures.com/images/platform-og.png',
                DOWNLOAD_COUNT: '29,726',
                USER_RATING: '4.8★'
            }
        };
        
        return configs[ventureName] || {};
    }

    optimizeHTML(content) {
        // Basic HTML optimization
        return content
            .replace(/\s+/g, ' ')                    // Collapse whitespace
            .replace(/> </g, '><')                   // Remove space between tags
            .replace(/<!--[\s\S]*?-->/g, '')         // Remove comments
            .trim();
    }

    optimizeCSS(content) {
        // Basic CSS optimization
        return content
            .replace(/\/\*[\s\S]*?\*\//g, '')        // Remove comments
            .replace(/\s+/g, ' ')                    // Collapse whitespace
            .replace(/; /g, ';')                     // Remove space after semicolon
            .replace(/ {/g, '{')                     // Remove space before brace
            .replace(/} /g, '}')                     // Remove space after brace
            .trim();
    }

    async generateVentureFiles(distPath, ventureName) {
        // Generate robots.txt
        await this.generateRobotsTxt(distPath, ventureName);
        
        // Generate sitemap.xml
        await this.generateSitemap(distPath, ventureName);
        
        // Generate manifest.json
        await this.generateManifest(distPath, ventureName);
        
        // Generate download info
        await this.generateDownloadInfo(distPath, ventureName);
    }

    async generateRobotsTxt(distPath, ventureName) {
        const domain = ventureName;
        const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://${domain}/sitemap.xml

# VSCode Ventures V5 - ${ventureName}
`;
        
        await fs.writeFile(path.join(distPath, 'robots.txt'), robotsTxt);
    }

    async generateSitemap(distPath, ventureName) {
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
    <url>
        <loc>https://${domain}/features/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>https://${domain}/support/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
</urlset>`;
        
        await fs.writeFile(path.join(distPath, 'sitemap.xml'), sitemap);
    }

    async generateManifest(distPath, ventureName) {
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
                },
                {
                    src: "/icon-512.png", 
                    sizes: "512x512",
                    type: "image/png"
                }
            ]
        };
        
        await fs.writeFile(
            path.join(distPath, 'manifest.json'), 
            JSON.stringify(manifest, null, 2)
        );
    }

    async generateDownloadInfo(distPath, ventureName) {
        const config = this.getVentureConfig(ventureName);
        const downloadInfo = {
            venture: config.VENTURE_NAME_LOWER || ventureName,
            version: "1.0.0",
            size: "8.5 MB",
            downloadCount: parseInt((config.DOWNLOAD_COUNT || '1000').replace(/,/g, '')),
            lastUpdated: new Date().toISOString(),
            checksums: {
                sha256: "placeholder-checksum-will-be-generated-on-server"
            },
            compatibility: ["Windows 10", "Windows 11"],
            requirements: {
                minMemory: "4GB",
                minDisk: "100MB"
            }
        };
        
        await fs.ensureDir(path.join(distPath, 'download'));
        await fs.writeFile(
            path.join(distPath, 'download', 'download-info.json'),
            JSON.stringify(downloadInfo, null, 2)
        );
    }

    async generateMetadata() {
        const spinner = ora('Generating build metadata...').start();
        
        try {
            const metadata = {
                buildTime: new Date().toISOString(),
                version: "5.0.0",
                ventures: this.ventures,
                buildSystem: "VSCode Ventures V5 Build System",
                nodeVersion: process.version,
            };
            
            await fs.writeFile(
                path.join(this.distDir, 'build-metadata.json'),
                JSON.stringify(metadata, null, 2)
            );
            
            spinner.succeed('Generated build metadata');
        } catch (error) {
            spinner.fail('Failed to generate build metadata');
            throw error;
        }
    }

    async validateBuild() {
        const spinner = ora('Validating build...').start();
        
        try {
            // Check that all ventures have required files
            for (const venture of this.ventures) {
                const venturePath = path.join(this.distDir, venture);
                
                if (!await fs.pathExists(venturePath)) {
                    throw new Error(`Missing venture directory: ${venture}`);
                }
                
                const requiredFiles = ['robots.txt', 'sitemap.xml', 'manifest.json'];
                for (const file of requiredFiles) {
                    if (!await fs.pathExists(path.join(venturePath, file))) {
                        console.warn(`⚠️  Missing ${file} for ${venture}`);
                    }
                }
            }
            
            spinner.succeed('Build validation completed');
        } catch (error) {
            spinner.fail('Build validation failed');
            throw error;
        }
    }

    showBuildSummary() {
        console.log(chalk.cyan('\n📊 Build Summary:'));
        console.log(`• Ventures built: ${this.ventures.length}`);
        console.log(`• Output directory: ${this.distDir}`);
        console.log(`• Build time: ${new Date().toLocaleString()}`);
        
        console.log(chalk.cyan('\n🚀 Ready for deployment to Cloudflare Pages!'));
        console.log(chalk.gray('Run "npm run deploy" to deploy all ventures.'));
    }
}

// Run build if called directly
if (require.main === module) {
    const builder = new VentureBuildSystem();
    builder.build().catch(console.error);
}

module.exports = VentureBuildSystem;