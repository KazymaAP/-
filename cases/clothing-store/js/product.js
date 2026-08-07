class ProductPage {
  constructor() {
    this.productId = +Utils.getParam('id') || 1;
    this.product = (typeof ALL_PRODUCTS !== 'undefined' && ALL_PRODUCTS.find(p => p.id === this.productId)) || (typeof ALL_PRODUCTS !== 'undefined' && ALL_PRODUCTS[0]);
    if (!this.product) {
      this.product = { id: 1, name: 'Товар', brand: 'Brand Name', price: 0, image: '', sizes: ['S'], availableSizes: ['S'], colors: ['#000'] };
    }
    this.selectedColor = this.product.colors[0] || '#000';
    this.selectedSize = (this.product.availableSizes.length > 1 ? this.product.availableSizes[1] : this.product.availableSizes[0]) || 'S';
    this.mainImage = this.product.image;
    this.images = [this.product.image, this.product.image, this.product.image, this.product.image];
    this.init();
  }

  init() {
    this.renderThumbnails();
    this.renderSimilarProducts();
    this.renderReviews();
    this.bindEvents();
    this.updateFavoriteButton();
  }

  renderThumbnails() {
    const thumbs = document.getElementById('thumbs');
    if (thumbs) {
      thumbs.innerHTML = this.images.map((img, i) => `
        <button class="image-gallery__thumb ${i === 0 ? 'image-gallery__thumb--active' : ''}" data-index="${i}">
          <img src="${img}" alt="Фото ${i + 1}" width="64" height="85" loading="lazy">
        </button>
      `).join('');
    }
  }

  renderReviews() {
    const reviews = [
      { author: 'Мария К.', date: '10 августа 2026', rating: 5, text: 'Прекрасное платье! Ткань приятная, сидит идеально. Размер M на параметры 88-68-96 подошёл отлично.' },
      { author: 'Елена В.', date: '5 августа 2026', rating: 5, text: 'Заказывала на свадьбу. Все гости делали комплименты! Качество шитья на высоте.' },
      { author: 'Анна С.', date: '1 августа 2026', rating: 4, text: 'Хорошее платье, но немного прозрачное в области декольте. В остальном всё отлично.' },
      { author: 'Ольга Д.', date: '25 июля 2026', rating: 5, text: 'Заказываю уже второй раз в разных цветах. Очень нравится! Доставка быстрая.' },
      { author: 'Наталья М.', date: '20 июля 2026', rating: 5, text: 'Шикарное платье! Материал не мнётся, идеально держит форму. Рекомендую!' }
    ];

    const list = document.getElementById('reviews-list');
    if (list) {
      list.innerHTML = reviews.map(r => `
        <div class="review-card">
          <div class="review-card__header">
            <span class="review-card__author">${Utils.sanitizeHTML(r.author)}</span>
            <span class="review-card__date">${Utils.sanitizeHTML(r.date)}</span>
          </div>
          <div class="review-card__rating">
            <div class="rating-stars">${Utils.generateStars(r.rating)}</div>
          </div>
          <p class="review-card__text">${Utils.sanitizeHTML(r.text)}</p>
        </div>
      `).join('');
    }
  }

  renderSimilarProducts() {
    const similar = ALL_PRODUCTS.filter(p => p.id !== this.productId).slice(0, 5);
    const container = document.getElementById('similar-products');
    if (!container) return;
    container.innerHTML = similar.map(p => {
      const discount = Utils.calculateDiscount(p.price, p.oldPrice);
      return `
        <article class="product-card">
          <div class="product-card__image-wrapper">
            <img src="${Utils.sanitizeHTML(p.image)}" alt="${Utils.sanitizeHTML(p.name)}" class="product-card__image" loading="lazy" width="300" height="400">
            ${discount > 0 ? `<div class="product-card__badges"><span class="badge badge--sale">-${discount}%</span></div>` : ''}
          </div>
          <div class="product-card__info">
            <p class="product-card__brand">${Utils.sanitizeHTML(p.brand)}</p>
            <h3 class="product-card__title"><a href="product.html?id=${p.id}" class="product-card__link">${Utils.sanitizeHTML(p.name)}</a></h3>
            <div class="product-card__price">
              <span class="product-card__price-current">${Utils.formatPrice(p.price)}</span>
              ${p.oldPrice ? `<span class="product-card__price-old">${Utils.formatPrice(p.oldPrice)}</span>` : ''}
            </div>
            <button class="btn btn--primary btn--full product-card__add-to-cart" data-product-id="${p.id}">В корзину</button>
          </div>
        </article>`;
    }).join('');
  }

  updateFavoriteButton() {
    const btn = document.getElementById('add-to-favorites-btn');
    if (btn) {
      const isFav = favorites.has(this.productId);
      btn.setAttribute('aria-pressed', isFav);
      btn.style.color = isFav ? 'var(--danger)' : '';
    }
  }

  bindEvents() {
    document.getElementById('color-options')?.addEventListener('click', (e) => {
      const dot = e.target.closest('.color-dot');
      if (!dot) return;
      document.querySelectorAll('#color-options .color-dot').forEach(d => d.classList.remove('color-dot--active'));
      dot.classList.add('color-dot--active');
      this.selectedColor = dot.dataset.color;
      const colorName = document.getElementById('selected-color');
      if (colorName) colorName.textContent = this.selectedColor;
    });

    document.getElementById('size-options')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.size-btn');
      if (!btn || btn.disabled) return;
      document.querySelectorAll('#size-options .size-btn').forEach(b => b.classList.remove('size-btn--active'));
      btn.classList.add('size-btn--active');
      this.selectedSize = btn.textContent;
      const sizeName = document.getElementById('selected-size');
      if (sizeName) sizeName.textContent = this.selectedSize;
    });

    document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
      cart.addItem({
        id: this.product.id,
        name: this.product.name,
        price: this.product.price,
        image: this.product.image
      }, this.selectedSize, this.selectedColor);
      window.showToast(`${this.product.name} добавлен в корзину`, 'success');
    });

    document.getElementById('add-to-favorites-btn')?.addEventListener('click', () => {
      const added = favorites.toggle(this.productId);
      this.updateFavoriteButton();
      window.showToast(added ? 'Добавлено в избранное' : 'Убрано из избранного', added ? 'success' : 'info');
    });

    document.getElementById('thumbs')?.addEventListener('click', (e) => {
      const thumb = e.target.closest('.image-gallery__thumb');
      if (!thumb) return;
      const index = +thumb.dataset.index;
      document.querySelectorAll('.image-gallery__thumb').forEach(t => t.classList.remove('image-gallery__thumb--active'));
      thumb.classList.add('image-gallery__thumb--active');
      const mainImg = document.getElementById('main-image');
      if (mainImg) mainImg.src = this.images[index];
    });

    document.querySelectorAll('.tabs__item').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tabs__item').forEach(t => { t.classList.remove('tabs__item--active'); t.setAttribute('aria-selected', 'false'); });
        document.querySelectorAll('.product-page__tab-content').forEach(c => c.classList.add('hidden'));
        tab.classList.add('tabs__item--active');
        tab.setAttribute('aria-selected', 'true');
        const tabId = tab.dataset.tab;
        const content = document.getElementById('tab-' + tabId);
        if (content) content.classList.remove('hidden');
      });
    });

    const sizeGuideBtn = document.getElementById('size-guide-btn');
    const sizeModal = document.getElementById('size-modal');
    if (sizeGuideBtn && sizeModal) {
      sizeGuideBtn.addEventListener('click', () => sizeModal.classList.add('open'));
      sizeModal.addEventListener('click', (e) => { if (e.target.classList.contains('modal-backdrop')) sizeModal.classList.remove('open'); });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof ALL_PRODUCTS !== 'undefined') {
    window.productPage = new ProductPage();
  }
});
