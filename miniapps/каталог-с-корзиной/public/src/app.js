'use strict';

const App = {
    products: [],
    cart: (() => { try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch (e) { return []; } })(),
    favorites: (() => { try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch (e) { return []; } })(),
    orders: (() => { try { return JSON.parse(localStorage.getItem('orders') || '[]'); } catch (e) { return []; } })(),
    currentCategory: 'all',
    searchQuery: '',
    activeTab: 'catalog',

    init() {
        this.loadProducts();
        this.render();
        this.bindEvents();
        this.initTheme();
    },

    loadProducts() {
        this.products = [
            { id: 1, name: 'Футболка классическая', price: 2490, oldPrice: 3490, category: 'clothes', image: '/assets/images/placeholders/product.svg', desc: 'Хлопок 100%, разные размеры' },
            { id: 2, name: 'Наушники Bluetooth', price: 4990, category: 'electronics', image: '/assets/images/placeholders/product.svg', desc: 'Беспроводные, шумоподавление' },
            { id: 3, name: 'Кружка керамическая', price: 890, category: 'home', image: '/assets/images/placeholders/product.svg', desc: '330 мл, посудомоечная машина' },
            { id: 4, name: 'Рюкзак городской', price: 3990, oldPrice: 5490, category: 'accessories', image: '/assets/images/placeholders/product.svg', desc: 'Водонепроницаемый, 25л' },
            { id: 5, name: 'Планшет Android', price: 14990, category: 'electronics', image: '/assets/images/placeholders/product.svg', desc: '10.1", 64GB, Wi-Fi' },
            { id: 6, name: 'Куртка демисезонная', price: 7990, category: 'clothes', image: '/assets/images/placeholders/product.svg', desc: 'Лёгкая, ветрозащитная' },
            { id: 7, name: 'Настольная лампа LED', price: 2490, category: 'home', image: '/assets/images/placeholders/product.svg', desc: '3 режима, USB-зарядка' },
            { id: 8, name: 'Чехол для телефона', price: 990, category: 'accessories', image: '/assets/images/placeholders/product.svg', desc: 'Силикон, разные цвета' },
            { id: 9, name: 'Клавиатура механическая', price: 6490, category: 'electronics', image: '/assets/images/placeholders/product.svg', desc: 'RGB-подсветка, USB-C' },
            { id: 10, name: 'Полотенце банное', price: 1490, category: 'home', image: '/assets/images/placeholders/product.svg', desc: 'Египетский хлопок, 500г/м²' }
        ];
    },

    bindEvents() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.activeTab = tab.dataset.tab;
                this.render();
            });
        });

        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderProducts();
        });

        document.getElementById('cartBadge')?.addEventListener('click', () => {
            this.activeTab = 'cart';
            this.render();
        });

        document.getElementById('themeToggle')?.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            document.documentElement.setAttribute('data-theme', isDark ? '' : 'dark');
            localStorage.setItem('theme', isDark ? 'light' : 'dark');
        });
    },

    initTheme() {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    },

    render() {
        document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === this.activeTab));
        document.getElementById('catalogSection').classList.toggle('active', this.activeTab === 'catalog');
        document.getElementById('cartSection').classList.toggle('active', this.activeTab === 'cart');
        document.getElementById('favoritesSection').classList.toggle('active', this.activeTab === 'favorites');
        document.getElementById('ordersSection').classList.toggle('active', this.activeTab === 'orders');

        this.updateCartBadge();
        this.renderProducts();
        this.renderCart();
        this.renderFavorites();
        this.renderOrders();
    },

    renderProducts() {
        const container = document.getElementById('productsGrid');
        if (!container) return;
        let filtered = this.products;

        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(p => p.category === this.currentCategory);
        }
        if (this.searchQuery) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(this.searchQuery) || p.desc.toLowerCase().includes(this.searchQuery));
        }

        container.innerHTML = filtered.map(p => `
            <div class="product-card">
                <img class="product-card__image" src="${p.image}" alt="${this.esc(p.name)}" loading="lazy">
                <div class="product-card__body">
                    <div class="product-card__title">${this.esc(p.name)}</div>
                    <div>
                        <span class="product-card__price">${this.formatPrice(p.price)}</span>
                        ${p.oldPrice ? `<span class="product-card__old-price">${this.formatPrice(p.oldPrice)}</span>` : ''}
                    </div>
                    <div class="product-card__actions">
                        <button class="btn-add" onclick="App.addToCart(${p.id})">В корзину</button>
                        <button class="btn-fav ${this.favorites.includes(p.id) ? 'active' : ''}" onclick="App.toggleFavorite(${p.id})" aria-label="В избранное">
                            ${this.favorites.includes(p.id) ? '❤️' : '🤍'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderCart() {
        const container = document.getElementById('cartItems');
        const summary = document.getElementById('cartSummary');
        if (!container || !summary) return;

        if (this.cart.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Корзина пуста</p></div>';
            summary.style.display = 'none';
            return;
        }

        summary.style.display = 'block';
        container.innerHTML = this.cart.map(item => {
            const product = this.products.find(p => p.id === item.id);
            if (!product) return '';
            return `
                <div class="cart-item">
                    <img class="cart-item__image" src="${product.image}" alt="${this.esc(product.name)}">
                    <div class="cart-item__info">
                        <div class="cart-item__title">${this.esc(product.name)}</div>
                        <div class="cart-item__price">${this.formatPrice(product.price)}</div>
                        <div class="cart-item__controls">
                            <button class="qty-btn" onclick="App.updateQty(${item.id}, -1)">−</button>
                            <span class="qty-value">${item.qty}</span>
                            <button class="qty-btn" onclick="App.updateQty(${item.id}, 1)">+</button>
                            <button class="cart-item__remove" onclick="App.removeFromCart(${item.id})" aria-label="Удалить">🗑</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const total = this.cart.reduce((sum, item) => {
            const p = this.products.find(pr => pr.id === item.id);
            return sum + (p ? p.price * item.qty : 0);
        }, 0);

        document.getElementById('cartTotal').textContent = this.formatPrice(total);
    },

    renderFavorites() {
        const container = document.getElementById('favoritesGrid');
        if (!container) return;
        const favProducts = this.products.filter(p => this.favorites.includes(p.id));

        if (favProducts.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Нет избранных товаров</p></div>';
            return;
        }

        container.innerHTML = favProducts.map(p => `
            <div class="product-card">
                <img class="product-card__image" src="${p.image}" alt="${this.esc(p.name)}" loading="lazy">
                <div class="product-card__body">
                    <div class="product-card__title">${this.esc(p.name)}</div>
                    <div class="product-card__price">${this.formatPrice(p.price)}</div>
                    <div class="product-card__actions">
                        <button class="btn-add" onclick="App.addToCart(${p.id})">В корзину</button>
                        <button class="btn-fav active" onclick="App.toggleFavorite(${p.id})">❤️</button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderOrders() {
        const container = document.getElementById('ordersList');
        if (!container) return;

        if (this.orders.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Нет заказов</p></div>';
            return;
        }

        container.innerHTML = this.orders.map(o => `
            <div class="order-card">
                <div class="order-card__header">
                    <span class="order-card__id">Заказ #${o.id}</span>
                    <span class="order-card__status status-${o.status}">${this.statusLabel(o.status)}</span>
                </div>
                <div class="order-card__date">${o.date}</div>
                <div class="order-card__total">${this.formatPrice(o.total)}</div>
            </div>
        `).join('');
    },

    addToCart(id) {
        const existing = this.cart.find(i => i.id === id);
        if (existing) { existing.qty++; }
        else { this.cart.push({ id, qty: 1 }); }
        this.saveCart();
        this.updateCartBadge();
        this.showToast('Товар добавлен в корзину');
    },

    removeFromCart(id) {
        this.cart = this.cart.filter(i => i.id !== id);
        this.saveCart();
        this.render();
    },

    updateQty(id, delta) {
        const item = this.cart.find(i => i.id === id);
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) { this.removeFromCart(id); return; }
        this.saveCart();
        this.renderCart();
    },

    toggleFavorite(id) {
        const idx = this.favorites.indexOf(id);
        if (idx >= 0) this.favorites.splice(idx, 1);
        else this.favorites.push(id);
        try { localStorage.setItem('favorites', JSON.stringify(this.favorites)); } catch (e) {}
        this.render();
    },

    checkout() {
        if (this.cart.length === 0) return;
        const total = this.cart.reduce((sum, item) => {
            const p = this.products.find(pr => pr.id === item.id);
            return sum + (p ? p.price * item.qty : 0);
        }, 0);

        this.orders.unshift({
            id: Date.now().toString().slice(-6),
            items: [...this.cart],
            total,
            status: 'new',
            date: new Date().toLocaleDateString('ru-RU')
        });
        try { localStorage.setItem('orders', JSON.stringify(this.orders)); } catch (e) {}
        this.cart = [];
        this.saveCart();
        this.activeTab = 'orders';
        this.render();
        this.showToast('Заказ оформлен!');
    },

    saveCart() {
        try { localStorage.setItem('cart', JSON.stringify(this.cart)); } catch (e) {}
    },

    updateCartBadge() {
        const count = this.cart.reduce((sum, i) => sum + i.qty, 0);
        const badge = document.getElementById('cartBadge');
        if (badge) {
            const num = badge.querySelector('.badge');
            if (num) {
                num.textContent = count;
                num.style.display = count > 0 ? 'flex' : 'none';
            }
        }
    },

    showToast(msg) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    },

    formatPrice(n) {
        return new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
    },

    statusLabel(s) {
        return { new: 'Новый', processing: 'В обработке', delivered: 'Доставлен' }[s] || s;
    },

    esc(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    },

    destroy() {
        // Clean up event listeners by cloning the app container
        const appContainer = document.getElementById('app');
        if (appContainer) {
            const clone = appContainer.cloneNode(true);
            appContainer.replaceWith(clone);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
