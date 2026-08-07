document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
  initHeader();
  initMobileNav();
  initSmoothScroll();
  initScrollAnimations();
  initCounterAnimations();
  initParticles();

  const path = window.location.pathname;

  if (path === '/') {
    initHomePage();
  } else if (path === '/schedule') {
    initSchedulePage();
  } else if (path === '/trainers') {
    initTrainersPage();
  } else if (path === '/membership') {
    initMembershipPage();
  } else if (path === '/profile') {
    initProfilePage();
  } else if (path === '/login') {
    initLoginPage();
  } else if (path === '/register') {
    initRegisterPage();
  } else if (path === '/booking') {
    initBookingPage();
  }
});

function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  let lastScroll = 0;
  window.addEventListener('scroll', Utils.throttle(() => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  }, 100), { passive: true });
}

function initMobileNav() {
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  if (!burger || !nav) return;

  burger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('active');
    burger.classList.toggle('active');
    burger.setAttribute('aria-expanded', isOpen);
    document.body.classList.toggle('no-scroll', isOpen);
  });

  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('active');
      burger.classList.remove('active');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('no-scroll');
    });
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function initScrollAnimations() {
  Utils.observeElements('.animate-on-scroll, .feature-card, .trainer-card, .membership-card, .section-header', (el) => {
    el.classList.add('visible');
  });
}

function initCounterAnimations() {
  Utils.observeElements('.stat-value[data-count]', (el) => {
    const target = parseInt(el.dataset.count);
    if (!isNaN(target)) {
      Utils.animateCounter(el, target);
    }
  });
}

function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;

  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'hero-particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 15}s`;
    particle.style.animationDuration = `${10 + Math.random() * 10}s`;
    container.appendChild(particle);
  }
}

async function initHomePage() {
  try {
    const scheduleContainer = document.getElementById('scheduleQuick');
    if (scheduleContainer) {
      const data = await API.schedule.getAll();
      const today = new Date().getDay();
      const todaySchedule = data.schedule
        .filter(item => item.day_of_week === (today || 1))
        .slice(0, 4);

      if (todaySchedule.length > 0) {
        scheduleContainer.innerHTML = `<div class="schedule-list">${todaySchedule.map(Components.renderScheduleItem).join('')}</div>`;
        initBookingButtons(scheduleContainer);
      } else {
        scheduleContainer.innerHTML = Components.renderEmptyState('📅', 'Расписание загружается...');
      }
    }

    const trainersContainer = document.getElementById('trainersCarousel');
    if (trainersContainer) {
      const data = await API.trainers.getAll();
      const trainers = data.trainers.slice(0, 3);
      if (trainers.length > 0) {
        trainersContainer.innerHTML = `<div class="trainers-grid">${trainers.map(Components.renderTrainerCard).join('')}</div>`;
      } else {
        trainersContainer.innerHTML = Components.renderEmptyState('👥', 'Тренеры загружаются...');
      }
    }

    const membershipContainer = document.getElementById('membershipCards');
    if (membershipContainer) {
      const data = await API.membership.getPlans();
      if (data.plans.length > 0) {
        membershipContainer.innerHTML = `<div class="membership-grid">${data.plans.map(Components.renderMembershipCard).join('')}</div>`;
        initMembershipButtons(membershipContainer);
      }
    }
  } catch (error) {
    console.error('Home page load error:', error);
  }
}

async function initSchedulePage() {
  const scheduleList = document.getElementById('scheduleList');
  if (!scheduleList) return;

  let allSchedule = [];
  let currentDay = new Date().getDay() || 1;
  let selectedType = 'all';
  let selectedTrainer = 'all';

  try {
    const data = await API.schedule.getWeek();
    allSchedule = data.schedule;
    renderSchedule();
  } catch (error) {
    scheduleList.innerHTML = Components.renderEmptyState('❌', 'Ошибка загрузки расписания');
    return;
  }

  function renderSchedule() {
    const daySchedule = (allSchedule[currentDay] || [])
      .filter(item => {
        const typeMatch = selectedType === 'all' || item.training_type_slug === selectedType;
        const trainerMatch = selectedTrainer === 'all' || item.trainer_id === selectedTrainer;
        return typeMatch && trainerMatch;
      });

    if (daySchedule.length > 0) {
      scheduleList.innerHTML = daySchedule.map(Components.renderScheduleItem).join('');
    } else {
      scheduleList.innerHTML = Components.renderEmptyState('🏋️', 'Нет тренировок на этот день');
    }

    initBookingButtons(scheduleList);
  }

  document.querySelectorAll('.day-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentDay = parseInt(tab.dataset.day);
      renderSchedule();
    });
  });

  const typeFilter = document.getElementById('typeFilter');
  const trainerFilter = document.getElementById('trainerFilter');

  if (typeFilter) {
    typeFilter.addEventListener('change', (e) => {
      selectedType = e.target.value;
      renderSchedule();
    });
  }

  if (trainerFilter) {
    trainerFilter.addEventListener('change', (e) => {
      selectedTrainer = e.target.value;
      renderSchedule();
    });
  }

  const todayTab = document.querySelector(`.day-tab[data-day="${currentDay}"]`);
  if (todayTab) {
    todayTab.click();
  }
}

