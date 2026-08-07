const ALL_PRODUCTS = [
  { id: 1, name: 'Платье вечернее "Звёзды"', brand: 'Brand Name', price: 4500, oldPrice: 6000, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600', rating: 4.8, reviews: 24, isNew: true, category: 'dresses', colors: ['#000','#fff','#dc2626'], sizes: ['XS','S','M','L','XL'], availableSizes: ['S','M','L','XL'] },
  { id: 2, name: 'Куртка джинсовая "Ретро"', brand: 'Brand Name', price: 7200, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600', rating: 4.6, reviews: 18, isNew: true, category: 'jackets', colors: ['#2563EB','#000'], sizes: ['S','M','L','XL'], availableSizes: ['S','M','L'] },
  { id: 3, name: 'Блузка шёлковая "Нежность"', brand: 'Brand Name', price: 3200, image: 'https://images.unsplash.com/photo-1562572159-4efc207f5aff?w=600', rating: 4.9, reviews: 31, isNew: true, category: 'blouses', colors: ['#fff','#F59E0B','#16A34A'], sizes: ['XS','S','M','L'], availableSizes: ['XS','S','M','L'] },
  { id: 4, name: 'Штаны палаццо "Элегант"', brand: 'Brand Name', price: 4800, oldPrice: 5500, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600', rating: 4.5, reviews: 12, isNew: true, category: 'pants', colors: ['#000','#6B7280'], sizes: ['XS','S','M','L','XL'], availableSizes: ['S','M','L','XL'] },
  { id: 5, name: 'Платье миди "Весна"', brand: 'Brand Name', price: 5100, image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600', rating: 4.7, reviews: 9, isNew: true, category: 'dresses', colors: ['#2563EB','#dc2626','#000'], sizes: ['XS','S','M','L'], availableSizes: ['XS','S','M'] },
  { id: 6, name: 'Пиджак оверсайз "Классик"', brand: 'Brand Name', price: 8500, oldPrice: 11000, image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600', rating: 4.9, reviews: 42, category: 'jackets', colors: ['#000','#374151'], sizes: ['S','M','L','XL'], availableSizes: ['S','M','L','XL'] },
  { id: 7, name: 'Платье-рубашка "Классика"', brand: 'Brand Name', price: 3900, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600', rating: 4.7, reviews: 35, category: 'dresses', colors: ['#fff','#000'], sizes: ['XS','S','M','L','XL'], availableSizes: ['XS','S','M','L'] },
  { id: 8, name: 'Кардиган крупной вязки', brand: 'Brand Name', price: 5600, oldPrice: 7000, image: 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=600', rating: 4.8, reviews: 28, category: 'jackets', colors: ['#D97706','#000','#fff'], sizes: ['S','M','L'], availableSizes: ['S','M','L'] },
  { id: 9, name: 'Юбка плиссе "Грация"', brand: 'Brand Name', price: 3400, image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600', rating: 4.6, reviews: 19, category: 'pants', colors: ['#000','#16A34A','#2563EB'], sizes: ['XS','S','M','L'], availableSizes: ['XS','S','M','L'] },
  { id: 10, name: 'Свитер меринос "Уют"', brand: 'Brand Name', price: 4200, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600', rating: 4.8, reviews: 33, category: 'blouses', colors: ['#fff','#6B7280','#2563EB'], sizes: ['S','M','L','XL'], availableSizes: ['S','M','L','XL'] },
  { id: 11, name: 'Блузка хлопковая "Лёгкость"', brand: 'Brand Name', price: 2800, image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600', rating: 4.5, reviews: 15, category: 'blouses', colors: ['#fff','#2563EB'], sizes: ['XS','S','M','L'], availableSizes: ['XS','S','M','L'] },
  { id: 12, name: 'Платье коктейльное "Вечер"', brand: 'Brand Name', price: 6200, oldPrice: 8000, image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600', rating: 4.9, reviews: 38, category: 'dresses', colors: ['#000','#dc2626'], sizes: ['XS','S','M','L'], availableSizes: ['XS','S','M'] },
  { id: 13, name: 'Куртка утеплённая "Зима"', brand: 'Brand Name', price: 9800, image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600', rating: 4.7, reviews: 21, category: 'jackets', colors: ['#000','#374151'], sizes: ['S','M','L','XL'], availableSizes: ['S','M','L','XL'] },
  { id: 14, name: 'Штаны-киллар "Мода"', brand: 'Brand Name', price: 3600, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600', rating: 4.4, reviews: 11, category: 'pants', colors: ['#000','#6B7280'], sizes: ['XS','S','M','L','XL'], availableSizes: ['S','M','L'] },
  { id: 15, name: 'Платье макси "Цветы"', brand: 'Brand Name', price: 5500, image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600', rating: 4.8, reviews: 27, category: 'dresses', colors: ['#2563EB','#16A34A'], sizes: ['XS','S','M','L'], availableSizes: ['XS','S','M','L'] },
  { id: 16, name: 'Блузка атласная "Шик"', brand: 'Brand Name', price: 3800, oldPrice: 4500, image: 'https://images.unsplash.com/photo-1562572159-4efc207f5aff?w=600', rating: 4.6, reviews: 22, category: 'blouses', colors: ['#fff','#D97706','#dc2626'], sizes: ['XS','S','M','L','XL'], availableSizes: ['S','M','L','XL'] }
];

const PRODUCTS_PER_PAGE = 8;

class CatalogPage {
  constructor() {
    this.products = [...ALL_PRODUCTS];
    this.filtered = [...ALL_PRODUCTS];
    this.displayed = [];
    this.page = 1;
    this.filters = { sizes: [], colors: [], category: [], priceMin: 0, priceMax: 15000, sale: false, isNew: false };
    this.sort = 'popular';
    this.searchTerm = '';
    this.init();
  }

  init() {
    this.applyURLParams();
    this.renderFilters();
    this.renderProducts();
    this.bindEvents();
  }

  applyURLParams() {
    const category = Utils.getParam('category');
    const sale = Utils.getParam('sale');
    const newParam = Utils.getParam('new');
    const search = Utils.getParam('search');
    if (category) this.filters.category = [category];
    if (sale === '1') this.filters.sale = true;
    if (newParam === '1') this.filters.isNew = true;
    if (search) this.searchTerm = search;
    this.applyFilters();
  }

  renderFilters() {
    const categories = [...new Set(ALL_PRODUCTS.map(p => p.category))];
    const categoryNames = { dresses: 'Платья', blouses: 'Блузки', pants: 'Штаны/Юбки', jackets: 'Куртки/Пиджаки' };
    const allSizes = [...new Set(ALL_PRODUCTS.flatMap(p => p.sizes))];
    const allColors = [...new Set(ALL_PRODUCTS.flatMap(p => p.colors))];

    const html = `
      <div class="filter-section">
        <h3 class="filter-section__title">Категория</h3>
        <div class="filter-section__content">
          ${categories.map(c => `<label class="filter-checkbox"><input type="checkbox" name="category" value="${Utils.sanitizeHTML(c)}" ${this.filters.category.includes(c) ? 'checked' : ''}><span>${Utils.sanitizeHTML(categoryNames[c] || c)}</span></label>`).join('')}
        </div>
      </div>
      <div class="filter-section">
        <h3 class="filter-section__title">Размер</h3>
        <div class="filter-section__content" style="flex-direction:row;flex-wrap:wrap;gap:6px">
          ${allSizes.map(s => `<button class="size-btn ${this.filters.sizes.includes(s) ? 'size-btn--active' : ''}" data-size="${Utils.sanitizeHTML(s)}">${Utils.sanitizeHTML(s)}</button>`).join('')}
        </div>
      </div>
      <div class="filter-section">
        <h3 class="filter-section__title">Цвет</h3>
        <div class="filter-colors">
          ${allColors.map(c => `<button class="filter-color ${this.filters.colors.includes(c) ? 'filter-color--active' : ''}" style="background:${Utils.sanitizeHTML(c)}" data-color="${Utils.sanitizeHTML(c)}" aria-label="Цвет"></button>`).join('')}
        </div>
      </div>
      <div class="filter-section">
        <h3 class="filter-section__title">Цена</h3>
        <div class="price-range">
          <input type="number" class="price-range__input" id="price-min" value="${this.filters.priceMin}" min="0" max="15000" placeholder="От">
          <span class="price-range__separator">—</span>
          <input type="number" class="price-range__input" id="price-max" value="${this.filters.priceMax}" min="0" max="15000" placeholder="До">
        </div>
      </div>
      <div class="filter-section">
        <label class="filter-checkbox"><input type="checkbox" id="filter-sale" ${this.filters.sale ? 'checked' : ''}><span>Только со скидкой</span></label>
        <label class="filter-checkbox"><input type="checkbox" id="filter-new" ${this.filters.isNew ? 'checked' : ''}><span>Только новинки</span></label>
      </div>
      <button class="btn btn--outline btn--full" id="filter-reset">Сбросить фильтры</button>
    `;

    const sidebar = document.getElementById('filter-sidebar');
    if (sidebar) sidebar.innerHTML = html;
    const modalBody = document.getElementById('filter-modal-body');
    if (modalBody) modalBody.innerHTML = html;
  }

  bindEvents() {
    document.querySelectorAll('[name="category"]').forEach(cb => cb.addEventListener('change', () => {
      this.filters.category = [...document.querySelectorAll('[name="category"]:checked')].map(c => c.value);
      this.applyFilters();
    }));

    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-size]')) {
        e.target.classList.toggle('size-btn--active');
        this.filters.sizes = [...document.querySelectorAll('[data-size].size-btn--active')].map(b => b.dataset.size);
        this.applyFilters();
      }
      if (e.target.matches('[data-color]')) {
        e.target.classList.toggle('filter-color--active');
        this.filters.colors = [...document.querySelectorAll('[data-color].filter-color--active')].map(b => b.dataset.color);
        this.applyFilters();
      }
      if (e.target.id === 'filter-reset') {
        this.filters = { sizes: [], colors: [], category: [], priceMin: 0, priceMax: 15000, sale: false, isNew: false };
        this.renderFilters();
        this.applyFilters();
      }
    });

    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    if (priceMin) priceMin.addEventListener('input', Utils.debounce(() => { this.filters.priceMin = +priceMin.value || 0; this.applyFilters(); }, 500));
    if (priceMax) priceMax.addEventListener('input', Utils.debounce(() => { this.filters.priceMax = +priceMax.value || 15000; this.applyFilters(); }, 500));

    const filterSale = document.getElementById('filter-sale');
    const filterNew = document.getElementById('filter-new');
    if (filterSale) filterSale.addEventListener('change', () => { this.filters.sale = filterSale.checked; this.applyFilters(); });
    if (filterNew) filterNew.addEventListener('change', () => { this.filters.isNew = filterNew.checked; this.applyFilters(); });

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.addEventListener('change', () => { this.sort = sortSelect.value; this.applyFilters(); });

    const loadMore = document.getElementById('load-more-btn');
    if (loadMore) loadMore.addEventListener('click', () => { this.page++; this.renderProducts(); });

    const filterToggle = document.getElementById('filter-toggle');
    const filterModal = document.getElementById('filter-modal');
    const filterModalBackdrop = document.getElementById('filter-modal-backdrop');
    const filterModalClose = document.getElementById('filter-modal-close');
    if (filterToggle) filterToggle.addEventListener('click', () => filterModal.classList.add('open'));
    if (filterModalBackdrop) filterModalBackdrop.addEventListener('click', () => filterModal.classList.remove('open'));
    if (filterModalClose) filterModalClose.addEventListener('click', () => filterModal.classList.remove('open'));
  }

  applyFilters() {
    let results = [...ALL_PRODUCTS];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      results = results.filter(p => p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term));
    }
    if (this.filters.category.length) results = results.filter(p => this.filters.category.includes(p.category));
    if (this.filters.sizes.length) results = results.filter(p => p.sizes.some(s => this.filters.sizes.includes(s)));
    if (this.filters.colors.length) results = results.filter(p => p.colors.some(c => this.filters.colors.includes(c)));
    if (this.filters.priceMin > 0) results = results.filter(p => p.price >= this.filters.priceMin);
    if (this.filters.priceMax < 15000) results = results.filter(p => p.price <= this.filters.priceMax);
    if (this.filters.sale) results = results.filter(p => p.oldPrice);
    if (this.filters.isNew) results = results.filter(p => p.isNew);

    switch (this.sort) {
      case 'price-asc': results.sort((a, b) => a.price - b.price); break;
      case 'price-desc': results.sort((a, b) => b.price - a.price); break;
      case 'new': results.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
      case 'rating': results.sort((a, b) => b.rating - a.rating); break;
      default: results.sort((a, b) => b.reviews - a.reviews);
    }

    this.filtered = results;
    this.page = 1;
    this.renderProducts();

    const count = document.getElementById('catalog-count');
    if (count) count.textContent = `Показано ${Math.min(PRODUCTS_PER_PAGE, results.length)} из ${results.length}`;
  }

  renderProducts() {
    const container = document.getElementById('catalog-products');
    const loadMoreWrapper = document.getElementById('load-more-wrapper');
    if (!container) return;

    const end = this.page * PRODUCTS_PER_PAGE;
    this.displayed = this.filtered.slice(0, end);

    container.innerHTML = this.displayed.map(p => {
      const discount = Utils.calculateDiscount(p.price, p.oldPrice);
      const colorDots = p.colors.map((c, i) => `<button class="color-dot ${i === 0 ? 'color-dot--active' : ''}" style="background:${Utils.sanitizeHTML(c)}" aria-label="Цвет"></button>`).join('');
      const sizeBtns = p.sizes.map(s => `<button class="size-btn" ${!p.availableSizes.includes(s) ? 'disabled' : ''}>${Utils.sanitizeHTML(s)}</button>`).join('');
      return `
        <article class="product-card" data-product-id="${p.id}">
          <div class="product-card__image-wrapper">
            <img src="${Utils.sanitizeHTML(p.image)}" alt="${Utils.sanitizeHTML(p.name)}" class="product-card__image" loading="lazy" width="300" height="400">
            <div class="product-card__badges">
              ${p.isNew ? '<span class="badge badge--new">NEW</span>' : ''}
              ${discount > 0 ? `<span class="badge badge--sale">-${discount}%</span>` : ''}
            </div>
            <button class="product-card__favorite" aria-label="В избранное" aria-pressed="${favorites.has(p.id)}" data-product-id="${p.id}">
              <svg viewBox="0 0 24 24" fill="${favorites.has(p.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
          <div class="product-card__info">
            <p class="product-card__brand">${Utils.sanitizeHTML(p.brand)}</p>
            <h3 class="product-card__title"><a href="product.html?id=${p.id}" class="product-card__link">${Utils.sanitizeHTML(p.name)}</a></h3>
            <div class="product-card__rating" aria-label="Рейтинг ${p.rating}">
              <div class="product-card__stars">${'★'.repeat(Math.floor(p.rating))}</div>
              <span class="product-card__reviews">(${p.reviews})</span>
            </div>
            <div class="product-card__price">
              <span class="product-card__price-current">${Utils.formatPrice(p.price)}</span>
              ${p.oldPrice ? `<span class="product-card__price-old">${Utils.formatPrice(p.oldPrice)}</span>` : ''}
              ${discount > 0 ? `<span class="product-card__discount">-${discount}%</span>` : ''}
            </div>
            <div class="product-card__colors"><span class="product-card__label">Цвет:</span><div class="product-card__color-options">${colorDots}</div></div>
            <div class="product-card__sizes"><span class="product-card__label">Размер:</span><div class="product-card__size-options">${sizeBtns}</div></div>
            <button class="btn btn--primary btn--full product-card__add-to-cart" data-product-id="${p.id}">В корзину</button>
          </div>
        </article>`;
    }).join('');

    const count = document.getElementById('catalog-count');
    if (count) count.textContent = `Показано ${this.displayed.length} из ${this.filtered.length}`;
    if (loadMoreWrapper) loadMoreWrapper.style.display = this.displayed.length >= this.filtered.length ? 'none' : 'flex';
  }
}

document.addEventListener('DOMContentLoaded', () => { window.catalogPage = new CatalogPage(); });
