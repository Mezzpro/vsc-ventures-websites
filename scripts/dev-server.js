#!/usr/bin/env node

/**
 * VSCode Ventures V5 - Development Server
 * Local development server for testing venture websites
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const chalk = require('chalk');

class VentureDevServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.ventures = [
            'alpha-workspace.com',
            'cyberpunk-code.com',
            'holographic-pro.com', 
            'retro-terminal.com',
            'vsc-ventures.com'
        ];
        this.watchers = [];
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupFileWatching();
    }

    setupMiddleware() {
        // CORS for development
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });

        // Request logging
        this.app.use((req, res, next) => {
            console.log(chalk.gray(`${new Date().toLocaleTimeString()} - ${req.method} ${req.path}`));
            next();
        });

        // Static file serving with proper MIME types
        this.app.use(express.static('.', {
            setHeaders: (res, path) => {
                if (path.endsWith('.js')) {
                    res.setHeader('Content-Type', 'application/javascript');
                } else if (path.endsWith('.css')) {
                    res.setHeader('Content-Type', 'text/css');
                } else if (path.endsWith('.html')) {
                    res.setHeader('Content-Type', 'text/html');
                } else if (path.endsWith('.json')) {
                    res.setHeader('Content-Type', 'application/json');
                }
            }
        }));
    }

    setupRoutes() {
        // Root route - venture selector
        this.app.get('/', (req, res) => {
            res.send(this.generateVentureSelector());
        });

        // Venture routes
        this.ventures.forEach(venture => {
            this.setupVentureRoutes(venture);
        });

        // API routes for development
        this.app.post('/api/analytics', (req, res) => {
            console.log(chalk.blue('📊 Analytics Event:'), req.body);
            res.json({ success: true });
        });

        this.app.get('/api/download-stats', (req, res) => {
            res.json({
                totalDownloads: 29726,
                ventures: {
                    'alpha': 12847,
                    'cyberpunk': 8432,
                    'holographic': 5291,
                    'retro': 3156
                }
            });
        });

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).send(`
                <h1>404 - Not Found</h1>
                <p>The requested path "${req.path}" was not found.</p>
                <a href="/">← Back to venture selector</a>
            `);
        });
    }

    setupVentureRoutes(venture) {
        const venturePath = `/${venture.replace('.com', '')}`;
        
        // Main venture route
        this.app.get(venturePath, (req, res) => {
            this.serveVentureFile(res, venture, 'index.html');
        });

        this.app.get(`${venturePath}/`, (req, res) => {
            this.serveVentureFile(res, venture, 'index.html');
        });

        // Venture assets
        this.app.get(`${venturePath}/*`, (req, res) => {
            const filePath = req.path.replace(venturePath, '').substring(1);
            this.serveVentureFile(res, venture, filePath);
        });

        // Download simulation
        this.app.get(`/${venture}/download/*`, (req, res) => {
            const filename = path.basename(req.path);
            const filePath = path.join(venture, 'download', filename);
            
            if (fs.existsSync(filePath)) {
                console.log(chalk.green(`📥 Download requested: ${filename}`));
                res.download(filePath, filename);
            } else {
                res.status(404).send('Download file not found');
            }
        });
    }

    serveVentureFile(res, venture, filePath) {
        const fullPath = path.join(venture, filePath);
        
        if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            if (stats.isFile()) {
                res.sendFile(path.resolve(fullPath));
            } else {
                res.status(404).send('File not found');
            }
        } else {
            res.status(404).send('File not found');
        }
    }

    generateVentureSelector() {
        const ventureLinks = this.ventures.map(venture => {
            const name = venture.replace('.com', '').replace('-', ' ');
            const displayName = name.charAt(0).toUpperCase() + name.slice(1);
            const route = `/${venture.replace('.com', '')}`;
            const exists = fs.existsSync(venture);
            
            return `
                <div class="venture-card ${exists ? 'available' : 'coming-soon'}">
                    <h3>${displayName}</h3>
                    ${exists ? 
                        `<a href="${route}" target="_blank">View Website →</a>` : 
                        '<span class="coming-soon-label">Coming Soon</span>'
                    }
                </div>
            `;
        }).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>VSCode Ventures V5 - Development Server</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 2rem;
                        background: #f8fafc;
                    }
                    h1 {
                        color: #2d3748;
                        text-align: center;
                        margin-bottom: 3rem;
                    }
                    .venture-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 2rem;
                    }
                    .venture-card {
                        background: white;
                        padding: 2rem;
                        border-radius: 1rem;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        text-align: center;
                        border: 2px solid transparent;
                    }
                    .venture-card.available {
                        border-color: #48bb78;
                    }
                    .venture-card.coming-soon {
                        opacity: 0.6;
                        border-color: #e2e8f0;
                    }
                    .venture-card h3 {
                        margin-bottom: 1rem;
                        color: #2d3748;
                        text-transform: capitalize;
                    }
                    .venture-card a {
                        display: inline-block;
                        padding: 0.75rem 2rem;
                        background: #667eea;
                        color: white;
                        text-decoration: none;
                        border-radius: 0.5rem;
                        font-weight: 500;
                        transition: background 0.2s;
                    }
                    .venture-card a:hover {
                        background: #5a67d8;
                    }
                    .coming-soon-label {
                        color: #a0aec0;
                        font-style: italic;
                    }
                    .dev-info {
                        background: white;
                        padding: 2rem;
                        border-radius: 1rem;
                        margin: 3rem 0;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .status-indicator {
                        display: inline-block;
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        margin-right: 0.5rem;
                    }
                    .status-available { background: #48bb78; }
                    .status-building { background: #ed8936; }
                    .status-pending { background: #e2e8f0; }
                </style>
            </head>
            <body>
                <h1>🚀 VSCode Ventures V5 Development Server</h1>
                
                <div class="dev-info">
                    <h2>Development Status</h2>
                    <p><strong>Server:</strong> Running on port ${this.port}</p>
                    <p><strong>Hot Reload:</strong> ✅ Enabled</p>
                    <p><strong>Build System:</strong> Ready</p>
                </div>

                <div class="venture-grid">
                    ${ventureLinks}
                </div>

                <div class="dev-info">
                    <h3>Development URLs</h3>
                    <ul>
                        ${this.ventures.map(venture => {
                            const route = `/${venture.replace('.com', '')}`;
                            const exists = fs.existsSync(venture);
                            return `<li>
                                <span class="status-indicator status-${exists ? 'available' : 'pending'}"></span>
                                <strong>${venture}:</strong> 
                                <a href="http://localhost:${this.port}${route}" target="_blank">
                                    http://localhost:${this.port}${route}
                                </a>
                            </li>`;
                        }).join('')}
                    </ul>
                </div>
            </body>
            </html>
        `;
    }

    setupFileWatching() {
        const watchPaths = [
            ...this.ventures,
            'shared/**/*'
        ];

        watchPaths.forEach(watchPath => {
            if (fs.existsSync(watchPath)) {
                const watcher = chokidar.watch(watchPath, {
                    ignored: /node_modules|\.git/,
                    persistent: true
                });

                watcher.on('change', (path) => {
                    console.log(chalk.yellow(`🔄 File changed: ${path}`));
                });

                this.watchers.push(watcher);
            }
        });
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(chalk.green('\n🚀 VSCode Ventures V5 Development Server'));
            console.log(chalk.blue(`📡 Server running at: http://localhost:${this.port}`));
            console.log(chalk.cyan('🔄 Hot reload enabled'));
            console.log(chalk.gray('\nPress Ctrl+C to stop\n'));

            // Show available ventures
            this.ventures.forEach(venture => {
                const exists = fs.existsSync(venture);
                const route = `/${venture.replace('.com', '')}`;
                const url = `http://localhost:${this.port}${route}`;
                
                if (exists) {
                    console.log(chalk.green(`✅ ${venture}: ${url}`));
                } else {
                    console.log(chalk.gray(`⏳ ${venture}: Not yet created`));
                }
            });
            
            console.log();
        });

        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log(chalk.yellow('\n🛑 Shutting down development server...'));
            
            this.watchers.forEach(watcher => watcher.close());
            
            process.exit(0);
        });
    }
}

// Start server if called directly
if (require.main === module) {
    const server = new VentureDevServer();
    server.start();
}

module.exports = VentureDevServer;