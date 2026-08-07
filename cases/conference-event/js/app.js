/* ============================================
   TechConf 2026 — Conference Event Application
   ============================================ */

'use strict';

/* --- Utility Functions --- */
const Utils = {
  $(selector) {
    return document.querySelector(selector);
  },

  $$(selector) {
    return document.querySelectorAll(selector);
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  throttle(fn, limit = 100) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  },

  async fetchData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Fetch error:', err);
      return null;
    }
  },

  async postData(url, data) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (err) {
      console.error('Post error:', err);
      return { error: 'Network error' };
    }
  },

  animateCounter(element, target, duration = 1500) {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);
      element.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target;
      }
    }

    requestAnimationFrame(update);
  },
};

/* --- Header Component --- */
class Header {
  constructor() {
    this.header = Utils.$('#header');
    this.burgerBtn = Utils.$('#burgerBtn');
    this.mobileMenu = Utils.$('#mobileMenu');
    this.isMenuOpen = false;

    this.init();
  }

  init() {
    this.handleScroll();
    this.burgerBtn?.addEventListener('click', () => this.toggleMenu());

    this.mobileMenu?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => this.closeMenu());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) this.closeMenu();
    });

    window.addEventListener('scroll', Utils.throttle(() => this.handleScroll(), 100));
  }

  handleScroll() {
    const scrolled = window.scrollY > 50;
    this.header?.classList.toggle('header--scrolled', scrolled);
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.mobileMenu?.classList.toggle('active', this.isMenuOpen);
    this.burgerBtn?.classList.toggle('active', this.isMenuOpen);
    this.burgerBtn?.setAttribute('aria-expanded', this.isMenuOpen);
    this.mobileMenu?.setAttribute('aria-hidden', !this.isMenuOpen);
    document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.mobileMenu?.classList.remove('active');
    this.burgerBtn?.classList.remove('active');
    this.burgerBtn?.setAttribute('aria-expanded', 'false');
    this.mobileMenu?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

/* --- Countdown Component --- */
class Countdown {
  constructor() {
    this.targetDate = new Date('2026-09-15T09:00:00+03:00');
    this.elements = {
      days: Utils.$('#countdownDays'),
      hours: Utils.$('#countdownHours'),
      minutes: Utils.$('#countdownMinutes'),
      seconds: Utils.$('#countdownSeconds'),
    };

    if (this.elements.days) {
      this.update();
      setInterval(() => this.update(), 1000);
    }
  }

  update() {
    const now = new Date();
    const diff = this.targetDate - now;

    if (diff <= 0) {
      Object.values(this.elements).forEach((el) => {
        if (el) el.textContent = '00';
      });
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (this.elements.days) this.elements.days.textContent = String(days).padStart(2, '0');
    if (this.elements.hours) this.elements.hours.textContent = String(hours).padStart(2, '0');
    if (this.elements.minutes) this.elements.minutes.textContent = String(minutes).padStart(2, '0');
    if (this.elements.seconds) this.elements.seconds.textContent = String(seconds).padStart(2, '0');
  }
}

/* --- Hero Particles --- */
class HeroParticles {
  constructor() {
    this.container = Utils.$('#heroParticles');
    if (!this.container) return;
    this.createParticles();
  }

  createParticles() {
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 8 + 's';
      particle.style.animationDuration = 6 + Math.random() * 6 + 's';
      this.container.appendChild(particle);
    }
  }
}

/* --- Stats Animation --- */
class StatsAnimation {
  constructor() {
    this.stats = Utils.$$('.stats__value[data-count]');
    if (!this.stats.length) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = parseInt(entry.target.dataset.count);
            Utils.animateCounter(entry.target, target);
            this.observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    this.stats.forEach((stat) => this.observer.observe(stat));
  }
}

/* --- Speakers Component --- */
class SpeakersComponent {
  constructor() {
    this.grid = Utils.$('#speakersGrid');
    this.filters = Utils.$$('.speakers-filters .filter-btn');
    this.speakers = [];
    this.currentFilter = 'all';

    this.init();
  }

  async init() {
    this.speakers = await this.loadSpeakers();
    this.render();
    this.bindFilters();
  }

  async loadSpeakers() {
    const data = await Utils.fetchData('/api/speakers');
    if (data && Array.isArray(data)) return data;

    return [
      { id: 1, name: 'Иван Петров', company: 'TechCompany', role: 'CTO', topic: 'Тренды 2027: Что ждёт индустрию', category: 'tech', photo: null },
      { id: 2, name: 'Анна Сидорова', company: 'StartupHub', role: 'CEO', topic: 'Как мы выросли в 10 раз за год', category: 'business', photo: null },
      { id: 3, name: 'Дмитрий Козлов', company: 'TechCorp', role: 'Lead Developer', topic: 'Масштабируемая архитектура', category: 'tech', photo: null },
      { id: 4, name: 'Мария Волкова', company: 'DesignStudio', role: 'Design Lead', topic: 'Дизайн-системы в продакшне', category: 'design', photo: null },
      { id: 5, name: 'Алексей Смирнов', company: 'CloudFirst', role: 'DevOps Lead', topic: 'Kubernetes в реальных проектах', category: 'tech', photo: null },
      { id: 6, name: 'Елена Кузнецова', company: 'FinTech Pro', role: 'Product Owner', topic: 'Управление продуктом в Agile', category: 'business', photo: null },
      { id: 7, name: 'Сергей Попов', company: 'AI Labs', role: 'ML Engineer', topic: 'LLM в продакшне', category: 'tech', photo: null },
      { id: 8, name: 'Ольга Новикова', company: 'UX Agency', role: 'UX Researcher', topic: 'Исследования пользователей', category: 'design', photo: null },
    ];
  }

  render() {
    if (!this.grid) return;

    const filtered =
      this.currentFilter === 'all'
        ? this.speakers
        : this.speakers.filter((s) => s.category === this.currentFilter);

    this.grid.innerHTML = filtered
      .map(
        (s) => `
      <article class="speaker-card" role="listitem" aria-label="Спикер: ${Utils.escapeHtml(s.name)}">
        ${s.photo ? `<img class="speaker-card__photo" src="${Utils.escapeHtml(s.photo)}" alt="Фото ${Utils.escapeHtml(s.name)}" loading="lazy">` : `<div class="speaker-card__avatar" aria-hidden="true">${s.name.split(' ').map(n => n[0]).join('')}</div>`}
        <h3 class="speaker-card__name">${Utils.escapeHtml(s.name)}</h3>
        <p class="speaker-card__company">${Utils.escapeHtml(s.role)}, ${Utils.escapeHtml(s.company)}</p>
        <span class="speaker-card__topic">${Utils.escapeHtml(s.topic)}</span>
      </article>
    `
      )
      .join('');
  }

  bindFilters() {
    this.filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.filters.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        this.currentFilter = btn.dataset.filter;
        this.render();
      });
    });
  }
}

