/**
 * Course Catalog Module
 * Handles courses listing with filters and search
 */

(function() {
  'use strict';

  class CourseCatalog {
    constructor() {
      this.courses = [];
      this.currentFilter = 'all';
      this.searchQuery = '';
      this.grid = document.getElementById('coursesGrid');
      this.loading = document.getElementById('coursesLoading');
      this.empty = document.getElementById('coursesEmpty');
      this.searchInput = document.getElementById('courseSearch');
      this.filterBtns = document.querySelectorAll('.filter-btn');
    }

    async init() {
      await this.loadCourses();
      this.bindEvents();
      this.render();
    }

    async loadCourses() {
      try {
        this.showLoading(true);
        const response = await fetch('/api/courses');
        if (!response.ok) throw new Error('Ошибка загрузки');
        this.courses = await response.json();
      } catch (err) {
        console.error('Failed to load courses:', err);
        this.showError();
      } finally {
        this.showLoading(false);
      }
    }

    bindEvents() {
      // Filter buttons
      this.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.filterBtns.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          this.currentFilter = btn.dataset.cat;
          this.render();
        });
      });

      // Search input with debounce
      if (this.searchInput) {
        this.searchInput.addEventListener('input', this.debounce((e) => {
          this.searchQuery = e.target.value.trim().toLowerCase();
          this.render();
        }, 300));
      }
    }

    getFilteredCourses() {
      let result = this.courses;

      // Apply category filter
      if (this.currentFilter !== 'all') {
        result = result.filter(c => c.category === this.currentFilter);
      }

      // Apply search filter
      if (this.searchQuery) {
        result = result.filter(c =>
          c.title.toLowerCase().includes(this.searchQuery) ||
          (c.short_description && c.short_description.toLowerCase().includes(this.searchQuery)) ||
          (c.description && c.description.toLowerCase().includes(this.searchQuery))
        );
      }

      return result;
    }

    render() {
      const courses = this.getFilteredCourses();

      if (!this.grid) return;

      if (courses.length === 0) {
        this.grid.innerHTML = '';
        this.empty?.removeAttribute('hidden');
        return;
      }

      this.empty?.setAttribute('hidden', '');

      const categoryLabels = {
        dev: 'Программирование',
        design: 'Дизайн',
        marketing: 'Маркетинг'
      };

      this.grid.innerHTML = courses.map(course => this.renderCourseCard(course, categoryLabels)).join('');

      // Animate cards
      this.animateCards();
    }

    renderCourseCard(course, labels) {
      const badge = course.students > 500
        ? '<span class="course-card__badge course-card__badge--hot">Хит продаж</span>'
        : course.students < 100
        ? '<span class="course-card__badge course-card__badge--new">Новый</span>'
        : '';

      const pricePro = course.price_pro ? `<span class="price-old">${this.formatPrice(course.price_pro)} ₽</span>` : '';

      return `
        <article class="course-card" role="listitem" aria-label="Курс: ${this.escapeHtml(course.title)}">
          <div class="course-card__image-wrapper">
            <img class="course-card__image"
                 src="${this.escapeHtml(course.image || '/img/courses/default.jpg')}"
                 alt="Обложка курса ${this.escapeHtml(course.title)}"
                 loading="lazy">
            ${badge}
            <div class="course-card__overlay">
              <a href="./course/${this.escapeHtml(course.slug)}"
                 class="course-card__preview"
                 aria-label="Подробнее о курсе ${this.escapeHtml(course.title)}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
                </svg>
              </a>
            </div>
          </div>
          <div class="course-card__content">
            <div class="course-card__meta">
              <span class="course-card__category">${labels[course.category] || course.category}</span>
              <span class="course-card__level">${course.level}</span>
            </div>
            <h3 class="course-card__title">${this.escapeHtml(course.title)}</h3>
            <p class="course-card__description">${this.escapeHtml(course.short_description || course.description || '')}</p>
            <div class="course-card__stats">
              <span class="stat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                ${this.escapeHtml(course.duration || '')}
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
                <span class="price-current">${this.formatPrice(course.price_basic)} ₽</span>
                ${pricePro}
              </div>
              <a href="./course/${this.escapeHtml(course.slug)}" class="btn btn--accent btn--sm">Подробнее</a>
            </div>
          </div>
        </article>
      `;
    }

    animateCards() {
      const cards = this.grid.querySelectorAll('.course-card');
      cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
          card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, i * 50);
      });
    }

    showLoading(show) {
      if (this.loading) {
        if (show) this.loading.removeAttribute('hidden');
        else this.loading.setAttribute('hidden', '');
      }
    }

    showError() {
      if (this.grid) {
        this.grid.innerHTML = '<p style="text-align:center;color:var(--danger);grid-column:1/-1;padding:40px;">Ошибка загрузки курсов. Попробуйте обновить страницу.</p>';
      }
    }

    // Utility functions
    debounce(fn, delay) {
      let timeoutId;
      return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
      };
    }

    escapeHtml(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    formatPrice(price) {
      if (!price) return '0';
      return new Intl.NumberFormat('ru-RU').format(price);
    }
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    const catalog = new CourseCatalog();
    catalog.init();
  });
})();