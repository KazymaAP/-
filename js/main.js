/* ============================================================
   NODEFORGE — Core page interactions & performance monitoring
   ============================================================ */

import config from './config.js';

const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '::1';

let analyticsLoaded = false;
let abTestingLoaded = false;

function injectEnvVars() {
  const siteUrl = config?.site?.url ?? 'https://nodeforge.dev';
  const ogImageUrl = config?.social?.ogImage ?? `${siteUrl}/og-image.svg`;
  const twitterUsername = config?.social?.twitter ?? '@nodeforge_dev';
  const contactTelegram = config?.contact?.telegram ?? 'https://t.me/nodeforge_dev';
  const telegramUsername = config?.telegram?.username ?? 'nodeforge_dev';
  const contactEmail = config?.contact?.email ?? 'nodeforge@proton.me';

  // Update canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical && siteUrl) canonical.href = siteUrl;

  // Update Open Graph
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl && siteUrl) ogUrl.content = siteUrl;

  const ogImageMeta = document.querySelector('meta[property="og:image"]');
  if (ogImageMeta && ogImageUrl) ogImageMeta.content = ogImageUrl;

  // Update Twitter
  const twitterSite = document.querySelector('meta[name="twitter:site"]');
  if (twitterSite && twitterUsername) twitterSite.content = twitterUsername;

  const twitterImage = document.querySelector('meta[name="twitter:image"]');
  if (twitterImage && ogImageUrl) twitterImage.content = ogImageUrl;

  // Update structured data
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  scripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent);
      if (data.url && siteUrl) data.url = siteUrl;
      if (data.logo && data.logo.url && siteUrl) data.logo.url = `${siteUrl}/favicon.svg`;
      if (data.logo && typeof data.logo === 'string' && siteUrl) data.logo = `${siteUrl}/favicon.svg`;
      if (data.sameAs && contactTelegram) data.sameAs = [contactTelegram];
      if (data.potentialAction && data.potentialAction.target && siteUrl) {
        data.potentialAction.target.urlTemplate = `${siteUrl}/#cases`;
      }
      script.textContent = JSON.stringify(data, null, 2);
    } catch (e) { if (isLocalhost) console.error('[SEO] Failed to update structured data:', e); }
  });

  // Update contact links
  const contactLinks = document.querySelectorAll(`a[href*="t.me/${telegramUsername}"]`);
  contactLinks.forEach(link => {
    if (contactTelegram) link.href = contactTelegram;
  });

  const emailLinks = document.querySelectorAll(`a[href*="${contactEmail}"]`);
  emailLinks.forEach(link => {
    if (contactEmail) link.href = `mailto:${contactEmail}`;
  });
}

const PERFORMANCE_BUDGETS = {
  LCP: 2500,
  FID: 100,
  CLS: 0.1,
  TTFB: 800,
  FCP: 1800,
  JS_SIZE: 170 * 1024,
  CSS_SIZE: 50 * 1024,
  TOTAL_SIZE: 500 * 1024,
  REQUESTS: 50
};

