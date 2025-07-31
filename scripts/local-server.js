#!/usr/bin/env node

/**
 * Simple Local Server for Testing Alpha Workspace
 * No dependencies - uses only Node.js built-in modules
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class LocalServer {
    constructor() {
        this.port = 3000;
        this.distDir = path.join(__dirname, '..', 'dist', 'alpha-workspace.com');
    }

    start() {
        const server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        server.listen(this.port, () => {
            console.log('\n🚀 Alpha Workspace Local Server');
            console.log(`📡 Server running at: http://localhost:${this.port}`);
            console.log(`📁 Serving from: ${this.distDir}`);
            console.log('\nPress Ctrl+C to stop\n');
        });

        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down server...');
            process.exit(0);
        });
    }

    handleRequest(req, res) {
        let filePath = this.getFilePath(req.url);
        
        console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url} -> ${path.basename(filePath)}`);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            this.send404(res, req.url);
            return;
        }

        // Get file stats
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
            if (!fs.existsSync(filePath)) {
                this.send404(res, req.url);
                return;
            }
        }

        // Serve file
        this.serveFile(res, filePath);
    }

    getFilePath(url) {
        // Parse URL and remove query parameters
        const urlPath = url.split('?')[0];
        
        // Handle root
        if (urlPath === '/' || urlPath === '') {
            return path.join(this.distDir, 'index.html');
        }

        // Remove leading slash and join with dist directory
        const relativePath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
        return path.join(this.distDir, relativePath);
    }

    serveFile(res, filePath) {
        try {
            const content = fs.readFileSync(filePath);
            const mimeType = this.getMimeType(filePath);
            
            res.writeHead(200, {
                'Content-Type': mimeType,
                'Content-Length': content.length,
                'Cache-Control': 'no-cache'
            });
            
            res.end(content);
        } catch (error) {
            console.error('Error serving file:', error.message);
            this.send500(res);
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
            '.exe': 'application/octet-stream'
        };
        
        return mimeTypes[ext] || 'application/octet-stream';
    }

    send404(res, url) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>404 - Not Found</title>
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
                </style>
            </head>
            <body>
                <div class="error-code">404</div>
                <h1>Page Not Found</h1>
                <p>The requested path "${url}" was not found.</p>
                <p>This might be because the file doesn't exist or the build hasn't been run yet.</p>
                <a href="/">← Back to Home</a>
            </body>
            </html>
        `;
        
        res.writeHead(404, {
            'Content-Type': 'text/html',
            'Content-Length': html.length
        });
        res.end(html);
    }

    send500(res) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>500 - Server Error</title>
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
                </style>
            </head>
            <body>
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
}

// Start server if called directly
if (require.main === module) {
    const server = new LocalServer();
    server.start();
}

module.exports = LocalServer;