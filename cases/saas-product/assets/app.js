/**
 * FlowBoard — SaaS Landing Page JavaScript
 */

(function () {
  'use strict';

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  function debounce(fn, delay) {
    let timer;
    return function () {
      const args = arguments;
      const context = this;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }

  function throttle(fn, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        fn.apply(context, args);
        inThrottle = true;
        setTimeout(function () {
          inThrottle = false;
        }, limit);
      }
    };
  }

  function validateEmail(email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  function sanitizeInput(input) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(input));
    return div.innerHTML;
  }

  function qs(selector, parent) {
    return (parent || document).querySelector(selector);
  }

  function qsa(selector, parent) {
    return Array.from((parent || document).querySelectorAll(selector));
  }

  // ============================================
  // HEADER — Scroll behavior
  // ============================================

  var header = qs('.header');
  var lastScrollY = 0;

  function handleHeaderScroll() {
    var scrollY = window.scrollY;
    if (scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScrollY = scrollY;
  }

  window.addEventListener('scroll', throttle(handleHeaderScroll, 100), { passive: true });

  // ============================================
  // MOBILE MENU
  // ============================================

  var mobileMenuToggle = qs('.mobile-menu-toggle');
  var mobileMenu = qs('.mobile-menu');
  var mobileMenuLinks = qsa('.mobile-nav-link');
  var focusableInMenu = [];

  function openMobileMenu() {
    mobileMenuToggle.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    focusableInMenu = qsa('a, button, [tabindex]', mobileMenu);
    if (focusableInMenu.length) {
      focusableInMenu[0].focus();
    }
  }

  function closeMobileMenu() {
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    mobileMenuToggle.focus();
  }

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function () {
      var isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  mobileMenuLinks.forEach(function (link) {
    link.addEventListener('click', closeMobileMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu.getAttribute('aria-hidden') === 'false') {
      closeMobileMenu();
    }
  });

  // Trap focus in mobile menu
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || mobileMenu.getAttribute('aria-hidden') === 'true') return;
    if (!focusableInMenu.length) return;

    var firstEl = focusableInMenu[0];
    var lastEl = focusableInMenu[focusableInMenu.length - 1];

    if (e.shiftKey && document.activeElement === firstEl) {
      e.preventDefault();
      lastEl.focus();
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault();
      firstEl.focus();
    }
  });

  // ============================================
  // SMOOTH SCROLL
  // ============================================

  qsa('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (href === '#') return;
      var target = qs(href);
      if (target) {
        e.preventDefault();
        var headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height'), 10) || 72;
        var top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top: top, behavior: 'smooth' });
        // Update focus for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });

  // ============================================
  // PRICING TOGGLE
  // ============================================

  var toggleBtns = qsa('.toggle-btn');
  var priceValues = qsa('.price-value');

  function updatePricing(period) {
    toggleBtns.forEach(function (btn) {
      var isActive = btn.dataset.period === period;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', isActive);
    });

    priceValues.forEach(function (el) {
      var monthly = el.dataset.monthly;
      var yearly = el.dataset.yearly;
      var value = period === 'yearly' ? yearly : monthly;
      el.textContent = value;
      el.setAttribute('aria-label', value + ' долларов в месяц');
    });

    // Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'pricing_toggle', { period: period });
    }
  }

  toggleBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      updatePricing(this.dataset.period);
    });
  });

  // Keyboard support for toggle
  qsa('.pricing-toggle').forEach(function (toggle) {
    toggle.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        var current = qs('.toggle-btn.active');
        var next = e.key === 'ArrowRight'
          ? current.nextElementSibling || toggleBtns[0]
          : current.previousElementSibling || toggleBtns[toggleBtns.length - 1];
        next.click();
        next.focus();
      }
    });
  });

  // ============================================
  // FAQ ACCORDION
  // ============================================

  qsa('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var answer = qs('.faq-answer', item);
      var isOpen = item.classList.contains('faq-item--open');

      // Close all other items
      qsa('.faq-item--open').forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove('faq-item--open');
          qs('.faq-answer', openItem).style.maxHeight = '0';
          qs('.faq-question', openItem).setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current
      if (isOpen) {
        item.classList.remove('faq-item--open');
        answer.style.maxHeight = '0';
        btn.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('faq-item--open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ============================================
  // SIGNUP FORM
  // ============================================

  var signupForm = qs('#signup-form');
  var successMessage = qs('#success-message');

  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot check
      var honeypot = qs('.honeypot', signupForm);
      if (honeypot && honeypot.value) {
        return false;
      }

      // Get values
      var name = sanitizeInput(qs('#signup-name').value.trim());
      var email = qs('#signup-email').value.trim();
      var company = sanitizeInput(qs('#signup-company').value.trim());
      var teamSize = qs('#signup-team-size').value;

      // Reset errors
      qsa('.form-error').forEach(function (el) {
        el.textContent = '';
      });
      qsa('.form-input, .form-select').forEach(function (el) {
        el.classList.remove('error');
      });

      // Validate
      var errors = [];

      if (!name) {
        errors.push({ field: '#signup-name', message: 'Введите имя' });
      }

      if (!email) {
        errors.push({ field: '#signup-email', message: 'Введите email' });
      } else if (!validateEmail(email)) {
        errors.push({ field: '#signup-email', message: 'Введите корректный email' });
      }

      if (!teamSize) {
        errors.push({ field: '#signup-team-size', message: 'Выберите размер команды' });
      }

      if (errors.length > 0) {
        errors.forEach(function (err) {
          var field = qs(err.field);
          var errorEl = qs('.form-error', field.closest('.form-group'));
          field.classList.add('error');
          if (errorEl) errorEl.textContent = err.message;
        });
        // Focus first error
        var firstErrorField = qs(errors[0].field);
        if (firstErrorField) firstErrorField.focus();
        return;
      }

      // Show loading
      var submitBtn = qs('#submit-btn');
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      // Simulate API call
      setTimeout(function () {
        signupForm.hidden = true;
        successMessage.hidden = false;
        successMessage.focus();

        // Analytics
        if (typeof gtag === 'function') {
          gtag('event', 'sign_up', { method: 'waitlist' });
        }
      }, 1500);
    });
  }

  // ============================================
  // DEMO MODAL
  // ============================================

  var demoBtn = qs('#demo-btn');
  var demoModal = qs('#demo-modal');
  var modalClose = qs('.modal-close');
  var modalBackdrop = qs('.modal-backdrop');

  function openModal() {
    if (!demoModal) return;
    demoModal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (modalClose) modalClose.focus();

    // Trap focus
    demoModal.addEventListener('keydown', trapModalFocus);
  }

  function closeModal() {
    if (!demoModal) return;
    demoModal.hidden = true;
    document.body.style.overflow = '';
    if (demoBtn) demoBtn.focus();

    demoModal.removeEventListener('keydown', trapModalFocus);
  }

  function trapModalFocus(e) {
    if (e.key !== 'Tab') {
      if (e.key === 'Escape') {
        closeModal();
      }
      return;
    }

    var focusable = qsa('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', demoModal);
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (demoBtn) demoBtn.addEventListener('click', openModal);
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

  // ============================================
  // SCROLL REVEAL
  // ============================================

  var revealElements = qsa(
    '.section-header, .problem-card, .feature-card, .step-card, .pricing-card, .case-card, .faq-item, .solution-feature'
  );

  revealElements.forEach(function (el) {
    el.classList.add('reveal');
  });

  function checkReveal() {
    var windowHeight = window.innerHeight;
    revealElements.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < windowHeight * 0.85) {
        el.classList.add('revealed');
      }
    });
  }

  window.addEventListener('scroll', throttle(checkReveal, 100), { passive: true });
  // Initial check
  checkReveal();

  // ============================================
  // COUNTER ANIMATION
  // ============================================

  function animateCounter(el, target, duration) {
    var start = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      var current = Math.floor(eased * target);
      el.textContent = current.toLocaleString('ru-RU');
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString('ru-RU');
      }
    }

    requestAnimationFrame(step);
  }

  var proofCount = qs('.proof-count');
  if (proofCount) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(proofCount, 2500, 2000);
          observer.disconnect();
        }
      });
    }, { threshold: 0.5 });
    observer.observe(proofCount);
  }

  // ============================================
  // ANALYTICS — Scroll tracking
  // ============================================

  var milestones = [25, 50, 75, 100];
  var tracked = new Set();

  window.addEventListener('scroll', throttle(function () {
    var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    var pct = Math.round((window.scrollY / scrollHeight) * 100);
    milestones.forEach(function (m) {
      if (pct >= m && !tracked.has(m)) {
        tracked.add(m);
        if (typeof gtag === 'function') {
          gtag('event', 'scroll', { percent_scrolled: m });
        }
      }
    });
  }, 200), { passive: true });

  // ============================================
  // CTA BUTTON TRACKING
  // ============================================

  qsa('.btn-primary, .btn-pricing--primary').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (typeof gtag === 'function') {
        gtag('event', 'cta_click', { text: this.textContent.trim() });
      }
    });
  });

  // ============================================
  // KEYBOARD NAVIGATION ENHANCEMENT
  // ============================================

  document.addEventListener('keydown', function (e) {
    // 'k' to open search (placeholder)
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      // Could open search modal here
    }
  });

  // ============================================
  // CONSOLE EASTER EGG
  // ============================================

  console.log(
    '%c FlowBoard ',
    'background: #6366F1; color: white; font-size: 20px; font-weight: bold; padding: 10px 20px; border-radius: 8px;'
  );
  console.log('%cУправляйте проектами в 10 раз быстрее', 'color: #A1A1AA; font-size: 14px;');

})();