function initPerformanceMonitoring() {
  if (!('PerformanceObserver' in window)) return;

  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (!lastEntry) return;
      const lcp = lastEntry.startTime;
      logMetric('LCP', lcp, PERFORMANCE_BUDGETS.LCP);
      if (window.gtag) {
        gtag('event', 'web_vitals', {
          metric_name: 'LCP',
          metric_value: Math.round(lcp),
          metric_rating: lcp <= PERFORMANCE_BUDGETS.LCP ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor'
        });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) { if (isLocalhost) console.error('[Perf] Failed to observe LCP:', e); }

  try {
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        const fid = entry.processingStart - entry.startTime;
        logMetric('FID', fid, PERFORMANCE_BUDGETS.FID);
        if (window.gtag) {
          window.gtag('event', 'web_vitals', {
            metric_name: 'FID',
            metric_value: Math.round(fid),
            metric_rating: fid <= PERFORMANCE_BUDGETS.FID ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor'
          });
        }
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch (e) { if (isLocalhost) console.error('[Perf] Failed to observe FID:', e); }

  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      logMetric('CLS', clsValue, PERFORMANCE_BUDGETS.CLS);
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    window.addEventListener('pagehide', () => {
      if (window.gtag && clsValue > 0) {
        window.gtag('event', 'web_vitals', {
          metric_name: 'CLS',
          metric_value: Math.round(clsValue * 1000) / 1000,
          metric_rating: clsValue <= PERFORMANCE_BUDGETS.CLS ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor'
        });
      }
      clsValue = 0;
    });
  } catch (e) { if (isLocalhost) console.error('[Perf] Failed to observe CLS:', e); }

  try {
    const fcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          logMetric('FCP', entry.startTime, PERFORMANCE_BUDGETS.FCP);
          if (window.gtag) {
            window.gtag('event', 'web_vitals', {
              metric_name: 'FCP',
              metric_value: Math.round(entry.startTime),
              metric_rating: entry.startTime <= PERFORMANCE_BUDGETS.FCP ? 'good' : entry.startTime <= 3000 ? 'needs-improvement' : 'poor'
            });
          }
        }
      });
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
  } catch (e) { if (isLocalhost) console.error('[Perf] Failed to observe FCP:', e); }

  window.addEventListener('load', () => {
    setTimeout(analyzeResourceSizes, 0);
  });

  return {
    lcpObserver,
    fidObserver,
    clsObserver,
    fcpObserver
  };
}

function logMetric(name, value, budget) {
  if (budget <= 0) return;
  const status = value <= budget ? '✓' : '✗';
  const pct = ((value / budget) * 100).toFixed(1);
  if (isLocalhost) {
    console.log(`[Perf] ${name}: ${value.toFixed(2)}ms (budget: ${budget}ms, ${pct}%) ${status}`);
  }
}

function analyzeResourceSizes() {
  if (!performance.getEntriesByType) return;

  let resources;
  try {
    resources = performance.getEntriesByType('resource');
  } catch (e) {
    if (isLocalhost) console.warn('[Perf] Could not read resource entries:', e);
    return;
  }

  let totalJS = 0, totalCSS = 0, totalBytes = 0;

  resources.forEach((resource) => {
    const size = resource.transferSize || resource.encodedBodySize || 0;
    totalBytes += size;

    if (resource.name.endsWith('.js') || resource.initiatorType === 'script') {
      totalJS += size;
    } else if (resource.name.endsWith('.css') || resource.initiatorType === 'link') {
      totalCSS += size;
    }
  });

  const totalRequests = resources.length;

  logMetric('Total JS', totalJS / 1024, PERFORMANCE_BUDGETS.JS_SIZE / 1024);
  logMetric('Total CSS', totalCSS / 1024, PERFORMANCE_BUDGETS.CSS_SIZE / 1024);
  logMetric('Total Weight', totalBytes / 1024, PERFORMANCE_BUDGETS.TOTAL_SIZE / 1024);
  logMetric('Total Requests', totalRequests, PERFORMANCE_BUDGETS.REQUESTS);

  const warnings = [];
  if (totalJS > PERFORMANCE_BUDGETS.JS_SIZE) warnings.push(`JS size (${(totalJS/1024).toFixed(1)}KB) exceeds budget (${PERFORMANCE_BUDGETS.JS_SIZE/1024}KB)`);
  if (totalCSS > PERFORMANCE_BUDGETS.CSS_SIZE) warnings.push(`CSS size (${(totalCSS/1024).toFixed(1)}KB) exceeds budget (${PERFORMANCE_BUDGETS.CSS_SIZE/1024}KB)`);
  if (totalBytes > PERFORMANCE_BUDGETS.TOTAL_SIZE) warnings.push(`Total weight (${(totalBytes/1024).toFixed(1)}KB) exceeds budget (${PERFORMANCE_BUDGETS.TOTAL_SIZE/1024}KB)`);
  if (totalRequests > PERFORMANCE_BUDGETS.REQUESTS) warnings.push(`Requests (${totalRequests}) exceeds budget (${PERFORMANCE_BUDGETS.REQUESTS})`);

  if (warnings.length > 0 && isLocalhost) {
    console.warn('[Perf] Budget warnings:', warnings);
  }
}

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const fadeElements = document.querySelectorAll('.fade-up');
const chartBlock = document.getElementById('chart-block');

