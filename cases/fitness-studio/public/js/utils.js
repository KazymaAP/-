/**
 * Fitness Studio - Utility Functions
 * Common helper functions used across the application
 */

const Utils = {
  /**
   * Escapes HTML to prevent XSS
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Formats price with Russian locale
   * @param {number|string} price - Price to format
   * @returns {string} Formatted price
   */
  formatPrice(price) {
    if (!price && price !== 0) return '0';
    return new Intl.NumberFormat('ru-RU').format(price);
  },

  /**
   * Formats number with Russian locale
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  formatNumber(num) {
    if (!num && num !== 0) return '0';
    return new Intl.NumberFormat('ru-RU').format(num);
  },

  /**
   * Formats date
   * @param {string|Date} date - Date to format
   * @returns {string} Formatted date
   */
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  /**
   * Debounce function
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in ms
   * @returns {Function} Debounced function
   */
  debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Throttle function
   * @param {Function} fn - Function to throttle
   * @param {number} limit - Time limit in ms
   * @returns {Function} Throttled function
   */
  throttle(fn, limit) {
    let lastTime = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastTime >= limit) {
        lastTime = now;
        fn.apply(this, args);
      }
    };
  },

  /**
   * Validates phone number (Russian format)
   * @param {string} phone - Phone number to validate
   * @returns {boolean} True if valid
   */
  validatePhone(phone) {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 11 && (cleaned[0] === '7' || cleaned[0] === '8');
  },

  /**
   * Validates email
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  validateEmail(email) {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /**
   * Gets query parameter from URL
   * @param {string} name - Parameter name
   * @returns {string|null} Parameter value
   */
  getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  },

  /**
   * Sets query parameter in URL without reload
   * @param {string} name - Parameter name
   * @param {string} value - Parameter value
   */
  setQueryParam(name, value) {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(name, value);
    } else {
      url.searchParams.delete(name);
    }
    window.history.replaceState({}, '', url);
  },

  /**
   * Creates an element with attributes and children
   * @param {string} tag - Tag name
   * @param {Object} attrs - Attributes object
   * @param {Array|string} children - Child elements or text
   * @returns {HTMLElement} Created element
   */
  createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'class') {
        el.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([k, v]) => el.dataset[k] = v);
      } else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    });
    const childArray = Array.isArray(children) ? children : [children];
    childArray.forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        el.appendChild(child);
      }
    });
    return el;
  },

  /**
   * Observes elements with IntersectionObserver
   * @param {string} selector - CSS selector
   * @param {Function} callback - Callback function
   * @param {Object} options - Observer options
   */
  observeElements(selector, callback, options = {}) {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll(selector).forEach(el => callback(el));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
      ...options
    });

    document.querySelectorAll(selector).forEach(el => observer.observe(el));
  },

  /**
   * Animates a counter
   * @param {HTMLElement} el - Element to animate
   * @param {number} target - Target number
   * @param {number} duration - Animation duration in ms
   */
  animateCounter(el, target, duration = 2000) {
    if (!el || isNaN(target)) return;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * eased);
      el.textContent = this.formatNumber(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = this.formatNumber(target);
      }
    }

    requestAnimationFrame(update);
  },

  /**
   * Shows element with animation
   * @param {HTMLElement} el - Element to show
   */
  show(el) {
    if (!el) return;
    el.hidden = false;
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  },

  /**
   * Hides element with animation
   * @param {HTMLElement} el - Element to hide
   */
  hide(el) {
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    setTimeout(() => {
      el.hidden = true;
    }, 300);
  }
};

// Export for use in other modules
window.Utils = Utils;

// Also support ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}