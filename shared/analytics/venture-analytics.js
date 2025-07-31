/**
 * VSCode Ventures - Analytics System V5
 * Comprehensive analytics integration across all ventures
 */

class VentureAnalytics {
    constructor() {
        this.venture = window.ventureConfig?.name || 'unknown';
        this.version = window.ventureConfig?.version || '1.0.0';
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
    }

    init() {
        this.trackPageView();
        this.setupEngagementTracking();
        this.setupDownloadTracking();
        this.setupPerformanceTracking();
    }

    // Session and user identification
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getUserAgent() {
        return navigator.userAgent;
    }

    getReferrer() {
        return document.referrer || 'direct';
    }

    // Core tracking methods
    async trackPageView() {
        const data = {
            event: 'page_view',
            venture: this.venture,
            page: window.location.pathname,
            title: document.title,
            userAgent: this.getUserAgent(),
            referrer: this.getReferrer(),
            timestamp: Date.now(),
            sessionId: this.sessionId,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };

        await this.sendAnalytics(data);
    }

    async trackDownload(downloadUrl, source = 'primary_cta') {
        const data = {
            event: 'download_started',
            venture: this.venture,
            version: this.version,
            downloadUrl: downloadUrl,
            source: source,
            userAgent: this.getUserAgent(),
            referrer: this.getReferrer(),
            timestamp: Date.now(),
            sessionId: this.sessionId,
            timeOnPage: Date.now() - this.startTime
        };

        await this.sendAnalytics(data);
        this.updateConversionMetrics();
    }

    async trackEngagement(action, element, value = null) {
        const data = {
            event: 'engagement',
            venture: this.venture,
            action: action,
            element: element,
            value: value,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            timeOnPage: Date.now() - this.startTime
        };

        await this.sendAnalytics(data);
    }

