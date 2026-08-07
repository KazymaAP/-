/* ============================================
   ЮРИСТ-КОНСУЛЬТАНТ — ГЛАВНЫЙ СКРИПТ
   ============================================ */

'use strict';

(function () {
  /* ========================================
     Config
     ======================================== */
  const CONFIG = {
    RATE_LIMIT_MAX: 3,
    RATE_LIMIT_WINDOW_MS: 60000,
    SCROLL_THRESHOLD: 100,
    ANIMATION_DELAY: 100,
    FAQ_DEBOUNCE_MS: 300,
    TELEGRAM_BOT_TOKEN: '', // Set via environment or config
    TELEGRAM_CHAT_ID: '',   // Set via environment or config
  };

  /* ========================================
     State
     ======================================== */
  const state = {
    rateLimitAttempts: new Map(),
    scrollMilestones: new Set(),
    animatedElements: new Set(),
  };

  /* ========================================
     Utilities
     ======================================== */
  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function sanitizeInput(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 11 && (cleaned[0] === '7' || cleaned[0] === '8');
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function formatPrice(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  }

  /* ========================================
     Rate Limiting (client-side)
     ======================================== */
  function checkRateLimit(key) {
    const now = Date.now();
    const attempts = state.rateLimitAttempts.get(key) || [];
    const validAttempts = attempts.filter(function (t) { return now - t < CONFIG.RATE_LIMIT_WINDOW_MS; });

    if (validAttempts.length >= CONFIG.RATE_LIMIT_MAX) {
      return false;
    }

    validAttempts.push(now);
    state.rateLimitAttempts.set(key, validAttempts);
    return true;
  }

  /* ========================================
     Scroll Header
     ======================================== */
  function initScrollHeader() {
    var header = document.querySelector('.header');
    if (!header) return;

    var onScroll = debounce(function () {
      if (window.pageYOffset > CONFIG.SCROLL_THRESHOLD) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }
    }, 10);

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ========================================
     Smooth Scroll
     ======================================== */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        if (href === '#') return;

        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          var headerHeight = document.querySelector('.header').offsetHeight || 72;
          var targetPos = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: targetPos,
            behavior: 'smooth',
          });

          // Close mobile menu if open
          closeMobileMenu();

          // Update URL without scroll
          if (history.pushState) {
            history.pushState(null, null, href);
          }
        }
      });
    });
  }

  /* ========================================
     Mobile Menu
     ======================================== */
  function initMobileMenu() {
    var toggle = document.querySelector('.mobile-menu-toggle');
    var menu = document.querySelector('.mobile-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    // Close on escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        closeMobileMenu();
        toggle.focus();
      }
    });

    // Close on resize to desktop
    window.addEventListener('resize', debounce(function () {
      if (window.innerWidth > 768) {
        closeMobileMenu();
      }
    }, 200));
  }

  function openMobileMenu() {
    var toggle = document.querySelector('.mobile-menu-toggle');
    var menu = document.querySelector('.mobile-menu');
    toggle.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus first link
    var firstLink = menu.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function closeMobileMenu() {
    var toggle = document.querySelector('.mobile-menu-toggle');
    var menu = document.querySelector('.mobile-menu');
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* ========================================
     Hero Animations
     ======================================== */
  function initHeroAnimations() {
    var elements = document.querySelectorAll('.hero .animate-ready');
    if (!elements.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var delay = Array.from(elements).indexOf(entry.target) * CONFIG.ANIMATION_DELAY;
            setTimeout(function () {
              entry.target.classList.add('animate-in');
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ========================================
     Service/Case Card Animations
     ======================================== */
  function initCardAnimations() {
    var cards = document.querySelectorAll('.service-card, .case-card, .review-card');
    if (!cards.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('card-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    cards.forEach(function (card) {
      card.classList.add('card-animate');
      observer.observe(card);
    });
  }

  /* ========================================
     Tab Filtering
     ======================================== */
  function initTabFiltering() {
    // Services tabs
    var servicesTabBtns = document.querySelectorAll('.services .tab-btn');
    var serviceCards = document.querySelectorAll('.service-card');

    servicesTabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        servicesTabBtns.forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        var filter = btn.dataset.tab;
        serviceCards.forEach(function (card) {
          if (filter === 'all' || card.dataset.category === filter) {
            card.style.display = 'flex';
            card.style.animation = 'fadeIn 0.3s ease';
          } else {
            card.style.display = 'none';
          }
        });
      });

      // Keyboard support for tabs
      btn.addEventListener('keydown', function (e) {
        var tabList = btn.closest('[role="tablist"]');
        var tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
        var index = tabs.indexOf(btn);

        if (e.key === 'ArrowRight') {
          e.preventDefault();
          var next = tabs[(index + 1) % tabs.length];
          next.focus();
          next.click();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          var prev = tabs[(index - 1 + tabs.length) % tabs.length];
          prev.focus();
          prev.click();
        }
      });
    });

    // Cases tabs
    var casesTabBtns = document.querySelectorAll('.cases .tab-btn');
    var caseCards = document.querySelectorAll('.case-card');

    casesTabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        casesTabBtns.forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        var filter = btn.dataset.tab;
        caseCards.forEach(function (card) {
          if (filter === 'all' || card.dataset.category === filter) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.3s ease';
          } else {
            card.style.display = 'none';
          }
        });
      });

      btn.addEventListener('keydown', function (e) {
        var tabList = btn.closest('[role="tablist"]');
        var tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
        var index = tabs.indexOf(btn);

        if (e.key === 'ArrowRight') {
          e.preventDefault();
          var next = tabs[(index + 1) % tabs.length];
          next.focus();
          next.click();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          var prev = tabs[(index - 1 + tabs.length) % tabs.length];
          prev.focus();
          prev.click();
        }
      });
    });
  }

  /* ========================================
     FAQ Accordion
     ======================================== */
  function initFAQ() {
    var faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(function (item) {
      var question = item.querySelector('.faq-question');
      var answer = item.querySelector('.faq-answer');

      question.addEventListener('click', function () {
        var isActive = item.classList.contains('active');

        // Close all other items
        faqItems.forEach(function (otherItem) {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            otherItem.querySelector('.faq-answer').setAttribute('aria-hidden', 'true');
          }
        });

        // Toggle current
        item.classList.toggle('active');
        question.setAttribute('aria-expanded', String(!isActive));
        answer.setAttribute('aria-hidden', String(isActive));
      });

      // Keyboard support
      question.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          question.click();
        }
      });
    });
  }

  /* ========================================
     Phone Mask
     ======================================== */
  function initPhoneMask() {
    var phoneInput = document.getElementById('phone');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', function (e) {
      var value = e.target.value.replace(/\D/g, '');
      if (value.length > 0) {
        if (value[0] === '7' || value[0] === '8') {
          value = value.substring(1);
        }
        var formatted = '+7';
        if (value.length > 0) formatted += ' (' + value.substring(0, 3);
        if (value.length >= 3) formatted += ') ' + value.substring(3, 6);
        if (value.length >= 6) formatted += '-' + value.substring(6, 8);
        if (value.length >= 8) formatted += '-' + value.substring(8, 10);
        e.target.value = formatted;
      }
    });

    // Format on paste
    phoneInput.addEventListener('paste', function (e) {
      setTimeout(function () {
        phoneInput.dispatchEvent(new Event('input'));
      }, 0);
    });
  }

  /* ========================================
     Form Validation
     ======================================== */
  function validateFormField(input) {
    var value = input.value.trim();
    var errorEl = input.parentElement.querySelector('.error-message');
    var isValid = true;
    var message = '';

    if (input.required && !value) {
      isValid = false;
      message = 'Обязательное поле';
    } else if (input.id === 'name' && value.length < 2) {
      isValid = false;
      message = 'Минимум 2 символа';
    } else if (input.id === 'name' && value.length > 100) {
      isValid = false;
      message = 'Максимум 100 символов';
    } else if (input.id === 'phone' && !validatePhone(value)) {
      isValid = false;
      message = 'Введите корректный номер телефона';
    } else if (input.id === 'situation' && value.length < 10) {
      isValid = false;
      message = 'Опишите ситуацию подробнее (минимум 10 символов)';
    } else if (input.id === 'situation' && value.length > 2000) {
      isValid = false;
      message = 'Максимум 2000 символов';
    }

    input.setAttribute('aria-invalid', String(!isValid));
    if (errorEl) {
      errorEl.textContent = message;
    }

    return isValid;
  }

  function initFormValidation() {
    var inputs = document.querySelectorAll('#consultationForm input, #consultationForm textarea');
    inputs.forEach(function (input) {
      input.addEventListener('blur', function () {
        validateFormField(input);
      });

      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') {
          validateFormField(input);
        }
      });
    });
  }

  /* ========================================
     Form Submission
     ======================================== */
  function initFormSubmission() {
    var form = document.getElementById('consultationForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Rate limit check
      if (!checkRateLimit('consultation')) {
        alert('Слишком много запросов. Попробуйте через минуту.');
        return;
      }

      // Validate all fields
      var nameInput = form.querySelector('#name');
      var phoneInput = form.querySelector('#phone');
      var situationInput = form.querySelector('#situation');
      var consentInput = form.querySelector('#consent');

      var isNameValid = validateFormField(nameInput);
      var isPhoneValid = validateFormField(phoneInput);
      var isSituationValid = validateFormField(situationInput);

      if (!consentInput.checked) {
        alert('Необходимо согласие на обработку персональных данных');
        return;
      }

      if (!isNameValid || !isPhoneValid || !isSituationValid) {
        // Focus first invalid field
        if (!isNameValid) nameInput.focus();
        else if (!isPhoneValid) phoneInput.focus();
        else if (!isSituationValid) situationInput.focus();
        return;
      }

      var submitBtn = form.querySelector('.form-submit');
      var btnText = form.querySelector('.btn-text');
      var btnLoading = form.querySelector('.btn-loading');
      var formSuccess = form.querySelector('.form-success');
      var formError = form.querySelector('.form-error');

      // Show loading
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline-flex';
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
      if (formError) formError.style.display = 'none';

      var csrfToken = document.cookie.match(/csrf_token=([^;]+)/);
      var data = {
        name: sanitizeInput(nameInput.value.trim()),
        phone: phoneInput.value.trim(),
        situation: sanitizeInput(situationInput.value.trim()),
        timestamp: new Date().toISOString(),
      };

      try {
        var response = await fetch('/api/consultation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken ? csrfToken[1] : '',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Server error: ' + response.status);
        }

        // Success
        form.style.display = 'none';
        formSuccess.style.display = 'flex';

        // Track conversion
        if (typeof gtag === 'function') {
          gtag('event', 'generate_lead', {
            currency: 'RUB',
            value: 0,
          });
        }

        if (typeof ym === 'function') {
          ym(window.YANDEX_COUNTER_ID, 'reachGoal', 'consultation_submit');
        }

        // Send to Telegram as fallback
        sendToTelegram(data);

      } catch (error) {
        console.error('Form submission error:', error);
        if (formError) {
          formError.style.display = 'flex';
        }
      } finally {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.setAttribute('aria-busy', 'false');
      }
    });
  }

  /* ========================================
     Telegram Notification
     ======================================== */
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function sendToTelegram(data) {
    if (!CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) {
      console.warn('Telegram config not set, skipping notification');
      return;
    }

    var text = [
      '🆕 Новая заявка на консультацию',
      '',
      '👤 Имя: ' + escapeHtml(data.name),
      '📞 Телефон: ' + escapeHtml(data.phone),
      '📝 Ситуация: ' + escapeHtml(data.situation),
      '⏰ Время: ' + escapeHtml(data.timestamp),
    ].join('\n');

    fetch('https://api.telegram.org/bot' + CONFIG.TELEGRAM_BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CONFIG.TELEGRAM_CHAT_ID,
        text: text,
      }),
    }).catch(function (err) {
      console.error('Telegram notification failed:', err);
    });
  }

  /* ========================================
     Scroll Tracking (Analytics)
     ======================================== */
  function initScrollTracking() {
    var milestones = [25, 50, 75, 100];

    window.addEventListener('scroll', debounce(function () {
      var scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      milestones.forEach(function (milestone) {
        if (scrollPercent >= milestone && !state.scrollMilestones.has(milestone)) {
          state.scrollMilestones.add(milestone);
          if (typeof gtag === 'function') {
            gtag('event', 'scroll', {
              percent_scrolled: milestone,
            });
          }
        }
      });
    }, 200), { passive: true });
  }

  /* ========================================
     Active Nav Link
     ======================================== */
  function initActiveNav() {
    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.nav-link');

    var onScroll = debounce(function () {
      var scrollPos = window.pageYOffset + 150;

      sections.forEach(function (section) {
        var top = section.offsetTop;
        var height = section.offsetHeight;
        var id = section.getAttribute('id');

        if (scrollPos >= top && scrollPos < top + height) {
          navLinks.forEach(function (link) {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + id) {
              link.classList.add('active');
            }
          });
        }
      });
    }, 100);

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ========================================
     Cookie Banner
     ======================================== */
  function initCookieBanner() {
    var banner = document.getElementById('cookieBanner');
    var acceptBtn = document.getElementById('cookieAccept');
    var rejectBtn = document.getElementById('cookieReject');

    if (!banner) return;

    // Check if already accepted
    if (localStorage.getItem('cookieConsent')) {
      banner.style.display = 'none';
      return;
    }

    // Show after 2 seconds
    setTimeout(function () {
      banner.style.display = 'block';
    }, 2000);

    if (acceptBtn) {
      acceptBtn.addEventListener('click', function () {
        localStorage.setItem('cookieConsent', 'accepted');
        banner.style.display = 'none';
      });
    }

    if (rejectBtn) {
      rejectBtn.addEventListener('click', function () {
        localStorage.setItem('cookieConsent', 'rejected');
        banner.style.display = 'none';
      });
    }
  }

  /* ========================================
     Footer Year
     ======================================== */
  function initFooterYear() {
    var yearEl = document.getElementById('currentYear');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  /* ========================================
     Back to Top
     ======================================== */
  function initBackToTop() {
    // Create button
    var btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Вернуться наверх');
    btn.textContent = '\u2191';
    btn.style.cssText = [
      'position: fixed',
      'bottom: 80px',
      'right: 24px',
      'width: 48px',
      'height: 48px',
      'border-radius: 50%',
      'background: var(--accent)',
      'color: white',
      'border: none',
      'font-size: 20px',
      'cursor: pointer',
      'opacity: 0',
      'visibility: hidden',
      'transition: all 0.3s ease',
      'z-index: 900',
      'box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3)',
    ].join(';');

    document.body.appendChild(btn);

    window.addEventListener('scroll', debounce(function () {
      if (window.pageYOffset > 500) {
        btn.style.opacity = '1';
        btn.style.visibility = 'visible';
      } else {
        btn.style.opacity = '0';
        btn.style.visibility = 'hidden';
      }
    }, 100), { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ========================================
     Service Button Click Tracking
     ======================================== */
  function initServiceTracking() {
    document.querySelectorAll('.service-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var card = e.target.closest('.service-card');
        if (!card) return;

        var serviceTitle = card.querySelector('.service-title');
        if (serviceTitle && typeof gtag === 'function') {
          gtag('event', 'select_content', {
            content_type: 'service',
            items: [{ item_name: serviceTitle.textContent }],
          });
        }
      });
    });
  }

  /* ========================================
     Init
     ======================================== */
  function init() {
    initScrollHeader();
    initSmoothScroll();
    initMobileMenu();
    initHeroAnimations();
    initCardAnimations();
    initTabFiltering();
    initFAQ();
    initPhoneMask();
    initFormValidation();
    initFormSubmission();
    initScrollTracking();
    initActiveNav();
    initCookieBanner();
    initFooterYear();
    initBackToTop();
    initServiceTracking();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();