/* --- Schedule Component --- */
class ScheduleComponent {
  constructor() {
    this.list = Utils.$('#scheduleList');
    this.dayTabs = Utils.$$('.schedule-tabs .tab');
    this.trackBtns = Utils.$$('.schedule-tracks .track-btn');
    this.talks = [];
    this.currentDay = 1;
    this.currentTrack = 'main';

    this.init();
  }

  async init() {
    this.talks = await this.loadTalks();
    this.render();
    this.bindEvents();
  }

  async loadTalks() {
    const data = await Utils.fetchData('/api/program');
    if (data && Array.isArray(data)) return data;

    return [
      { id: 1, day: 1, track: 'main', time: '09:00–09:30', title: 'Регистрация и кофе', speaker: '', room: 'Лобби', type: 'break' },
      { id: 2, day: 1, track: 'main', time: '09:30–10:00', title: 'Открытие конференции', speaker: 'Организаторы', room: 'Зал A', type: 'talk' },
      { id: 3, day: 1, track: 'main', time: '10:00–10:45', title: 'Тренды 2027: Что ждёт индустрию', speaker: 'Иван Петров', room: 'Зал A', type: 'talk' },
      { id: 4, day: 1, track: 'main', time: '10:45–11:00', title: 'Перерыв', speaker: '', room: '', type: 'break' },
      { id: 5, day: 1, track: 'main', time: '11:00–11:45', title: 'Как мы выросли в 10 раз за год', speaker: 'Анна Сидорова', room: 'Зал A', type: 'talk' },
      { id: 6, day: 1, track: 'main', time: '11:45–12:00', title: 'Перерыв', speaker: '', room: '', type: 'break' },
      { id: 7, day: 1, track: 'main', time: '12:00–12:45', title: 'Панельная дискуссия: Будущее IT', speaker: 'Панель', room: 'Зал A', type: 'panel' },
      { id: 8, day: 1, track: 'main', time: '12:45–14:00', title: 'Обед', speaker: '', room: '', type: 'break' },
      { id: 9, day: 1, track: 'main', time: '14:00–14:45', title: 'Масштабируемая архитектура', speaker: 'Дмитрий Козлов', room: 'Зал A', type: 'talk' },
      { id: 10, day: 1, track: 'tech', time: '10:00–11:00', title: 'Kubernetes в реальных проектах', speaker: 'Алексей Смирнов', room: 'Зал B', type: 'workshop' },
      { id: 11, day: 1, track: 'tech', time: '11:15–12:15', title: 'LLM в продакшне', speaker: 'Сергей Попов', room: 'Зал B', type: 'talk' },
      { id: 12, day: 1, track: 'workshop', time: '14:00–16:00', title: 'Воркшоп: Архитектура микросервисов', speaker: 'Дмитрий Козлов', room: 'Коворкинг', type: 'workshop' },
      { id: 13, day: 2, track: 'main', time: '09:30–10:00', title: 'День 2: Открытие', speaker: 'Организаторы', room: 'Зал A', type: 'talk' },
      { id: 14, day: 2, track: 'main', time: '10:00–10:45', title: 'Дизайн-системы в продакшне', speaker: 'Мария Волкова', room: 'Зал A', type: 'talk' },
      { id: 15, day: 2, track: 'main', time: '11:00–11:45', title: 'Управление продуктом в Agile', speaker: 'Елена Кузнецова', room: 'Зал A', type: 'talk' },
      { id: 16, day: 2, track: 'tech', time: '10:00–11:00', title: 'Исследования пользователей', speaker: 'Ольга Новикова', room: 'Зал B', type: 'talk' },
    ];
  }

