/* ============================================
   ДентаПро — JavaScript
   ============================================ */

'use strict';

/* ---------- Utility Functions ---------- */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function throttle(fn, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU').format(price);
}

/* ---------- Clinic Status ---------- */
function updateClinicStatus() {
  const statusDot = document.querySelector('.hero__status-dot');
  const statusText = document.querySelector('.hero__status-text');
  if (!statusDot || !statusText) return;

  const now = new Date();
  const hours = now.getHours();

  if (hours >= 8 && hours < 21) {
    statusDot.style.background = 'var(--success)';
    statusText.textContent = 'Открыты для записей';
  } else {
    statusDot.style.background = 'var(--danger)';
    statusText.textContent = 'Закрыто (откроется в 8:00)';
  }
}

/* ---------- Header Scroll ---------- */
function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;

  let lastScroll = 0;

  window.addEventListener(
    'scroll',
    throttle(() => {
      const currentScroll = window.pageYOffset;
      if (currentScroll > 100) {
        header.style.boxShadow = 'var(--shadow-md)';
      } else {
        header.style.boxShadow = 'none';
      }
      lastScroll = currentScroll;
    }, 100)
  );
}

/* ---------- Mobile Menu ---------- */
function initMobileMenu() {
  const burger = document.querySelector('.header__burger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-menu__link, .mobile-menu__cta');

  if (!burger || !mobileMenu) return;

  function toggleMenu() {
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', !isOpen);
    mobileMenu.setAttribute('aria-hidden', isOpen);
    document.body.style.overflow = isOpen ? '' : 'hidden';
  }

  burger.addEventListener('click', toggleMenu);

  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (mobileMenu.getAttribute('aria-hidden') === 'false') {
        toggleMenu();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.getAttribute('aria-hidden') === 'false') {
      toggleMenu();
      burger.focus();
    }
  });
}

/* ---------- Smooth Scroll ---------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerHeight = document.querySelector('.header')?.offsetHeight || 72;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 16;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });
}

/* ---------- Sticky CTA ---------- */
function initStickyCTA() {
  const stickyCTA = document.getElementById('sticky-cta');
  const hero = document.querySelector('.hero');
  if (!stickyCTA || !hero) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      stickyCTA.classList.toggle('is-visible', !entry.isIntersecting);
    },
    { threshold: 0.1 }
  );

  observer.observe(hero);
}

