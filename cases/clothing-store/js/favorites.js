class Favorites {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('favorites')) || [];
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.items));
    localStorage.setItem('favorites', JSON.stringify(this.items));
    this.updateBadges();
  }

  toggle(productId) {
    const index = this.items.indexOf(productId);
    if (index > -1) {
      this.items.splice(index, 1);
    } else {
      this.items.push(productId);
    }
    this.notify();
    return index === -1;
  }

  add(productId) {
    if (!this.items.includes(productId)) {
      this.items.push(productId);
      this.notify();
    }
  }

  remove(productId) {
    const index = this.items.indexOf(productId);
    if (index > -1) {
      this.items.splice(index, 1);
      this.notify();
    }
  }

  has(productId) {
    return this.items.includes(productId);
  }

  getAll() {
    return [...this.items];
  }

  getCount() {
    return this.items.length;
  }

  clear() {
    this.items = [];
    this.notify();
  }

  updateBadges() {
    const count = this.getCount();
    document.querySelectorAll('.favorites-badge').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }
}

const favorites = new Favorites();
window.favorites = favorites;