  render() {
    if (!this.list) return;

    const filtered = this.talks.filter(
      (t) => t.day === this.currentDay && t.track === this.currentTrack
    );

    if (filtered.length === 0) {
      this.list.innerHTML = `<div class="talk-card talk-card--break" style="justify-content:center;text-align:center;padding:40px"><p style="color:var(--text-muted)">Нет докладов в этом треке</p></div>`;
      return;
    }

    this.list.innerHTML = filtered
      .map(
        (t) => `
      <div class="talk-card ${t.type === 'break' ? 'talk-card--break' : ''}" data-id="${t.id}">
        <div class="talk-card__time">${Utils.escapeHtml(t.time)}</div>
        <div class="talk-card__info">
          <h3>${Utils.escapeHtml(t.title)}<span class="talk-card__type talk-card__type--${t.type}">${this.getTypeLabel(t.type)}</span></h3>
          ${t.speaker ? `<p class="talk-card__speaker">${Utils.escapeHtml(t.speaker)}</p>` : ''}
          ${t.room ? `<span class="talk-card__room">${Utils.escapeHtml(t.room)}</span>` : ''}
        </div>
        ${t.type !== 'break' ? `<button class="talk-card__action" data-action="add-schedule" data-id="${t.id}" aria-label="Добавить в расписание: ${Utils.escapeHtml(t.title)}">В расписание</button>` : ''}
      </div>
    `
      )
      .join('');
  }

  getTypeLabel(type) {
    const labels = { talk: 'Доклад', workshop: 'Воркшоп', panel: 'Панель', break: '' };
    return labels[type] || type;
  }

  bindEvents() {
    this.dayTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        this.dayTabs.forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        this.currentDay = parseInt(tab.dataset.day);
        this.render();
      });
    });

    this.trackBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.trackBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTrack = btn.dataset.track;
        this.render();
      });
    });

    this.list?.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action="add-schedule"]');
      if (actionBtn) {
        const talkId = actionBtn.dataset.id;
        this.addToSchedule(talkId, actionBtn);
      }
    });
  }

  addToSchedule(talkId, btn) {
    const saved = JSON.parse(localStorage.getItem('conference-schedule') || '[]');
    if (!saved.includes(talkId)) {
      saved.push(talkId);
      localStorage.setItem('conference-schedule', JSON.stringify(saved));
      btn.textContent = 'Добавлено ✓';
      btn.disabled = true;
      btn.style.background = 'var(--success)';
      Toast.show('Доклад добавлен в ваше расписание', 'success');
    } else {
      Toast.show('Доклад уже в расписании', 'error');
    }
  }
}

/* --- Ticket Purchase Component --- */
class TicketPurchase {
  constructor() {
    this.modal = Utils.$('#checkoutModal');
    this.selectedTier = null;
    this.tierNames = { earlybird: 'Early Bird', standard: 'Стандарт', vip: 'VIP' };

    this.init();
  }