    // Engagement tracking setup
    setupEngagementTracking() {
        // Scroll depth tracking
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
                maxScroll = scrollPercent;
                this.trackEngagement('scroll', 'page', scrollPercent);
            }
        });

        // Time on page milestones
        const timeIntervals = [30, 60, 120, 300]; // seconds
        timeIntervals.forEach(interval => {
            setTimeout(() => {
                this.trackEngagement('time_on_page', 'milestone', interval);
            }, interval * 1000);
        });

        // CTA interactions
        document.querySelectorAll('[data-track]').forEach(element => {
            element.addEventListener('click', (e) => {
                const action = element.getAttribute('data-track');
                this.trackEngagement('click', action, element.textContent);
            });
        });

        // Feature section views
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const section = entry.target.getAttribute('data-section');
                        this.trackEngagement('section_view', section);
                    }
                });
            }, { threshold: 0.5 });

            document.querySelectorAll('[data-section]').forEach(section => {
                observer.observe(section);
            });
        }
    }

    // Download tracking setup
    setupDownloadTracking() {
        // Primary download buttons
        document.querySelectorAll('#primary-download, #download-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                this.trackDownload(window.ventureConfig?.downloadUrl, 'primary_cta');
            });
        });

        // Secondary download links
        document.querySelectorAll('[data-download]').forEach(link => {
            link.addEventListener('click', (e) => {
                const source = link.getAttribute('data-download') || 'secondary';
                this.trackDownload(window.ventureConfig?.downloadUrl, source);
            });
        });
    }

    // Performance tracking
    setupPerformanceTracking() {
        // Core Web Vitals
        if ('web-vital' in window) {
            import('https://unpkg.com/web-vitals@3/dist/web-vitals.js').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
                onCLS((metric) => this.trackPerformance('CLS', metric.value));
                onFID((metric) => this.trackPerformance('FID', metric.value));
                onFCP((metric) => this.trackPerformance('FCP', metric.value));
                onLCP((metric) => this.trackPerformance('LCP', metric.value));
                onTTFB((metric) => this.trackPerformance('TTFB', metric.value));
            });
        }

        // Page load timing
        window.addEventListener('load', () => {
            const timing = performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
            
            this.trackPerformance('page_load_time', loadTime);
            this.trackPerformance('dom_ready_time', domReady);
        });
    }

    async trackPerformance(metric, value) {
        const data = {
            event: 'performance',
            venture: this.venture,
            metric: metric,
            value: value,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userAgent: this.getUserAgent()
        };

        await this.sendAnalytics(data);
    }

    // Conversion tracking
    updateConversionMetrics() {
        // Update download count display
        const downloadCountElement = document.getElementById('download-count');
        if (downloadCountElement) {
            const currentCount = parseInt(downloadCountElement.textContent.replace(/,/g, '')) || 0;
            downloadCountElement.textContent = (currentCount + 1).toLocaleString();
        }

        // Store conversion in localStorage for attribution
        const conversions = JSON.parse(localStorage.getItem('venture_conversions') || '[]');
        conversions.push({
            venture: this.venture,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            referrer: this.getReferrer()
        });
        localStorage.setItem('venture_conversions', JSON.stringify(conversions));
    }

    // Analytics data transmission
    async sendAnalytics(data) {
        try {
            // Send to Cloudflare Analytics
            await this.sendToCloudflare(data);
            
            // Send to Google Analytics (if configured)
            if (window.gtag) {
                this.sendToGoogleAnalytics(data);
            }
            
            // Send to custom analytics endpoint
            await this.sendToCustomEndpoint(data);
        } catch (error) {
            console.warn('Analytics tracking failed:', error);
        }
    }

    async sendToCloudflare(data) {
        // Cloudflare Web Analytics integration
        if (window.cloudflare && window.cloudflare.analytics) {
            window.cloudflare.analytics.track(data.event, data);
        }
    }

    sendToGoogleAnalytics(data) {
        // Google Analytics 4 integration
        if (window.gtag) {
            gtag('event', data.event, {
                venture: data.venture,
                custom_parameter_1: data.source || data.action,
                custom_parameter_2: data.value,
                session_id: data.sessionId
            });
        }
    }

    async sendToCustomEndpoint(data) {
        // Custom analytics endpoint for detailed tracking
        try {
            await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
        } catch (error) {
            // Fallback to beacon API if fetch fails
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/analytics', JSON.stringify(data));
            }
        }
    }

    // A/B Testing support
    getVariant(testName) {
        const variants = {
            'hero_cta_test': ['Download Free', 'Get Started Now', 'Install Alpha'],
            'hero_headline_test': ['Distraction-Free Writing', 'Focus on What Matters', 'Write More, Worry Less']
        };

        const storedVariant = localStorage.getItem(`ab_test_${testName}`);
        if (storedVariant) {
            return storedVariant;
        }

        const testVariants = variants[testName] || [];
        if (testVariants.length === 0) return null;

        const variant = testVariants[Math.floor(Math.random() * testVariants.length)];
        localStorage.setItem(`ab_test_${testName}`, variant);
        
        // Track A/B test assignment
        this.trackEngagement('ab_test_assigned', testName, variant);
        return variant;
    }

    // Heatmap integration
    initHeatmapTracking() {
        if (typeof window.hj !== 'undefined') {
            // Hotjar integration
            hj('trigger', this.venture + '_page_view');
        }
    }

    // Error tracking
    trackError(error, context = '') {
        const data = {
            event: 'error',
            venture: this.venture,
            error: error.message || error,
            stack: error.stack,
            context: context,
            url: window.location.href,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userAgent: this.getUserAgent()
        };

        this.sendAnalytics(data);
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    if (window.ventureAnalytics) {
        window.ventureAnalytics.trackError(event.error, 'global_error_handler');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    if (window.ventureAnalytics) {
        window.ventureAnalytics.trackError(event.reason, 'unhandled_promise_rejection');
    }
});

// Export for global use
window.VentureAnalytics = VentureAnalytics;