if (fadeElements.length) {
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  fadeElements.forEach((el) => fadeObserver.observe(el));
}

if (chartBlock) {
  const chartObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        chartObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  chartObserver.observe(chartBlock);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');
    if (targetId === '#') return;
    const targetEl = document.getElementById(targetId.slice(1));
    if (targetEl) {
      e.preventDefault();
      const top = targetEl.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top, behavior: 'smooth' });
      if (!targetEl.hasAttribute('tabindex')) {
        targetEl.setAttribute('tabindex', '-1');
      }
      targetEl.focus({ preventScroll: true });
    }
  });
});

const mobileCta = document.getElementById('mobile-cta');
const contactSection = document.getElementById('contact');
if (mobileCta && contactSection) {
  const ctaObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      mobileCta.classList.toggle('hidden', entry.isIntersecting);
    });
  }, { threshold: 0.15 });
  ctaObserver.observe(contactSection);
}

const scrollTopBtn = document.getElementById('scroll-top');
if (scrollTopBtn) {
  let scrollTimeout = null;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
      scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
      scrollTimeout = null;
    }, 100);
  });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameField = contactForm.querySelector('[name="name"]');
    const emailField = contactForm.querySelector('[name="email"]');
    const messageField = contactForm.querySelector('[name="message"]');
    if (!nameField || !emailField || !messageField) return;
    const name = nameField.value.trim();
    const email = emailField.value.trim();
    const message = messageField.value.trim();
    if (!name || !email || !message) return;

    const subject = encodeURIComponent('Запрос с сайта Nodeforge — ' + name);
    const body = encodeURIComponent('Имя: ' + name + '\nEmail: ' + email + '\n\n' + message);
    window.location.href = 'mailto:nodeforge@proton.me?subject=' + subject + '&body=' + body;
  });
}

function initLazyLoading() {
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  let imageObserver = null;

  if ('IntersectionObserver' in window && lazyImages.length) {
    imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imageObserver.unobserve(img);
        }
      });
    }, { rootMargin: '100px' });

    lazyImages.forEach((img) => imageObserver.observe(img));
  }

  if (document.readyState === 'complete') {
    loadDeferredScripts();
  } else {
    window.addEventListener('load', loadDeferredScripts, { once: true });
  }

  return imageObserver;
}

async function loadDeferredScripts() {
  if (!analyticsLoaded) {
    try {
      await import('./analytics.js');
      analyticsLoaded = true;
    } catch (e) {
      if (isLocalhost) console.warn('Failed to load analytics:', e);
    }
  }

  if (!abTestingLoaded) {
    try {
      await import('./ab-testing.js');
      abTestingLoaded = true;
    } catch (e) {
      if (isLocalhost) console.warn('Failed to load A/B testing:', e);
    }
  }
}

function initThreeSceneLazy() {
  const threeContainer = document.getElementById('three-container');
  if (!threeContainer) return null;

  const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        threeContainer.dataset.sceneVisible = 'true';
        sceneObserver.unobserve(entry.target);
        sceneObserver.disconnect();
        import('./scene.js').catch(e => {
           if (isLocalhost) console.warn('Failed to load Three.js scene:', e);
        });
      }
    });
  }, { rootMargin: '200px' });

  sceneObserver.observe(threeContainer);

  return sceneObserver;
}

function init() {
  const perfObservers = initPerformanceMonitoring();
  const imageObserver = initLazyLoading();
  const sceneObserver = initThreeSceneLazy();
  injectEnvVars();

  // Cleanup on page unload
  window.addEventListener('pagehide', () => {
    if (perfObservers) {
      Object.values(perfObservers).forEach(obs => obs?.disconnect?.());
    }
    imageObserver?.disconnect?.();
    sceneObserver?.disconnect?.();
  }, { once: true });
}

init();