  init() {
    Utils.$$('[data-action="buy"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.selectedTier = {
          tier: e.currentTarget.dataset.tier,
          price: parseInt(e.currentTarget.dataset.price),
        };
        this.openCheckout();
      });
    });

    this.modal?.querySelectorAll('[data-action="close-modal"]').forEach((el) => {
      el.addEventListener('click', () => this.closeCheckout());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
        this.closeCheckout();
      }
    });
  }

  openCheckout() {
    if (!this.modal) return;

    const tierEl = this.modal.querySelector('#checkoutTier');
    const priceEl = this.modal.querySelector('#checkoutPrice');

    if (tierEl) tierEl.textContent = this.tierNames[this.selectedTier.tier] || 'Билет';
    if (priceEl) priceEl.textContent = Utils.formatPrice(this.selectedTier.price);

    this.modal.classList.add('active');
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    this.initCheckoutForm();
  }

  closeCheckout() {
    this.modal?.classList.remove('active');
    this.modal?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  initCheckoutForm() {
    const form = this.modal?.querySelector('#checkoutForm');
    if (!form) return;

    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(newForm);
      const data = Object.fromEntries(formData);

      if (!this.validateCheckoutForm(data)) return;

      await this.processPayment(data);
    });
  }

  validateCheckoutForm(data) {
    if (!data.name || data.name.trim().length < 2) {
      Toast.show('Введите корректное имя', 'error');
      return false;
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      Toast.show('Введите корректный email', 'error');
      return false;
    }
    if (!data.phone || data.phone.trim().length < 10) {
      Toast.show('Введите корректный телефон', 'error');
      return false;
    }
    return true;
  }

  async processPayment(formData) {
    const result = await Utils.postData('/api/tickets/create-order', {
      tier: this.selectedTier.tier,
      ...formData,
    });

    if (result?.error) {
      Toast.show('Ошибка при создании заказа. Попробуйте ещё раз.', 'error');
      return;
    }

    this.showSuccess(result, formData);
    this.trackPurchase(result);
  }

  showSuccess(order, formData) {
    const container = this.modal?.querySelector('#checkoutFormContainer');
    if (!container) return;

    const orderId = Utils.escapeHtml(String(order?.orderId || 'N/A'));
    const email = Utils.escapeHtml(formData?.email || '');

    container.innerHTML = `
      <div class="checkout-success">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <h3>Билет оформлен!</h3>
        <p>Номер заказа: ${orderId}</p>
        <p>Билет отправлен на ${email}</p>
        <button class="btn btn--accent" onclick="document.querySelector('#checkoutModal').classList.remove('active'); document.body.style.overflow='';">Отлично!</button>
      </div>
    `;

    Toast.show('Билет успешно оформлен! Проверьте почту.', 'success');
  }

  trackPurchase(order) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'purchase', {
        transaction_id: order?.orderId,
        value: this.selectedTier.price,
        currency: 'RUB',
      });
    }
  }
}

/* --- Networking Component --- */
class NetworkingComponent {
  constructor() {
    this.grid = Utils.$('#networkingGrid');
    this.filters = Utils.$$('.networking-filters .filter-btn');
    this.profiles = [];
    this.currentFilter = 'all';

    this.init();
  }

  async init() {
    this.profiles = await this.loadProfiles();
    this.render();
    this.bindFilters();
  }

  async loadProfiles() {
    const data = await Utils.fetchData('/api/networking');
    if (data && Array.isArray(data)) return data;

    return [
      { id: 1, name: 'Иван Петров', company: 'TechCompany', role: 'speaker', interests: ['AI', 'Архитектура', 'Менторство'], photo: null },
      { id: 2, name: 'Анна Сидорова', company: 'StartupHub', role: 'speaker', interests: ['Стартапы', 'Фандрайзинг'], photo: null },
      { id: 3, name: 'Мария Волкова', company: 'DesignStudio', role: 'speaker', interests: ['Дизайн', 'UX'], photo: null },
      { id: 4, name: 'ООО «Технологии»', company: '', role: 'sponsor', interests: ['Cloud', 'DevOps'], photo: null },
      { id: 5, name: 'Алексей К.', company: 'WebDev Corp', role: 'attendee', interests: ['React', 'Node.js'], photo: null },
      { id: 6, name: 'Елена М.', company: 'FinTech', role: 'attendee', interests: ['Финтех', 'Блокчейн'], photo: null },
      { id: 7, name: 'Сергей Попов', company: 'AI Labs', role: 'speaker', interests: ['ML', 'LLM', 'Python'], photo: null },
      { id: 8, name: 'TechCorp', company: '', role: 'sponsor', interests: ['SaaS', 'Enterprise'], photo: null },
      { id: 9, name: 'Дмитрий Л.', company: 'MobileFirst', role: 'attendee', interests: ['Mobile', 'Flutter'], photo: null },
    ];
  }

