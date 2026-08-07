class App {
  constructor() {
    this.init();
  }

  init() {
    this.initHeader();
    this.initMobileMenu();
    this.initSearch();
    this.initAddToCartHandlers();
    this.initFavoriteHandlers();
    this.initToasts();
    cart.updateBadges();
    favorites.updateBadges();
  }

  initHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    let lastScroll = 0;
    window.addEventListener('scroll', Utils.throttle(() => {
      const currentScroll = window.pageYOffset;
      header.classList.toggle('scrolled', currentScroll > 10);
      lastScroll = currentScroll;
    }, 100));
  }

  initMobileMenu() {
    const hamburger = document.getElementById('hamburger-btn');
    const menu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('mobile-overlay');
    if (!hamburger || !menu) return;

    const toggle = () => {
      const isOpen = menu.classList.contains('open');
      menu.classList.toggle('open');
      hamburger.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', !isOpen);
      overlay?.classList.toggle('visible');
      document.body.style.overflow = isOpen ? '' : 'hidden';
    };

    hamburger.addEventListener('click', toggle);
    overlay?.addEventListener('click', toggle);
    menu.querySelectorAll('.mobile-menu__link').forEach(link => {
      link.addEventListener('click', () => { if (menu.classList.contains('open')) toggle(); });
    });
  }

  initSearch() {
    const searchBtn = document.getElementById('search-btn');
    const searchOverlay = document.getElementById('search-overlay');
    const searchInput = document.getElementById('search-input');
    const searchClose = document.getElementById('search-close');
    const searchResults = document.getElementById('search-results');

    if (!searchBtn || !searchOverlay) return;

    const openSearch = () => {
      searchOverlay.classList.add('open');
      setTimeout(() => searchInput?.focus(), 100);
    };

    const closeSearch = () => {
      searchOverlay.classList.remove('open');
      if (searchInput) searchInput.value = '';
      if (searchResults) { searchResults.innerHTML = ''; searchResults.classList.remove('visible'); }
    };

    searchBtn.addEventListener('click', openSearch);
    searchClose?.addEventListener('click', closeSearch);
    searchOverlay.addEventListener('click', (e) => { if (e.target === searchOverlay) closeSearch(); });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchOverlay.classList.contains('open')) closeSearch();
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
    });

    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        const term = e.target.value.trim().toLowerCase();
        if (term.length < 2) { searchResults.classList.remove('visible'); return; }

        if (typeof ALL_PRODUCTS !== 'undefined') {
          const results = ALL_PRODUCTS.filter(p =>
            p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term)
          ).slice(0, 5);

          if (results.length > 0) {
            searchResults.innerHTML = results.map(p => `
              <a href="product.html?id=${p.id}" class="search-overlay__result-item">
                <img src="${Utils.sanitizeHTML(p.image)}" alt="${Utils.sanitizeHTML(p.name)}" class="search-overlay__result-image" loading="lazy" width="48" height="64">
                <div class="search-overlay__result-info">
                  <div class="search-overlay__result-title">${Utils.sanitizeHTML(p.name)}</div>
                  <div class="search-overlay__result-price">${Utils.formatPrice(p.price)}</div>
                </div>
              </a>
            `).join('');
            searchResults.classList.add('visible');
          } else {
            searchResults.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-secondary)">Ничего не найдено</div>';
            searchResults.classList.add('visible');
          }
        }
      }, 300));

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
          window.location.href = `catalog.html?search=${encodeURIComponent(searchInput.value.trim())}`;
        }
      });
    }
  }

  initAddToCartHandlers() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.product-card__add-to-cart');
      if (!btn) return;

      const productId = +btn.dataset.productId;
      if (typeof ALL_PRODUCTS !== 'undefined') {
        const product = ALL_PRODUCTS.find(p => p.id === productId);
        if (product) {
          const card = btn.closest('.product-card');
          const activeSize = card?.querySelector('.size-btn--active') || card?.querySelector('.size-btn:not(:disabled)');
          const activeColor = card?.querySelector('.color-dot--active');
          const size = activeSize?.textContent || product.sizes[1] || product.sizes[0];
          const color = activeColor?.dataset?.color || product.colors[0];

          cart.addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image
          }, size, color);

          btn.textContent = 'Добавлено ✓';
          btn.style.background = 'var(--success)';
          setTimeout(() => {
            btn.textContent = 'В корзину';
            btn.style.background = '';
          }, 1500);

          window.showToast(`${product.name} добавлен в корзину`, 'success');
        }
      }
    });
  }

  initFavoriteHandlers() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.product-card__favorite');
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const productId = +btn.dataset.productId;
      const added = favorites.toggle(productId);

      btn.setAttribute('aria-pressed', added);
      const svg = btn.querySelector('svg');
      if (svg) {
        svg.setAttribute('fill', added ? 'currentColor' : 'none');
      }

      btn.style.background = added ? 'var(--danger)' : 'white';
      btn.style.color = added ? 'white' : 'var(--text-secondary)';

      window.showToast(added ? 'Добавлено в избранное' : 'Убрано из избранного', added ? 'success' : 'info');
    });
  }

  initToasts() {
    window.showToast = (message, type = 'info') => {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
      };

      const toast = document.createElement('div');
      toast.className = `toast toast--${type}`;
      toast.innerHTML = `
        <span class="toast__icon">${icons[type] || icons.info}</span>
        <span class="toast__message">${Utils.sanitizeHTML(message)}</span>
        <button class="toast__close" aria-label="Закрыть"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
      `;

      container.appendChild(toast);

      const close = () => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
      };

      toast.querySelector('.toast__close').addEventListener('click', close);
      setTimeout(close, 4000);
    };
  }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new App(); });
