/* ============================================
   Real Estate Agency — Main Script
   ============================================ */

(function () {
  'use strict';

  const CONFIG = {
    SCROLL_THRESHOLD: 100,
  };

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function initScrollHeader() {
    const header = document.querySelector('header');
    if (!header) return;

    const onScroll = debounce(function () {
      if (window.pageYOffset > CONFIG.SCROLL_THRESHOLD) {
        header.style.background = 'rgba(13, 15, 20, 0.95)';
        header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
      } else {
        header.style.background = '';
        header.style.boxShadow = '';
      }
    }, 10);

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const headerHeight = document.querySelector('header').offsetHeight || 72;
          const targetPos = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: targetPos,
            behavior: 'smooth',
          });

          if (history.pushState) {
            history.pushState(null, null, href);
          }
        }
      });
    });
  }

  function initSearchForm() {
    const form = document.querySelector('.search-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const type = form.querySelector('select:nth-of-type(1)').value;
      const rooms = form.querySelector('select:nth-of-type(2)').value;
      const location = form.querySelector('input[type="text"]').value;

      console.log('Search:', { type, rooms, location });
      alert('Поиск: ' + type + ', ' + rooms + ', ' + (location || 'любой район'));
    });
  }

  function initCardAnimations() {
    const cards = document.querySelectorAll('.card');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );

      cards.forEach(function (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
      });
    }
  }

  function initFooterYear() {
    const yearEl = document.getElementById('currentYear');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  function init() {
    initScrollHeader();
    initSmoothScroll();
    initSearchForm();
    initCardAnimations();
    initFooterYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();