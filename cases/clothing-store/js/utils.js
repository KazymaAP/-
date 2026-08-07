const Utils = {
  formatPrice(price) {
    return price.toLocaleString('ru-RU') + ' ₽';
  },

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  throttle(fn, limit = 100) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  },

  setParam(name, value) {
    const url = new URL(window.location);
    if (value) url.searchParams.set(name, value);
    else url.searchParams.delete(name);
    window.history.replaceState({}, '', url);
  },

  async fetchJSON(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  lazyLoadImages() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
          }
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
  },

  generateStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) html += '<span class="rating-stars__star rating-stars__star--filled">★</span>';
      else if (i - 0.5 <= rating) html += '<span class="rating-stars__star rating-stars__star--half">★</span>';
      else html += '<span class="rating-stars__star">★</span>';
    }
    return html;
  },

  calculateDiscount(price, oldPrice) {
    if (!oldPrice || oldPrice <= price) return 0;
    return Math.round((1 - price / oldPrice) * 100);
  }
};

window.Utils = Utils;
