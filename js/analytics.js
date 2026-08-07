/* ============================================================
   NODEFORGE — Analytics & Tracking
   Google Analytics 4 + Yandex Metrica + Custom Events
   ============================================================ */
(function () {
    'use strict';

    // Configuration - replace with actual IDs
    const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Replace with your GA4 Measurement ID
    const YM_COUNTER_ID = 'XXXXXXXX'; // Replace with your Yandex Metrica Counter ID

    // State
    let gaLoaded = false;
    let ymLoaded = false;
    let consentGiven = false;
    let queuedEvents = [];
    const MAX_QUEUE_SIZE = 100;

    let scrollTrackingHandler = null;
    let scrollTimeout = null;
    let scrollTrackedMilestones = null;
    let timeTrackingInterval = null;
    let timeTrackedIntervals = null;
    let timeStartTime = null;
    let visibilityChangeHandler = null;
    let ctaClickHandler = null;
    let caseClickHandler = null;
    let domContentLoadedHandler = null;
    let pagehideHandler = null;

    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '::1';

    // Utility: Check if analytics consent exists
    function checkConsent() {
        try {
            const consent = localStorage.getItem('analytics_consent');
            consentGiven = consent === 'true';
        } catch (e) {
            consentGiven = false;
        }
        return consentGiven;
    }

    // Utility: Set consent
    function setConsent(granted) {
        try {
            localStorage.setItem('analytics_consent', granted.toString());
            consentGiven = granted;
            if (granted) {
                initAnalytics();
                flushQueue();
            }
        } catch (e) {
            console.warn('Failed to save analytics consent:', e);
        }
    }

    // Queue events before analytics loads
    function queueEvent(eventName, params) {
        if (queuedEvents.length >= MAX_QUEUE_SIZE) {
            queuedEvents.shift(); // Remove oldest event
        }
        queuedEvents.push({ eventName, params, timestamp: Date.now() });
    }

    function flushQueue() {
        while (queuedEvents.length) {
            const { eventName, params } = queuedEvents.shift();
            trackEvent(eventName, params);
        }
    }

    // Initialize Google Analytics
    function loadGA() {
        if (gaLoaded || !GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') return;

        window.dataLayer = window.dataLayer || [];
        function gtag() { window.dataLayer.push(arguments); }
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID, {
            send_page_view: false, // We'll send manually
            anonymize_ip: true
        });

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        script.onerror = () => console.warn('GA script failed to load');
        document.head.appendChild(script);

        gaLoaded = true;
    }

    // Initialize Yandex Metrica
    function loadYM() {
        if (ymLoaded || !YM_COUNTER_ID || YM_COUNTER_ID === 'XXXXXXXX') return;

        window.yaCounter = window.yaCounter || {};
        (function (m, e, t, r, i, k, a) {
            m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) };
            m[i].l = 1 * new Date();
            k = e.createElement(t), a = e.getElementsByTagName(t)[0];
            k.async = 1;
            k.src = r;
            a.parentNode.insertBefore(k, a);
        })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

        window.ym(YM_COUNTER_ID, 'init', {
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true,
            webvisor: false
        });

        ymLoaded = true;
    }

    // Main init
    function initAnalytics() {
        if (!checkConsent()) return;
        loadGA();
        loadYM();
    }

    // Public API: Track custom event
    function trackEvent(eventName, params = {}) {
        if (!consentGiven) {
            queueEvent(eventName, params);
            return;
        }

        // Google Analytics 4
        if (gaLoaded && window.gtag) {
            window.gtag('event', eventName, params);
        }

        // Yandex Metrica
        if (ymLoaded && window.ym) {
            window.ym(YM_COUNTER_ID, 'reachGoal', eventName, params);
        }

        // Console log in development
        if (isLocalhost) {
            console.log('[Analytics]', eventName, params);
        }
    }

    // Public API: Track page view
    function trackPageView(pagePath, pageTitle) {
        trackEvent('page_view', {
            page_path: pagePath,
            page_title: pageTitle,
            page_location: window.location.href
        });
    }

    // Public API: Track CTA click
    function trackCTAClick(ctaName, ctaLocation, extraParams = {}) {
        trackEvent('cta_click', {
            cta_name: ctaName,
            cta_location: ctaLocation,
            ...extraParams
        });
    }

    // Public API: Track case card interaction
    function trackCaseInteraction(action, caseId, caseCategory, extraParams = {}) {
        trackEvent('case_interaction', {
            action, // 'view', 'click', 'cta_click'
            case_id: caseId,
            case_category: caseCategory,
            ...extraParams
        });
    }

    // Public API: Track form interaction
    function trackFormEvent(action, formName, extraParams = {}) {
        trackEvent('form_interaction', {
            action, // 'start', 'submit', 'error', 'success'
            form_name: formName,
            ...extraParams
        });
    }

    // Public API: Track scroll depth
    function trackScrollDepth(depth) {
        trackEvent('scroll_depth', {
            depth_percentage: depth,
            page_path: window.location.pathname
        });
    }

    // Public API: Track time on page
    function trackTimeOnPage(seconds) {
        trackEvent('time_on_page', {
            seconds: seconds,
            page_path: window.location.pathname
        });
    }

    // Auto-track scroll depth milestones
    function setupScrollTracking() {
        const milestones = [25, 50, 75, 90, 100];
        scrollTrackedMilestones = new Set();

        scrollTrackingHandler = () => {
            if (scrollTimeout) return;
            scrollTimeout = setTimeout(() => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

                milestones.forEach(m => {
                    if (scrollPercent >= m && !scrollTrackedMilestones.has(m)) {
                        scrollTrackedMilestones.add(m);
                        trackScrollDepth(m);
                    }
                });
                scrollTimeout = null;
            }, 100);
        };

        window.addEventListener('scroll', scrollTrackingHandler, { passive: true });
    }

    // Auto-track time on page
    function setupTimeTracking() {
        const intervals = [10, 30, 60, 120, 300]; // seconds
        timeTrackedIntervals = new Set();
        timeStartTime = Date.now();

        timeTrackingInterval = setInterval(() => {
            const elapsed = Math.round((Date.now() - timeStartTime) / 1000);
            intervals.forEach(i => {
                if (elapsed >= i && !timeTrackedIntervals.has(i)) {
                    timeTrackedIntervals.add(i);
                    trackTimeOnPage(i);
                }
            });
        }, 10000); // Check every 10 seconds

        // Track on page hide (more reliable than beforeunload)
        visibilityChangeHandler = () => {
            if (document.visibilityState === 'hidden') {
                const elapsed = Math.round((Date.now() - timeStartTime) / 1000);
                trackTimeOnPage(elapsed);
            }
        };
        document.addEventListener('visibilitychange', visibilityChangeHandler);
    }

    // Auto-track CTA clicks
    function setupCTATracking() {
        ctaClickHandler = (e) => {
            const cta = e.target.closest('[data-cta]');
            if (!cta) return;

            const ctaName = cta.dataset.cta || cta.textContent.trim().slice(0, 50);
            const ctaLocation = cta.dataset.ctaLocation || getSectionName(cta);
            trackCTAClick(ctaName, ctaLocation);
        };
        document.addEventListener('click', ctaClickHandler);
    }

    function getSectionName(element) {
        const section = element.closest('section[id]');
        return section ? section.id : 'unknown';
    }

    // Auto-track case card clicks
    function setupCaseTracking() {
        caseClickHandler = (e) => {
            const card = e.target.closest('.case-card');
            if (!card) return;

            const link = e.target.closest('a');
            if (!link) return;

            const caseId = card.dataset.caseId;
            const caseCategory = card.dataset.caseCategory;
            if (caseId && caseCategory) {
                trackCaseInteraction('cta_click', caseId, caseCategory, {
                    cta_text: link.textContent.trim(),
                    cta_href: link.href
                });
            }
        };
        document.addEventListener('click', caseClickHandler);
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        domContentLoadedHandler = init;
        document.addEventListener('DOMContentLoaded', domContentLoadedHandler);
    } else {
        init();
    }

    function init() {
        // Prevent double initialization
        if (gaLoaded || ymLoaded) return;
        
        initAnalytics();
        setupScrollTracking();
        setupTimeTracking();
        setupCTATracking();
        setupCaseTracking();
    }

    function destroy() {
        // Remove scroll handler and clear timeout
        if (scrollTrackingHandler) {
            window.removeEventListener('scroll', scrollTrackingHandler);
            scrollTrackingHandler = null;
        }
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
            scrollTimeout = null;
        }
        scrollTrackedMilestones = null;

        // Clear time tracking interval and cleanup
        if (timeTrackingInterval) {
            clearInterval(timeTrackingInterval);
            timeTrackingInterval = null;
        }
        timeTrackedIntervals = null;
        timeStartTime = null;

        // Remove visibility change handler
        if (visibilityChangeHandler) {
            document.removeEventListener('visibilitychange', visibilityChangeHandler);
            visibilityChangeHandler = null;
        }

        // Remove click handlers
        if (ctaClickHandler) {
            document.removeEventListener('click', ctaClickHandler);
            ctaClickHandler = null;
        }
        if (caseClickHandler) {
            document.removeEventListener('click', caseClickHandler);
            caseClickHandler = null;
        }

        // Remove DOMContentLoaded handler if still pending
        if (domContentLoadedHandler) {
            document.removeEventListener('DOMContentLoaded', domContentLoadedHandler);
            domContentLoadedHandler = null;
        }

        // Remove pagehide handler
        if (pagehideHandler) {
            window.removeEventListener('pagehide', pagehideHandler);
            pagehideHandler = null;
        }

        // Reset state
        queuedEvents = [];
        gaLoaded = false;
        ymLoaded = false;
        consentGiven = false;
    }

    // Cleanup on page unload
    pagehideHandler = destroy;
    window.addEventListener('pagehide', pagehideHandler, { once: true });

    // Expose public API
    window.NodeforgeAnalytics = {
        trackEvent,
        trackPageView,
        trackCTAClick,
        trackCaseInteraction,
        trackFormEvent,
        trackScrollDepth,
        trackTimeOnPage,
        setConsent,
        checkConsent,
        destroy
    };
})();