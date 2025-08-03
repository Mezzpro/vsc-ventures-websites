#!/usr/bin/env node

/**
 * Multi-Venture Local Server for Testing All VSC Ventures
 * Serves all ventures on different ports for performance testing
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class MultiVentureServer {
    constructor() {
        this.ventures = [
            { name: 'alpha-workspace.com', port: 3000, path: 'alpha-workspace.com' },
            { name: 'bravo-code.com', port: 3001, path: 'bravo-code.com' },
            { name: 'charlie-pro.com', port: 3002, path: 'charlie-pro.com' },
            { name: 'delta-terminal.com', port: 3003, path: 'delta-terminal.com' },
            { name: 'vsc-ventures.com', port: 3004, path: 'vsc-ventures.com' }
        ];
        this.servers = [];
    }

    startAll() {
        console.log('\n🚀 Multi-Venture Local Test Server');
        console.log('=====================================\n');

        for (const venture of this.ventures) {
            this.startVentureServer(venture);
        }

        console.log('\n📊 Performance Testing URLs:');
        for (const venture of this.ventures) {
            console.log(`   ${venture.name}: http://localhost:${venture.port}`);
        }
        console.log('\nPress Ctrl+C to stop all servers\n');

        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down all servers...');
            this.servers.forEach(server => server.close());
            process.exit(0);
        });
    }

    startVentureServer(venture) {
        const ventureDir = path.join(__dirname, '..', venture.path);
        
        // Check if venture directory exists
        if (!fs.existsSync(ventureDir)) {
            console.log(`⚠️  Warning: ${venture.name} directory not found at ${ventureDir}`);
            return;
        }

        const server = http.createServer((req, res) => {
            this.handleRequest(req, res, ventureDir, venture.name);
        });

        server.listen(venture.port, () => {
            console.log(`✅ ${venture.name.padEnd(20)} -> http://localhost:${venture.port}`);
        });

        this.servers.push(server);
    }

    handleRequest(req, res, ventureDir, ventureName) {
        const startTime = Date.now();
        let filePath = this.getFilePath(req.url, ventureDir);
        
        // Log request with timing
        console.log(`[${ventureName}] ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            this.send404(res, req.url, ventureName);
            return;
        }

        // Get file stats
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
            if (!fs.existsSync(filePath)) {
                this.send404(res, req.url, ventureName);
                return;
            }
        }

        // Serve file with timing
        this.serveFile(res, filePath, ventureName, startTime);
    }

    getFilePath(url, ventureDir) {
        // Parse URL and remove query parameters
        const urlPath = url.split('?')[0];
        
        // Handle root
        if (urlPath === '/' || urlPath === '') {
            return path.join(ventureDir, 'index.html');
        }

        // Remove leading slash and join with venture directory
        const relativePath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
        return path.join(ventureDir, relativePath);
    }

    serveFile(res, filePath, ventureName, startTime) {
        try {
            const content = fs.readFileSync(filePath);
            const mimeType = this.getMimeType(filePath);
            const responseTime = Date.now() - startTime;
            
            res.writeHead(200, {
                'Content-Type': mimeType,
                'Content-Length': content.length,
                'Cache-Control': 'no-cache',
                'X-Response-Time': `${responseTime}ms`,
                'X-Venture': ventureName
            });
            
            res.end(content);
            
            // Log performance metrics
            const fileSize = (content.length / 1024).toFixed(2);
            console.log(`[${ventureName}] ✅ ${path.basename(filePath)} (${fileSize}KB) - ${responseTime}ms`);
            
            // Warn about slow responses
            if (responseTime > 1000) {
                console.log(`[${ventureName}] ⚠️  SLOW RESPONSE: ${responseTime}ms for ${path.basename(filePath)}`);
            }
            
        } catch (error) {
            console.error(`[${ventureName}] ❌ Error serving file:`, error.message);
            this.send500(res, ventureName);
        }
    }

    getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.txt': 'text/plain',
            '.xml': 'application/xml',
            '.exe': 'application/octet-stream',
            '.bmp': 'image/bmp'
        };
        
        return mimeTypes[ext] || 'application/octet-stream';
    }

    send404(res, url, ventureName) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>404 - Not Found | ${ventureName}</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        max-width: 600px; 
                        margin: 100px auto; 
                        padding: 2rem;
                        text-align: center;
                    }
                    h1 { color: #e53e3e; }
                    p { color: #4a5568; margin: 1rem 0; }
                    a { 
                        color: #667eea; 
                        text-decoration: none;
                        padding: 0.5rem 1rem;
                        background: #f7fafc;
                        border-radius: 0.5rem;
                        display: inline-block;
                        margin-top: 1rem;
                    }
                    a:hover { background: #edf2f7; }
                    .error-code { 
                        font-size: 4rem; 
                        font-weight: bold; 
                        color: #e2e8f0; 
                        margin: 2rem 0; 
                    }
                    .venture-name { color: #667eea; font-size: 0.9rem; }
                </style>
            </head>
            <body>
                <div class="venture-name">${ventureName}</div>
                <div class="error-code">404</div>
                <h1>Page Not Found</h1>
                <p>The requested path "${url}" was not found.</p>
                <a href="/">← Back to Home</a>
            </body>
            </html>
        `;
        
        res.writeHead(404, {
            'Content-Type': 'text/html',
            'Content-Length': html.length
        });
        res.end(html);
        
        console.log(`[${ventureName}] ❌ 404: ${url}`);
    }

    send500(res, ventureName) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>500 - Server Error | ${ventureName}</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        max-width: 600px; 
                        margin: 100px auto; 
                        padding: 2rem;
                        text-align: center;
                    }
                    h1 { color: #e53e3e; }
                    p { color: #4a5568; }
                    .venture-name { color: #667eea; font-size: 0.9rem; }
                </style>
            </head>
            <body>
                <div class="venture-name">${ventureName}</div>
                <h1>500 - Server Error</h1>
                <p>An error occurred while processing your request.</p>
            </body>
            </html>
        `;
        
        res.writeHead(500, {
            'Content-Type': 'text/html',
            'Content-Length': html.length
        });
        res.end(html);
    }

    // Performance analysis method
    analyzePerformance() {
        console.log('\n📊 Performance Analysis Starting...');
        console.log('Open the URLs above in your browser and check:');
        console.log('1. Initial page load time');
        console.log('2. CSS/JS loading performance');
        console.log('3. Image loading (if any)');
        console.log('4. Overall responsiveness');
        console.log('5. Download link functionality\n');
    }
}

// Start servers if called directly
if (require.main === module) {
    const serverManager = new MultiVentureServer();
    serverManager.startAll();
    
    // Show performance analysis tips after 2 seconds
    setTimeout(() => {
        serverManager.analyzePerformance();
    }, 2000);
}

module.exports = MultiVentureServer;