  render() {
    if (!this.grid) return;

    const filtered =
      this.currentFilter === 'all'
        ? this.profiles
        : this.profiles.filter((p) => p.role === this.currentFilter);

    this.grid.innerHTML = filtered
      .map(
        (p) => `
      <div class="profile-card" role="listitem" aria-label="Участник: ${Utils.escapeHtml(p.name)}">
        ${p.photo ? `<img class="profile-card__photo" src="${Utils.escapeHtml(p.photo)}" alt="${Utils.escapeHtml(p.name)}" loading="lazy">` : `<div class="profile-card__avatar" aria-hidden="true">${p.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>`}
        <h3 class="profile-card__name">${Utils.escapeHtml(p.name)}</h3>
        ${p.company ? `<p class="profile-card__company">${Utils.escapeHtml(p.company)}</p>` : ''}
        <span class="profile-card__role profile-card__role--${p.role}">${this.getRoleLabel(p.role)}</span>
        ${p.interests ? `<div class="profile-card__interests">${p.interests.map((i) => `<span class="interest-tag">${Utils.escapeHtml(i)}</span>`).join('')}</div>` : ''}
        <div class="profile-card__actions">
          <button class="btn btn--outline btn--sm" data-action="connect" data-id="${p.id}">Связаться</button>
        </div>
      </div>
    `
      )
      .join('');

    this.bindActions();
  }

  getRoleLabel(role) {
    const labels = { speaker: 'Спикер', sponsor: 'Спонсор', attendee: 'Участник' };
    return labels[role] || role;
  }

  bindFilters() {
    this.filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.filters.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.render();
      });
    });
  }

  bindActions() {
    this.grid?.querySelectorAll('[data-action="connect"]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        await this.connect(id);
      });
    });
  }

  async connect(profileId) {
    const result = await Utils.postData('/api/networking/connect', { targetId: profileId });
    if (result?.error) {
      Toast.show('Ошибка отправки запроса', 'error');
    } else {
      Toast.show('Запрос на связь отправлен!', 'success');
    }
  }
}

/* --- FAQ Component --- */
class FAQComponent {
  constructor() {
    this.items = Utils.$$('.faq-item');
    this.init();
  }

  init() {
    this.items.forEach((item) => {
      const question = item.querySelector('.faq-item__question');
      question?.addEventListener('click', () => this.toggle(item));
    });
  }

  toggle(item) {
    const isActive = item.classList.contains('active');
    const question = item.querySelector('.faq-item__question');
    const answer = item.querySelector('.faq-item__answer');

    if (isActive) {
      item.classList.remove('active');
      question?.setAttribute('aria-expanded', 'false');
      answer?.setAttribute('aria-hidden', 'true');
    } else {
      item.classList.add('active');
      question?.setAttribute('aria-expanded', 'true');
      answer?.setAttribute('aria-hidden', 'false');
    }
  }
}

/* --- Registration Form --- */
class RegistrationForm {
  constructor() {
    this.form = Utils.$('#registrationForm');
    this.init();
  }

