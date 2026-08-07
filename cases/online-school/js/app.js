/**
 * Online School — Main Application
 */

(function() {
  'use strict';

  // Auth token management
  const Auth = {
    getToken() {
      return localStorage.getItem('auth_token');
    },

    setToken(token) {
      localStorage.setItem('auth_token', token);
    },

    removeToken() {
      localStorage.removeItem('auth_token');
    },

    getUser() {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    },

    setUser(user) {
      localStorage.setItem('user', JSON.stringify(user));
    },

    removeUser() {
      localStorage.removeItem('user');
    },

    isLoggedIn() {
      return !!this.getToken();
    },

    logout() {
      this.removeToken();
      this.removeUser();
      window.location.href = '/';
    },

    getHeaders() {
      const token = this.getToken();
      return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
    }
  };

  // API helper
  const API = {
    async get(url) {
      const response = await fetch(url, {
        headers: Auth.getHeaders()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },

    async post(url, data) {
      const response = await fetch(url, {
        method: 'POST',
        headers: Auth.getHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Ошибка сервера' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      return response.json();
    }
  };

  // Debounce utility
  function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // Mobile menu
  function initMobileMenu() {
    const burger = document.getElementById('burgerBtn');
    const nav = document.querySelector('.header__nav');
    const actions = document.querySelector('.header__actions');

    if (!burger) return;

    burger.addEventListener('click', () => {
      const isActive = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', !isActive);
      if (nav) nav.classList.toggle('active');
      if (actions) actions.classList.toggle('active');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!burger.contains(e.target) && !nav?.contains(e.target) && !actions?.contains(e.target)) {
        burger.setAttribute('aria-expanded', 'false');
        nav?.classList.remove('active');
        actions?.classList.remove('active');
      }
    });
  }

  // Auth modal
  function initAuthModal() {
    const modal = document.getElementById('authModal');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const closeBtn = modal?.querySelector('.modal__close');
    const overlay = modal?.querySelector('.modal__overlay');
    const form = document.getElementById('authForm');
    const switchLink = document.getElementById('switchToRegister');

    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        if (Auth.isLoggedIn()) {
          window.location.href = '/dashboard';
        } else {
          modal?.classList.add('active');
          modal?.setAttribute('aria-hidden', 'false');
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => Auth.logout());
    }

    function closeModal() {
      modal?.classList.remove('active');
      modal?.setAttribute('aria-hidden', 'true');
    }

    closeBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal?.classList.contains('active')) {
        closeModal();
      }
    });

    async function handleAuthSubmit(e, isRegister) {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      try {
        const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
        const result = await API.post(endpoint, data);
        Auth.setToken(result.token);
        Auth.setUser(result.user);
        closeModal();
        updateAuthUI();
        window.location.reload();
      } catch (err) {
        alert(err.message || (isRegister ? 'Ошибка регистрации' : 'Ошибка входа'));
      }
    }

    form?.addEventListener('submit', (e) => handleAuthSubmit(e, false));

    switchLink?.addEventListener('click', (e) => {
      e.preventDefault();
      const title = document.getElementById('authModalTitle');
      const isLogin = title?.textContent === 'Вход';

      title.textContent = isLogin ? 'Регистрация' : 'Вход';
      form.innerHTML = isLogin ? `
        <div class="form-group">
          <label for="auth-name">Имя</label>
          <input type="text" id="auth-name" name="name" required autocomplete="name">
        </div>
        <div class="form-group">
          <label for="auth-email">Email</label>
          <input type="email" id="auth-email" name="email" required autocomplete="email">
        </div>
        <div class="form-group">
          <label for="auth-password">Пароль</label>
          <input type="password" id="auth-password" name="password" required autocomplete="new-password" minlength="8">
        </div>
        <button type="submit" class="btn btn--accent btn--full">Зарегистрироваться</button>
        <p class="modal__switch">Уже есть аккаунт? <a href="#" id="switchToLogin">Войти</a></p>
      ` : `
        <div class="form-group">
          <label for="auth-email">Email</label>
          <input type="email" id="auth-email" name="email" required autocomplete="email">
        </div>
        <div class="form-group">
          <label for="auth-password">Пароль</label>
          <input type="password" id="auth-password" name="password" required autocomplete="current-password">
        </div>
        <button type="submit" class="btn btn--accent btn--full">Войти</button>
        <p class="modal__switch">Нет аккаунта? <a href="#" id="switchToRegister">Зарегистрироваться</a></p>
      `;

      const newSwitchLink = document.getElementById(isLogin ? 'switchToLogin' : 'switchToRegister');
      newSwitchLink?.addEventListener('click', (ev) => {
        ev.preventDefault();
        switchLink?.click();
      });
    });
  }

  function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (Auth.isLoggedIn()) {
      const user = Auth.getUser();
      if (loginBtn) {
        loginBtn.textContent = user?.name || 'Кабинет';
        loginBtn.onclick = () => { window.location.href = '/dashboard'; };
      }
      if (logoutBtn) {
        logoutBtn.style.display = 'inline-flex';
      }
    } else {
      if (logoutBtn) {
        logoutBtn.style.display = 'none';
      }
    }
  }

  // Course catalog (for index page)
  function initCourseCatalog() {
    const grid = document.getElementById('coursesGrid');
    const loading = document.getElementById('coursesLoading');
    const filters = document.querySelectorAll('.filter-btn');

    if (!grid) return;

    let courses = [];
    let currentFilter = 'all';

    async function loadCourses() {
      try {
        loading?.removeAttribute('hidden');
        courses = await API.get('/api/courses');
        renderCourses();
      } catch (err) {
        console.error('Failed to load courses:', err);
        grid.innerHTML = '<p style="text-align:center;color:var(--text-secondary);grid-column:1/-1;">Ошибка загрузки курсов</p>';
      } finally {
        loading?.setAttribute('hidden', '');
      }
    }

    function renderCourses() {
      const filtered = currentFilter === 'all'
        ? courses
        : courses.filter(c => c.category === currentFilter);

      if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:var(--text-secondary);grid-column:1/-1;">Курсы не найдены</p>';
        return;
      }

      const categoryLabels = {
        dev: 'Программирование',
        design: 'Дизайн',
        marketing: 'Маркетинг'
      };

      grid.innerHTML = filtered.map(course => `
        <article class="course-card" role="listitem" aria-label="Курс: ${escapeHtml(course.title)}">
          <div class="course-card__image-wrapper">
            <img class="course-card__image" src="${escapeHtml(course.image || '/img/courses/default.jpg')}" alt="Обложка курса ${escapeHtml(course.title)}" loading="lazy">
            ${course.students > 500 ? '<span class="course-card__badge course-card__badge--hot">Хит продаж</span>' : ''}
            <div class="course-card__overlay">
              <a href="./course/${escapeHtml(course.slug)}" class="course-card__preview" aria-label="Подробнее о курсе ${escapeHtml(course.title)}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
                </svg>
              </a>
            </div>
          </div>
          <div class="course-card__content">
            <div class="course-card__meta">
              <span class="course-card__category">${categoryLabels[course.category] || course.category}</span>
              <span class="course-card__level">${course.level}</span>
            </div>
            <h3 class="course-card__title">${escapeHtml(course.title)}</h3>
            <p class="course-card__description">${escapeHtml(course.short_description || course.description || '')}</p>
            <div class="course-card__stats">
              <span class="stat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                ${escapeHtml(course.duration || '')}
              </span>
              <span class="stat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                ${course.students} студентов
              </span>
              <span class="stat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ${course.rating}
              </span>
            </div>
            <div class="course-card__footer">
              <div class="course-card__price">
                <span class="price-current">${formatPrice(course.price_basic)} ₽</span>
              </div>
              <a href="./course/${escapeHtml(course.slug)}" class="btn btn--accent btn--sm">Подробнее</a>
            </div>
          </div>
        </article>
      `).join('');
    }

    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        filters.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        currentFilter = btn.dataset.cat;
        renderCourses();
      });
    });

    loadCourses();
  }

  // Webinar registration
  function initWebinar() {
    const form = document.getElementById('webinarForm');
    const countdown = document.getElementById('webinarCountdown');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
          const result = await API.post('/api/webinar/register', data);
          if (result.success) {
            form.innerHTML = `
              <div style="text-align:center;padding:24px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <h3 style="margin:16px 0 8px;">Вы записаны!</h3>
                <p style="color:var(--text-secondary);">Письмо с ссылкой отправлено на ${escapeHtml(data.email)}</p>
              </div>
            `;
            // Update count
            const countEl = document.getElementById('webinarCount');
            if (countEl && result.totalRegistered) {
              countEl.textContent = result.totalRegistered;
            }
          }
        } catch (err) {
          alert(err.message || 'Ошибка регистрации');
        }
      });
    }

    if (countdown) {
      startCountdown();
    }
  }

  function startCountdown() {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 14);
    targetDate.setHours(19, 0, 0, 0);

    function update() {
      const now = new Date();
      const diff = targetDate - now;
      if (diff <= 0) return;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      const pad = (n) => String(n).padStart(2, '0');

      const daysEl = document.getElementById('countDays');
      const hoursEl = document.getElementById('countHours');
      const minsEl = document.getElementById('countMins');
      const secsEl = document.getElementById('countSecs');

      if (daysEl) daysEl.textContent = days;
      if (hoursEl) hoursEl.textContent = pad(hours);
      if (minsEl) minsEl.textContent = pad(mins);
      if (secsEl) secsEl.textContent = pad(secs);
    }

    update();
    setInterval(update, 1000);
  }

  // Intersection Observer for animations
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.problem-card, .solution-card, .pricing-card, .testimonial-card').forEach(el => {
      el.style.opacity = '0';
      observer.observe(el);
    });
  }

  // Utility functions
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatPrice(price) {
    if (!price) return '0';
    return new Intl.NumberFormat('ru-RU').format(price);
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initAuthModal();
    initWebinar();
    updateAuthUI();
    initScrollAnimations();
  });

  // Export for other modules
  window.OnlineSchool = { Auth, API, debounce, escapeHtml, formatPrice };

})();