async function initTrainersPage() {
  const container = document.getElementById('trainersGrid');
  if (!container) return;

  try {
    const data = await API.trainers.getAll();
    if (data.trainers.length > 0) {
      container.innerHTML = data.trainers.map(Components.renderTrainerCard).join('');
    } else {
      container.innerHTML = Components.renderEmptyState('👥', 'Тренеры загружаются...');
    }
  } catch (error) {
    container.innerHTML = Components.renderEmptyState('❌', 'Ошибка загрузки тренеров');
  }
}

async function initMembershipPage() {
  const container = document.getElementById('membershipGrid');
  if (!container) return;

  try {
    const data = await API.membership.getPlans();
    if (data.plans.length > 0) {
      container.innerHTML = data.plans.map(Components.renderMembershipCard).join('');
      initMembershipButtons(container);
    } else {
      container.innerHTML = Components.renderEmptyState('💎', 'Абонементы загружаются...');
    }
  } catch (error) {
    container.innerHTML = Components.renderEmptyState('❌', 'Ошибка загрузки абонементов');
  }
}

async function initProfilePage() {
  const container = document.getElementById('profileContent');
  if (!container) return;

  try {
    const data = await API.profile.get();
    const { user, membership, stats } = data;

    container.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${user.name ? user.name[0] : '👤'}</div>
        <div class="profile-info">
          <h2>${Utils.escapeHtml(user.name || 'Пользователь')}</h2>
          <p>${Utils.formatPhone(user.phone || '')}</p>
        </div>
      </div>
      <div class="profile-grid">
        <div class="profile-card">
          <h3>Абонемент</h3>
          ${membership ? `
            <p><strong>${Utils.escapeHtml(membership.plan_name)}</strong></p>
            <p>Действует до: ${Utils.formatDate(membership.end_date)}</p>
            ${membership.remaining_trainings !== null ? `<p>Осталось тренировок: ${membership.remaining_trainings}</p>` : ''}
          ` : '<p>Нет активного абонемента</p>'}
          <a href="./membership" class="btn btn-secondary btn-sm" style="margin-top: 16px">Купить абонемент</a>
        </div>
        <div class="profile-card">
          <h3>Статистика (30 дней)</h3>
          <p>Записей: ${stats?.total_bookings || 0}</p>
          <p>Посещено: ${stats?.completed || 0}</p>
          <p>Прогулов: ${stats?.no_shows || 0}</p>
        </div>
        <div class="profile-card">
          <h3>Бонусы</h3>
          <p class="stat-value" style="color: var(--accent)">${user.bonus_points || 0}</p>
          <p>баллов</p>
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = Components.renderEmptyState('❌', 'Ошибка загрузки профиля');
  }
}

function initLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!Utils.validatePhone(phone)) {
      Components.showToast('Введите корректный номер телефона', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Входим...';

    try {
      await Auth.login(phone, password);
      Components.showToast('Добро пожаловать!', 'success');
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/profile';
      const safeRedirect = redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/profile';
      window.location.href = safeRedirect;
    } catch (error) {
      Components.showToast(error.message || 'Ошибка входа', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Войти';
    }
  });
}

function initRegisterPage() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!Utils.validatePhone(phone)) {
      Components.showToast('Введите корректный номер телефона', 'error');
      return;
    }

    if (email && !Utils.validateEmail(email)) {
      Components.showToast('Введите корректный email', 'error');
      return;
    }

    if (password.length < 6) {
      Components.showToast('Пароль минимум 6 символов', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Регистрируемся...';

    try {
      await Auth.register({ name, phone, email: email || undefined, password });
      Components.showToast('Регистрация успешна!', 'success');
      window.location.href = '/profile';
    } catch (error) {
      Components.showToast(error.message || 'Ошибка регистрации', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Зарегистрироваться';
    }
  });
}

async function initBookingPage() {
  const scheduleContainer = document.getElementById('bookingSchedule');
  if (!scheduleContainer) return;

  try {
    const data = await API.schedule.getAll();
    if (data.schedule.length > 0) {
      scheduleContainer.innerHTML = `<div class="schedule-list">${data.schedule.map(Components.renderScheduleItem).join('')}</div>`;
      initBookingButtons(scheduleContainer);
    } else {
      scheduleContainer.innerHTML = Components.renderEmptyState('🏋️', 'Нет доступных тренировок');
    }
  } catch (error) {
    scheduleContainer.innerHTML = Components.renderEmptyState('❌', 'Ошибка загрузки расписания');
  }
}

function initBookingButtons(container) {
  container.querySelectorAll('.btn-book:not(.btn-book--disabled)').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const scheduleId = e.target.dataset.id;
      const item = e.target.closest('.schedule-item');
      const title = item.querySelector('.schedule-title').textContent;
      const time = item.querySelector('.time-value').textContent;
      Components.showBookingModal(scheduleId, title, time);
    });
  });
}

function initMembershipButtons(container) {
  container.querySelectorAll('.btn-membership').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.dataset.plan;
      window.location.href = `/booking?plan=${plan}`;
    });
  });
}