  init() {
    this.form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(this.form);
      const data = Object.fromEntries(formData);

      if (!this.validate(data)) return;

      const submitBtn = this.form.querySelector('#regSubmit');
      submitBtn?.classList.add('btn--loading');
      submitBtn?.setAttribute('disabled', 'true');

      const result = await Utils.postData('/api/register', data);

      submitBtn?.classList.remove('btn--loading');
      submitBtn?.removeAttribute('disabled');

      if (result?.error) {
        Toast.show('Ошибка регистрации. Попробуйте ещё раз.', 'error');
      } else {
        Toast.show('Регистрация успешна! Проверьте почту.', 'success');
        this.form.reset();
        this.clearErrors();

        if (typeof gtag !== 'undefined') {
          gtag('event', 'sign_up', { method: 'Email' });
        }
      }
    });

    this.form?.querySelectorAll('.form-input, .form-select').forEach((input) => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('error')) this.validateField(input);
      });
    });
  }

  validate(data) {
    let valid = true;

    if (!data.name || data.name.trim().length < 2) {
      this.showError('regNameError', 'Введите имя (минимум 2 символа)');
      valid = false;
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      this.showError('regEmailError', 'Введите корректный email');
      valid = false;
    }

    if (!data.phone || data.phone.trim().length < 10) {
      this.showError('regPhoneError', 'Введите корректный телефон');
      valid = false;
    }

    if (!data.tier) {
      this.showError('regTicketError', 'Выберите билет');
      valid = false;
    }

    return valid;
  }

  validateField(input) {
    const name = input.name;
    const value = input.value;

    switch (name) {
      case 'name':
        if (!value || value.trim().length < 2) {
          this.showError('regNameError', 'Введите имя (минимум 2 символа)');
          input.classList.add('error');
        } else {
          this.clearError('regNameError');
          input.classList.remove('error');
        }
        break;
      case 'email':
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          this.showError('regEmailError', 'Введите корректный email');
          input.classList.add('error');
        } else {
          this.clearError('regEmailError');
          input.classList.remove('error');
        }
        break;
      case 'phone':
        if (!value || value.trim().length < 10) {
          this.showError('regPhoneError', 'Введите корректный телефон');
          input.classList.add('error');
        } else {
          this.clearError('regPhoneError');
          input.classList.remove('error');
        }
        break;
      case 'tier':
        if (!value) {
          this.showError('regTicketError', 'Выберите билет');
          input.classList.add('error');
        } else {
          this.clearError('regTicketError');
          input.classList.remove('error');
        }
        break;
    }
  }

  showError(id, message) {
    const el = Utils.$(`#${id}`);
    if (el) el.textContent = message;
  }

  clearError(id) {
    const el = Utils.$(`#${id}`);
    if (el) el.textContent = '';
  }

  clearErrors() {
    Utils.$$('.form-error').forEach((el) => (el.textContent = ''));
    Utils.$$('.form-input, .form-select').forEach((el) => el.classList.remove('error'));
  }
}

/* --- Toast Notification --- */
class Toast {
  static show(message, type = 'success', duration = 4000) {
    const container = Utils.$('#toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <strong>${type === 'success' ? 'Успешно' : 'Ошибка'}</strong>
      <p>${Utils.escapeHtml(message)}</p>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('active'));

    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

/* --- Back to Top --- */
class BackToTop {
  constructor() {
    this.btn = Utils.$('#backToTop');
    if (!this.btn) return;

    window.addEventListener(
      'scroll',
      Utils.throttle(() => {
        this.btn.classList.toggle('visible', window.scrollY > 600);
      }, 100)
    );

    this.btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/* --- Scroll Animations --- */
class ScrollAnimations {
  constructor() {
    this.elements = Utils.$$('.section-header, .speakers-grid, .talk-card, .ticket-card, .profile-card, .about__feature, .venue__detail, .faq-item');

    if (!this.elements.length) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in', 'visible');
            this.observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    this.elements.forEach((el) => {
      el.classList.add('animate-in');
      this.observer.observe(el);
    });
  }
}

/* --- Early Bird Timer --- */
class EarlyBirdTimer {
  constructor() {
    this.timerEl = Utils.$('#earlybirdTimer');
    if (!this.timerEl) return;

    this.endDate = new Date('2026-08-01T00:00:00+03:00');
    this.update();
    setInterval(() => this.update(), 1000);
  }

  update() {
    const now = new Date();
    const diff = this.endDate - now;

    if (diff <= 0) {
      this.timerEl.innerHTML = '<strong>Early Bird завершён</strong>';
      this.timerEl.style.background = 'var(--surface-hover)';
      this.timerEl.style.color = 'var(--text-muted)';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    this.timerEl.innerHTML = `Осталось: <strong>${days} дн. ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}</strong>`;
  }
}

/* --- Smooth Scroll for anchor links --- */
class SmoothScroll {
  constructor() {
    Utils.$$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#') return;

        const target = Utils.$(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }
}

/* --- Initialize Application --- */
document.addEventListener('DOMContentLoaded', () => {
  new Header();
  new Countdown();
  new HeroParticles();
  new StatsAnimation();
  new SpeakersComponent();
  new ScheduleComponent();
  new TicketPurchase();
  new NetworkingComponent();
  new FAQComponent();
  new RegistrationForm();
  new BackToTop();
  new ScrollAnimations();
  new EarlyBirdTimer();
  new SmoothScroll();
});
