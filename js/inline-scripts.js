// Inline scripts extracted from index.html for CSP compliance

function isLocalDev() {
    return location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '::1';
}

function supportsPerformance() {
    return typeof performance !== 'undefined' && typeof performance.mark === 'function' && typeof performance.measure === 'function';
}

// Three.js error handler
document.addEventListener('DOMContentLoaded', function() {
    var threeScript = document.querySelector('script[src*="three.min.js"]');
    if (threeScript) {
        threeScript.addEventListener('error', function() {
            var container = document.getElementById('three-container');
            if (container) {
                var errorDiv = document.createElement('div');
                errorDiv.className = 'three-error';
                errorDiv.textContent = '3D-модель недоступна';
                container.innerHTML = '';
                container.appendChild(errorDiv);
            }
        });
    }
});

// Service Worker Registration
(function() {
    if (!('serviceWorker' in navigator)) return;

    if (isLocalDev()) {
        return;
    }

    navigator.serviceWorker.register('/sw.js')
        .then(function(reg) {
            if (isLocalDev()) console.log('SW registered:', reg.scope);
        })
        .catch(function(err) {
            console.warn('SW registration failed:', err);
        });
})();

// Year update
document.addEventListener('DOMContentLoaded', function() {
    var yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
});

// Performance marks
if (supportsPerformance()) {
    performance.mark('scripts-loaded');
    performance.mark('dom-interactive');
}

window.addEventListener('DOMContentLoaded', function() {
    if (supportsPerformance()) {
        performance.mark('dom-content-loaded');
        performance.measure('dom-load', 'dom-interactive', 'dom-content-loaded');
    }
});

window.addEventListener('load', function() {
    if (supportsPerformance()) {
        performance.mark('window-load');
        performance.measure('full-load', 'dom-content-loaded', 'window-load');

        if (isLocalDev()) {
            var measures = performance.getEntriesByType('measure');
            console.log('Performance:', measures.map(function(m) {
                return m.name + ': ' + m.duration.toFixed(2) + 'ms';
            }));
        }
    }
});