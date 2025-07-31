/**
 * VSCode Ventures - Download Security & Management V5
 * Secure download infrastructure with tracking and protection
 */

class DownloadManager {
    constructor(config) {
        this.venture = config.name;
        this.version = config.version;
        this.downloadUrl = config.downloadUrl;
        this.analytics = new VentureAnalytics();
        this.rateLimitCount = 0;
        this.rateLimitWindow = 60000; // 1 minute
        this.maxDownloadsPerWindow = 3;
    }

    init() {
        this.setupDownloadHandlers();
        this.setupSecurityChecks();
        this.loadDownloadInfo();
    }

    // Download handlers setup
    setupDownloadHandlers() {
        // Primary download buttons
        document.querySelectorAll('#primary-download, #download-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.initiateDownload('primary_cta');
            });
        });

        // Secondary download links
        document.querySelectorAll('[data-download]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const source = link.getAttribute('data-download') || 'secondary';
                this.initiateDownload(source);
            });
        });
    }

    // Security checks and validation
    setupSecurityChecks() {
        // Bot detection
        this.botScore = this.calculateBotScore();
        
        // Rate limiting setup
        this.initRateLimiting();
        
        // Integrity verification
        this.loadChecksums();
    }

    calculateBotScore() {
        let score = 0;
        
        // Check for headless browser indicators
        if (navigator.webdriver) score += 20;
        if (window.phantom || window._phantom) score += 30;
        if (window.callPhantom) score += 30;
        
        // Check user agent patterns
        const suspiciousPatterns = [
            /headless/i, /phantom/i, /selenium/i, /webdriver/i,
            /bot/i, /crawler/i, /spider/i
        ];
        
        const userAgent = navigator.userAgent;
        suspiciousPatterns.forEach(pattern => {
            if (pattern.test(userAgent)) score += 15;
        });
        
        // Check for missing web APIs
        if (!window.requestAnimationFrame) score += 10;
        if (!window.localStorage) score += 10;
        if (!document.createElement('canvas').getContext) score += 15;
        
        return Math.min(score, 100);
    }

    initRateLimiting() {
        // Load rate limit data from localStorage
        const rateLimitData = JSON.parse(localStorage.getItem('download_rate_limit') || '{}');
        const now = Date.now();
        
        // Reset if window expired
        if (now - rateLimitData.windowStart > this.rateLimitWindow) {
            this.rateLimitCount = 0;
            localStorage.setItem('download_rate_limit', JSON.stringify({
                count: 0,
                windowStart: now
            }));
        } else {
            this.rateLimitCount = rateLimitData.count || 0;
        }
    }

    // Download initiation and security
    async initiateDownload(source = 'unknown') {
        try {
            // Pre-download security checks
            if (!this.passesSecurityChecks()) {
                this.showSecurityBlockMessage();
                return false;
            }

            // Rate limiting check
            if (!this.checkRateLimit()) {
                this.showRateLimitMessage();
                return false;
            }

            // Update download UI
            this.updateDownloadUI('preparing');

            // Generate secure download token
            const downloadToken = await this.generateDownloadToken();
            
            // Track download initiation
            await this.analytics.trackDownload(this.downloadUrl, source);
            
            // Create secure download URL
            const secureUrl = this.buildSecureDownloadUrl(downloadToken);
            
            // Initiate download
            await this.startSecureDownload(secureUrl);
            
            // Update rate limiting
            this.updateRateLimit();
            
            // Update UI
            this.updateDownloadUI('success');
            
            return true;
        } catch (error) {
            console.error('Download failed:', error);
            this.analytics.trackError(error, 'download_manager');
            this.updateDownloadUI('error');
            return false;
        }
    }

    passesSecurityChecks() {
        // Bot score check
        if (this.botScore > 50) {
            console.warn('High bot score detected:', this.botScore);
            return false;
        }

        // Basic environment checks
        if (!window.fetch || !window.Promise) {
            console.warn('Unsupported browser environment');
            return false;
        }

        // Honeypot check (if implemented)
        const honeypot = document.querySelector('#honeypot');
        if (honeypot && honeypot.value !== '') {
            console.warn('Honeypot triggered');
            return false;
        }

        return true;
    }

    checkRateLimit() {
        return this.rateLimitCount < this.maxDownloadsPerWindow;
    }

    async generateDownloadToken() {
        const tokenData = {
            venture: this.venture,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            sessionId: this.analytics.sessionId,
            nonce: this.generateNonce()
        };

        // Simple token generation (in production, this would be server-side)
        const tokenString = JSON.stringify(tokenData);
        const token = btoa(tokenString).replace(/[+\/=]/g, '');
        
        return token.substring(0, 32);
    }

    generateNonce() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    buildSecureDownloadUrl(token) {
        const baseUrl = this.downloadUrl;
        const params = new URLSearchParams({
            token: token,
            venture: this.venture,
            version: this.version,
            t: Date.now()
        });
        
        return `${baseUrl}?${params.toString()}`;
    }

    async startSecureDownload(url) {
        // Create hidden download link
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `${this.venture}-Setup-v${this.version}.exe`;
        downloadLink.style.display = 'none';
        
        // Add to DOM and trigger
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(downloadLink);
        }, 1000);

        // Verify download started
        await this.verifyDownloadStart(url);
    }

    async verifyDownloadStart(url) {
        try {
            // Make HEAD request to verify file is accessible
            const response = await fetch(url, { method: 'HEAD' });
            if (!response.ok) {
                throw new Error(`Download verification failed: ${response.status}`);
            }
            
            // Track successful download start
            this.analytics.trackEngagement('download_verified', 'success');
        } catch (error) {
            console.error('Download verification failed:', error);
            this.analytics.trackError(error, 'download_verification');
            throw error;
        }
    }

    updateRateLimit() {
        this.rateLimitCount++;
        const rateLimitData = {
            count: this.rateLimitCount,
            windowStart: Date.now()
        };
        localStorage.setItem('download_rate_limit', JSON.stringify(rateLimitData));
    }

    // UI Updates
    updateDownloadUI(state) {
        const downloadButtons = document.querySelectorAll('#primary-download, #download-btn');
        
        downloadButtons.forEach(button => {
            switch (state) {
                case 'preparing':
                    button.disabled = true;
                    button.innerHTML = '⏳ Preparing download...';
                    button.classList.add('downloading');
                    break;
                    
                case 'success':
                    button.innerHTML = '✓ Download started!';
                    button.classList.add('success');
                    setTimeout(() => {
                        button.disabled = false;
                        button.innerHTML = `⬇ Download ${this.venture}`;
                        button.classList.remove('downloading', 'success');
                    }, 3000);
                    break;
                    
                case 'error':
                    button.disabled = false;
                    button.innerHTML = '⚠ Download failed - Retry';
                    button.classList.add('error');
                    setTimeout(() => {
                        button.innerHTML = `⬇ Download ${this.venture}`;
                        button.classList.remove('downloading', 'error');
                    }, 5000);
                    break;
            }
        });
    }

    showSecurityBlockMessage() {
        this.showMessage(
            'Download Temporarily Unavailable',
            'Our security systems have detected unusual activity. Please try again later or contact support if this persists.',
            'warning'
        );
    }

    showRateLimitMessage() {
        this.showMessage(
            'Download Limit Reached',
            'You have reached the maximum number of downloads for this session. Please wait a minute before trying again.',
            'info'
        );
    }

    showMessage(title, message, type = 'info') {
        // Create modal or notification
        const modal = document.createElement('div');
        modal.className = `download-message ${type}`;
        modal.innerHTML = `
            <div class="message-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.remove()">OK</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 10000);
    }

    // Download information loading
    async loadDownloadInfo() {
        try {
            // Load download metadata
            const response = await fetch('/download/download-info.json');
            if (response.ok) {
                const info = await response.json();
                this.updateDownloadInfo(info);
            }
        } catch (error) {
            console.warn('Could not load download info:', error);
        }
    }

    async loadChecksums() {
        try {
            const response = await fetch('/download/checksums.txt');
            if (response.ok) {
                this.checksums = await response.text();
            }
        } catch (error) {
            console.warn('Could not load checksums:', error);
        }
    }

    updateDownloadInfo(info) {
        // Update file size
        const sizeElements = document.querySelectorAll('.file-size, .detail:first-child');
        sizeElements.forEach(el => {
            if (info.size) el.textContent = `Size: ${info.size}`;
        });

        // Update version
        const versionElements = document.querySelectorAll('.file-version, .detail:nth-child(2)');
        versionElements.forEach(el => {
            if (info.version) el.textContent = `Version: ${info.version}`;
        });

        // Update download count
        const countElement = document.getElementById('download-count');
        if (countElement && info.downloadCount) {
            countElement.textContent = info.downloadCount.toLocaleString();
        }
    }

    // Security monitoring
    reportSecurityEvent(event, details) {
        const securityData = {
            event: 'security_event',
            venture: this.venture,
            securityEvent: event,
            details: details,
            botScore: this.botScore,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            sessionId: this.analytics.sessionId
        };

        this.analytics.sendAnalytics(securityData);
    }
}

// Utility functions
function validateDownloadEnvironment() {
    const checks = {
        fetch: typeof fetch !== 'undefined',
        promise: typeof Promise !== 'undefined',
        crypto: typeof crypto !== 'undefined',
        localStorage: typeof localStorage !== 'undefined'
    };

    const failed = Object.entries(checks).filter(([key, value]) => !value);
    if (failed.length > 0) {
        console.warn('Download environment checks failed:', failed.map(([key]) => key));
        return false;
    }

    return true;
}

// Export for global use
window.DownloadManager = DownloadManager;
window.validateDownloadEnvironment = validateDownloadEnvironment;