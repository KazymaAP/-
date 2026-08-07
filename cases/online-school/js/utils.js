/**
 * Shared Utilities Module
 * Common functions used across the application
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
   * Category labels map
   */
  categoryLabels: {
    dev: 'Программирование',
    design: 'Дизайн',
    marketing: 'Маркетинг',
    business: 'Бизнес'
  },

  /**
   * Level labels map
   */
  levelLabels: {
    beginner: 'Начинающий',
    intermediate: 'Средний',
    advanced: 'Продвинутый'
  }
};

// Export for use in other modules
window.Utils = Utils;

// Also support ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}