class Cart {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('cart')) || [];
    this.promoDiscount = 0;
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.items));
    localStorage.setItem('cart', JSON.stringify(this.items));
    this.updateBadges();
  }

  addItem(product, size, color, quantity = 1) {
    const existingIndex = this.items.findIndex(
      item => item.id === product.id && item.size === size && item.color === color
    );

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size,
        color,
        quantity
      });
    }

    this.notify();
    return true;
  }

  removeItem(productId, size, color) {
    this.items = this.items.filter(
      item => !(item.id === productId && item.size === size && item.color === color)
    );
    this.notify();
  }

  updateQuantity(productId, size, color, quantity) {
    const item = this.items.find(
      item => item.id === productId && item.size === size && item.color === color
    );

    if (item) {
      item.quantity = Math.max(1, Math.min(99, quantity));
      this.notify();
    }
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  clear() {
    this.items = [];
    this.promoDiscount = 0;
    this.notify();
  }

  async applyPromo(code) {
    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase(), total: this.getTotal() })
      });
      const result = await response.json();
      if (result.valid) {
        this.promoDiscount = result.discount;
        this.notify();
        return result;
      }
      throw new Error(result.message || 'Промокод недействителен');
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        if (code.trim().toUpperCase() === 'AUTUMN30') {
          const discount = Math.round(this.getTotal() * 0.3);
          this.promoDiscount = discount;
          this.notify();
          return { valid: true, discount, type: 'percent', value: 30 };
        }
      }
      throw err;
    }
  }

  updateBadges() {
    const count = this.getItemCount();
    document.querySelectorAll('.cart-badge').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
    document.querySelectorAll('.cart-badge-mobile').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }
}

const cart = new Cart();
window.cart = cart;