/* ---------- Booking Calendar ---------- */
class BookingCalendar {
  constructor(container, options = {}) {
    this.container = container;
    this.currentDate = new Date();
    this.selectedDate = null;
    this.selectedTime = null;
    this.availableSlots = [];
    this.timeContainer = document.getElementById('time-slots');

    this.options = {
      workingHours: { start: 9, end: 21 },
      slotDuration: 30,
      ...options,
    };

    this.monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
    ];

    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    this.container.innerHTML = `
      <div class="calendar" role="application" aria-label="Календарь записи">
        <div class="calendar__header">
          <button class="calendar__nav" data-action="prev" aria-label="Предыдущий месяц: ${this.monthNames[month === 0 ? 11 : month - 1]}">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h3 class="calendar__title" aria-live="polite">${this.monthNames[month]} ${year}</h3>
          <button class="calendar__nav" data-action="next" aria-label="Следующий месяц: ${this.monthNames[month === 11 ? 0 : month + 1]}">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="calendar__grid" role="grid">
          <div class="calendar__weekday" role="columnheader">Пн</div>
          <div class="calendar__weekday" role="columnheader">Вт</div>
          <div class="calendar__weekday" role="columnheader">Ср</div>
          <div class="calendar__weekday" role="columnheader">Чт</div>
          <div class="calendar__weekday" role="columnheader">Пт</div>
          <div class="calendar__weekday" role="columnheader">Сб</div>
          <div class="calendar__weekday" role="columnheader">Вс</div>
          ${this.renderDays(year, month)}
        </div>
      </div>
    `;
  }

  renderDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let html = '';

    for (let i = 0; i < startDay; i++) {
      html += '<div class="calendar__day calendar__day--empty" role="gridcell"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isPast = date < today;
      const isToday = date.getTime() === today.getTime();
      const isSelected = this.selectedDate && date.getTime() === this.selectedDate.getTime();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      let classes = 'calendar__day';
      if (isPast) classes += ' calendar__day--disabled';
      if (isToday) classes += ' calendar__day--today';
      if (isSelected) classes += ' calendar__day--selected';
      if (isWeekend) classes += ' calendar__day--weekend';

      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const ariaLabel = `${day} ${this.monthNames[month]}${isToday ? ' (сегодня)' : ''}${isPast ? ' (прошедшая дата)' : ''}`;

      html += `
        <button
          class="${classes}"
          data-date="${dateStr}"
          role="gridcell"
          ${isPast ? 'disabled aria-disabled="true"' : ''}
          aria-label="${ariaLabel}"
          aria-pressed="${isSelected}"
        >
          ${day}
        </button>
      `;
    }

    return html;
  }

  attachEventListeners() {
    this.container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (btn) {
        const action = btn.dataset.action;
        if (action === 'prev') {
          this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        }
        if (action === 'next') {
          this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        }
        this.render();
        this.attachEventListeners();
      }

      const dayBtn = e.target.closest('.calendar__day:not(.calendar__day--disabled):not(.calendar__day--empty)');
      if (dayBtn) {
        this.selectDate(dayBtn.dataset.date);
      }
    });

    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const dayBtn = e.target.closest('.calendar__day:not(.calendar__day--disabled):not(.calendar__day--empty)');
        if (dayBtn) {
          e.preventDefault();
          this.selectDate(dayBtn.dataset.date);
        }
      }
    });
  }

  selectDate(dateStr) {
    this.selectedDate = new Date(dateStr + 'T00:00:00');
    this.render();
    this.attachEventListeners();
    this.generateTimeSlots();
  }

  generateTimeSlots() {
    if (!this.timeContainer || !this.selectedDate) return;

    const { start, end } = this.options.workingHours;
    const duration = this.options.slotDuration;
    const slots = [];

    for (let hour = start; hour < end; hour++) {
      for (let min = 0; min < 60; min += duration) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        const isAvailable = Math.random() > 0.3;
        slots.push({ time: timeStr, available: isAvailable });
      }
    }

    this.availableSlots = slots;

    let html = '<div class="booking__time-slots-grid">';
    slots.forEach((slot) => {
      const isSelected = this.selectedTime === slot.time;
      let classes = 'time-slot';
      if (!slot.available) classes += ' time-slot--disabled';
      if (isSelected) classes += ' time-slot--selected';

      html += `
        <button
          class="${classes}"
          data-time="${slot.time}"
          ${!slot.available ? 'disabled aria-disabled="true"' : ''}
          aria-label="${slot.time}${slot.available ? '' : ' (недоступно)'}"
        >
          ${slot.time}
        </button>
      `;
    });
    html += '</div>';

    this.timeContainer.innerHTML = html;

    this.timeContainer.querySelectorAll('.time-slot:not(.time-slot--disabled)').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectTime(btn.dataset.time);
      });
    });
  }

  selectTime(time) {
    this.selectedTime = time;

    this.timeContainer.querySelectorAll('.time-slot').forEach((btn) => {
      btn.classList.toggle('time-slot--selected', btn.dataset.time === time);
      btn.setAttribute('aria-pressed', btn.dataset.time === time ? 'true' : 'false');
    });

    window.bookingWizard?.updateSummary();
  }

  getSelectedDateTime() {
    if (!this.selectedDate || !this.selectedTime) return null;

    const dateStr = this.selectedDate.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    return `${dateStr}, ${this.selectedTime}`;
  }
}

/* ---------- Phone Input Mask ---------- */
class PhoneInput {
  constructor(input) {
    this.input = input;
    this.init();
  }

  init() {
    this.input.addEventListener('input', this.format.bind(this));
    this.input.addEventListener('keydown', this.handleKeydown.bind(this));
    this.input.addEventListener('paste', this.handlePaste.bind(this));
  }

  format() {
    let value = this.input.value.replace(/\D/g, '');

    if (value.length > 0) {
      if (value[0] === '7' || value[0] === '8') {
        value = value.substring(1);
      }
    }

    let formatted = '+7';
    if (value.length > 0) formatted += ' (' + value.substring(0, 3);
    if (value.length >= 3) formatted += ') ';
    if (value.length > 3) formatted += value.substring(3, 6);
    if (value.length > 6) formatted += '-' + value.substring(6, 8);
    if (value.length > 8) formatted += '-' + value.substring(8, 10);

    this.input.value = formatted;
  }

  handleKeydown(e) {
    if (e.key === 'Backspace' && this.input.value.endsWith(' ')) {
      this.input.value = this.input.value.slice(0, -1);
    }

    if (e.key === 'Backspace' && this.input.value.endsWith(') ')) {
      this.input.value = this.input.value.slice(0, -2);
    }
  }

  handlePaste(e) {
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const digits = pasted.replace(/\D/g, '');
    if (digits.length >= 10) {
      e.preventDefault();
      this.input.value = '';
      this.input.value = pasted;
      this.format();
    }
  }

  isValid() {
    return /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(this.input.value);
  }

  getRaw() {
    return this.input.value.replace(/\D/g, '');
  }
}

/* ---------- Booking Wizard ---------- */
class BookingWizard {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.data = {
      service: null,
      price: 0,
      doctor: null,
      date: null,
      time: null,
      name: '',
      phone: '',
      comment: '',
    };

    this.calendar = null;
    this.phoneInput = null;

    this.init();
  }

  init() {
    this.initCalendar();
    this.initPhoneInput();
    this.initNavigation();
    this.initFormValidation();
    this.initServiceCTA();
    this.initDoctorCTA();
  }

  initCalendar() {
    const calendarContainer = document.getElementById('booking-calendar');
    if (calendarContainer) {
      this.calendar = new BookingCalendar(calendarContainer, {
        workingHours: { start: 9, end: 21 },
        slotDuration: 30,
      });
    }
  }

  initPhoneInput() {
    const phoneField = document.getElementById('booking-phone');
    if (phoneField) {
      this.phoneInput = new PhoneInput(phoneField);
    }
  }

  initNavigation() {
    document.querySelectorAll('.booking__next').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextStep = parseInt(btn.dataset.next);
        if (this.validateStep(this.currentStep)) {
          this.goToStep(nextStep);
        }
      });
    });

    document.querySelectorAll('.booking__prev').forEach((btn) => {
      btn.addEventListener('click', () => {
        const prevStep = parseInt(btn.dataset.prev);
        this.goToStep(prevStep);
      });
    });
  }

  goToStep(step) {
    if (step < 1 || step > this.totalSteps) return;

    document.querySelectorAll('.booking__step').forEach((el) => {
      el.classList.remove('booking__step--active');
    });

    const targetStep = document.querySelector(`.booking__step[data-step="${step}"]`);
    if (targetStep) {
      targetStep.classList.add('booking__step--active');
    }

    document.querySelectorAll('.booking__progress-step').forEach((el) => {
      const stepNum = parseInt(el.dataset.step);
      el.classList.remove('booking__progress-step--active', 'booking__progress-step--completed');
      if (stepNum === step) {
        el.classList.add('booking__progress-step--active');
      } else if (stepNum < step) {
        el.classList.add('booking__progress-step--completed');
      }
    });

    const progress = document.querySelector('.booking__progress');
    if (progress) {
      progress.setAttribute('aria-valuenow', step);
    }

    this.currentStep = step;
    this.updateSummary();

    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
      const headerHeight = document.querySelector('.header')?.offsetHeight || 72;
      const targetPosition = bookingSection.getBoundingClientRect().top + window.pageYOffset - headerHeight - 16;
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    }
  }

  validateStep(step) {
    switch (step) {
      case 1: {
        const selected = document.querySelector('input[name="service"]:checked');
        if (!selected) {
          this.showError('Пожалуйста, выберите услугу');
          return false;
        }
        this.data.service = selected.value;
        this.data.price = parseInt(selected.dataset.price) || 0;
        return true;
      }
      case 2: {
        const selected = document.querySelector('input[name="doctor"]:checked');
        if (!selected) {
          this.showError('Пожалуйста, выберите врача');
          return false;
        }
        this.data.doctor = selected.value;
        return true;
      }
      case 3: {
        if (!this.calendar?.selectedDate || !this.calendar?.selectedTime) {
          this.showError('Пожалуйста, выберите дату и время');
          return false;
        }
        this.data.date = this.calendar.selectedDate;
        this.data.time = this.calendar.selectedTime;
        return true;
      }
      default:
        return true;
    }
  }

  showError(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'assertive');
      toast.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        background: var(--danger);
        color: #fff;
        border-radius: var(--radius-md);
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
        box-shadow: var(--shadow-lg);
      `;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.display = 'block';

    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  }

  updateSummary() {
    const summaryService = document.getElementById('summary-service');
    const summaryDoctor = document.getElementById('summary-doctor');
    const summaryDatetime = document.getElementById('summary-datetime');
    const summaryPrice = document.getElementById('summary-price');

    if (summaryService) summaryService.textContent = this.data.service || '—';
    if (summaryDoctor) summaryDoctor.textContent = this.data.doctor || '—';

    if (summaryDatetime) {
      const dt = this.calendar?.getSelectedDateTime();
      summaryDatetime.textContent = dt || '—';
    }

    if (summaryPrice) {
      summaryPrice.textContent = this.data.price > 0
        ? `от ${formatPrice(this.data.price)} ₽`
        : 'Бесплатно';
    }
  }

  initFormValidation() {
    const form = document.getElementById('booking-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!this.validateForm()) return;

      const submitBtn = form.querySelector('.booking__submit');
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;

      try {
        const formData = new FormData(form);
        this.data.name = escapeHtml(formData.get('name')?.trim() || '');
        this.data.phone = formData.get('phone')?.trim() || '';
        this.data.comment = escapeHtml(formData.get('comment')?.trim() || '');

        const response = await this.submitBooking();

        if (response.success) {
          this.showSuccess(response);
        } else {
          this.showError(response.message || 'Произошла ошибка. Попробуйте ещё раз.');
        }
      } catch (error) {
        console.error('Booking error:', error);
        this.showError('Ошибка сети. Проверьте соединение и попробуйте ещё раз.');
      } finally {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
      }
    });

    const nameInput = document.getElementById('booking-name');
    const phoneInput = document.getElementById('booking-phone');

    if (nameInput) {
      nameInput.addEventListener('blur', () => {
        this.validateName(nameInput);
      });
    }

    if (phoneInput) {
      phoneInput.addEventListener('blur', () => {
        this.validatePhone(phoneInput);
      });
    }
  }

  validateForm() {
    const nameInput = document.getElementById('booking-name');
    const phoneInput = document.getElementById('booking-phone');
    const consentInput = document.querySelector('input[name="consent"]');

    let valid = true;

    if (!this.validateName(nameInput)) valid = false;
    if (!this.validatePhone(phoneInput)) valid = false;

    if (!consentInput?.checked) {
      this.showError('Необходимо согласие на обработку персональных данных');
      valid = false;
    }

    return valid;
  }

  validateName(input) {
    if (!input) return false;
    const errorEl = document.getElementById('booking-name-error');
    const value = input.value.trim();

    if (value.length < 2) {
      input.setAttribute('aria-invalid', 'true');
      if (errorEl) errorEl.textContent = 'Минимум 2 символа';
      return false;
    }

    input.setAttribute('aria-invalid', 'false');
    if (errorEl) errorEl.textContent = '';
    this.data.name = escapeHtml(value);
    return true;
  }

  validatePhone(input) {
    if (!input) return false;
    const errorEl = document.getElementById('booking-phone-error');

    if (!this.phoneInput?.isValid()) {
      input.setAttribute('aria-invalid', 'true');
      if (errorEl) errorEl.textContent = 'Введите корректный номер: +7 (XXX) XXX-XX-XX';
      return false;
    }

    input.setAttribute('aria-invalid', 'false');
    if (errorEl) errorEl.textContent = '';
    this.data.phone = input.value;
    return true;
  }

  async submitBooking() {
    const payload = {
      service: this.data.service,
      doctor: this.data.doctor,
      date: this.data.date?.toISOString().split('T')[0],
      time: this.data.time,
      name: this.data.name,
      phone: this.data.phone,
      comment: this.data.comment,
      price: this.data.price,
    };

    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return await response.json();
    } catch {
      return {
        success: true,
        bookingId: 'DEMO-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        message: 'Запись принята! Мы свяжемся с вами для подтверждения.',
      };
    }
  }

  showSuccess(response) {
    document.querySelectorAll('.booking__step').forEach((el) => {
      el.classList.remove('booking__step--active');
    });

    const successStep = document.querySelector('.booking__step[data-step="success"]');
    if (successStep) {
      successStep.classList.add('booking__step--active');
    }

    const successMessage = document.getElementById('success-message');
    const successCode = document.getElementById('success-code');

    if (successMessage) {
      successMessage.textContent = `Вы записаны к ${this.data.doctor} на ${this.data.time}. Стоимость: ${this.data.price > 0 ? 'от ' + formatPrice(this.data.price) + ' ₽' : 'бесплатно'}.`;
    }

    if (successCode) {
      successCode.textContent = response.bookingId || 'DEMO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    document.querySelectorAll('.booking__progress-step').forEach((el) => {
      el.classList.add('booking__progress-step--completed');
      el.classList.remove('booking__progress-step--active');
    });
  }

  initServiceCTA() {
    document.querySelectorAll('.service-card__cta[data-service]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const service = btn.dataset.service;
        const radio = document.querySelector(`input[name="service"][value="${service}"]`);
        if (radio) {
          radio.checked = true;
          this.data.service = service;
          this.data.price = parseInt(radio.dataset.price) || 0;
          this.goToStep(1);
          const bookingSection = document.getElementById('booking');
          if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }

  initDoctorCTA() {
    document.querySelectorAll('.doctor-card__cta[data-doctor]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const doctor = btn.dataset.doctor;
        const radio = document.querySelector(`input[name="doctor"][value="${doctor}"]`);
        if (radio) {
          radio.checked = true;
          this.data.doctor = doctor;
          this.goToStep(2);
          const bookingSection = document.getElementById('booking');
          if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }
}

/* ---------- Service Tabs ---------- */
function initServiceTabs() {
  const tabs = document.querySelectorAll('.services__tab');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('services__tab--active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('services__tab--active');
      tab.setAttribute('aria-selected', 'true');
    });
  });
}

/* ---------- Doctor Sort ---------- */
function initDoctorSort() {
  const sortBtns = document.querySelectorAll('.doctors__sort-btn');
  if (!sortBtns.length) return;

  sortBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      sortBtns.forEach((b) => b.classList.remove('doctors__sort-btn--active'));
      btn.classList.add('doctors__sort-btn--active');
    });
  });
}

/* ---------- Reviews Carousel ---------- */
function initReviewsCarousel() {
  const track = document.getElementById('reviews-track');
  const prevBtn = document.querySelector('.reviews__control--prev');
  const nextBtn = document.querySelector('.reviews__control--next');
  if (!track || !prevBtn || !nextBtn) return;

  let currentIndex = 0;
  const cards = track.querySelectorAll('.review-card');
  const totalCards = cards.length;

  function getVisibleCount() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1199) return 2;
    return 3;
  }

  function updateCarousel() {
    const visibleCount = getVisibleCount();
    const maxIndex = Math.max(0, totalCards - visibleCount);
    currentIndex = Math.min(currentIndex, maxIndex);

    const cardWidth = cards[0]?.offsetWidth || 0;
    const gap = 24;
    const offset = currentIndex * (cardWidth + gap);

    track.style.transform = `translateX(-${offset}px)`;

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= maxIndex;
  }

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
    }
  });

  nextBtn.addEventListener('click', () => {
    const visibleCount = getVisibleCount();
    if (currentIndex < totalCards - visibleCount) {
      currentIndex++;
      updateCarousel();
    }
  });

  window.addEventListener('resize', debounce(updateCarousel, 200));
  updateCarousel();

  let autoplayInterval = setInterval(() => {
    const visibleCount = getVisibleCount();
    if (currentIndex < totalCards - visibleCount) {
      currentIndex++;
    } else {
      currentIndex = 0;
    }
    updateCarousel();
  }, 5000);

  track.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
  track.addEventListener('mouseleave', () => {
    autoplayInterval = setInterval(() => {
      const visibleCount = getVisibleCount();
      if (currentIndex < totalCards - visibleCount) {
        currentIndex++;
      } else {
        currentIndex = 0;
      }
      updateCarousel();
    }, 5000);
  });
}

/* ---------- Reviews Tabs ---------- */
function initReviewsTabs() {
  const tabs = document.querySelectorAll('.reviews__tab');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('reviews__tab--active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('reviews__tab--active');
      tab.setAttribute('aria-selected', 'true');
    });
  });
}

/* ---------- Scroll Animations ---------- */
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('section').forEach((section) => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(24px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
  });
}

/* ---------- Lazy Load Images ---------- */
function initLazyLoad() {
  if ('loading' in HTMLImageElement.prototype) return;

  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  if (!lazyImages.length) return;

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        imageObserver.unobserve(img);
      }
    });
  });

  lazyImages.forEach((img) => imageObserver.observe(img));
}

/* ---------- Keyboard Navigation ---------- */
function initKeyboardNav() {
  document.querySelectorAll('.service-card, .doctor-card').forEach((card) => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const link = card.querySelector('a[href]');
        if (link) link.click();
      }
    });
  });
}

/* ---------- Initialize Everything ---------- */
document.addEventListener('DOMContentLoaded', () => {
  updateClinicStatus();
  setInterval(updateClinicStatus, 60000);

  initHeaderScroll();
  initMobileMenu();
  initSmoothScroll();
  initStickyCTA();
  initServiceTabs();
  initDoctorSort();
  initReviewsCarousel();
  initReviewsTabs();
  initScrollAnimations();
  initLazyLoad();
  initKeyboardNav();

  window.bookingWizard = new BookingWizard();
});
