/**
 * Course Detail Module
 * Handles course page with program, testimonials, FAQ
 */

(function() {
  'use strict';

  class CourseDetail {
    constructor() {
      this.course = null;
      this.selectedModule = null;
    }

    async init() {
      const slug = this.getSlugFromUrl();
      if (!slug) return;

      try {
        const response = await fetch(`/api/courses/${slug}`);
        if (!response.ok) throw new Error('Курс не найден');
        this.course = await response.json();
        this.render();
        this.bindEvents();
        this.trackView();
      } catch (err) {
        console.error('Failed to load course:', err);
        this.showError();
      }
    }

    getSlugFromUrl() {
      const path = window.location.pathname;
      const parts = path.split('/').filter(Boolean);
      const slug = parts[parts.length - 1];
      // Validate slug format (alphanumeric, hyphens, underscores only)
      if (!slug || !/^[a-zA-Z0-9_-]+$/.test(slug) || slug.length > 255) {
        return null;
      }
      return slug;
    }

    render() {
      if (!this.course) return;

      const c = this.course;

      // Update page title
      document.title = `${c.title} — Online School`;

      // Hero section
      this.updateElement('courseTag', this.getCategoryLabel(c.category));
      this.updateElement('courseTitle', c.title);
      this.updateElement('courseDesc', c.description);
      this.updateElement('coursePrice', this.formatPrice(c.price_basic) + ' ₽');
      this.updateElement('courseStudents', this.formatNumber(c.students) + ' студентов');
      this.updateElement('courseRating', '★ ' + c.rating);
      this.updateElement('courseDuration', c.duration || '');

      // Update course image
      const img = document.getElementById('courseImage');
      if (img && c.image) {
        img.src = c.image;
        img.alt = `Обложка курса ${c.title}`;
      }

      // Render sections
      this.renderProgram();
      this.renderInstructor();
      this.renderTestimonials();
      this.renderFAQ();

      // Update JSON-LD
      this.updateSchema(c);
    }

    getCategoryLabel(category) {
      const labels = { dev: 'Программирование', design: 'Дизайн', marketing: 'Маркетинг' };
      return labels[category] || category;
    }

    renderProgram() {
      const container = document.getElementById('courseProgram');
      if (!container || !this.course.modules) return;

      container.innerHTML = this.course.modules.map((mod, i) => `
        <div class="module ${i === 0 ? 'module--active' : ''}" data-module="${i}">
          <button class="module__header" aria-expanded="${i === 0}" aria-controls="module-content-${i}">
            <div class="module__info">
              <span class="module__number">${i + 1}</span>
              <h3 class="module__title">${this.escapeHtml(mod.title)}</h3>
            </div>
            <div class="module__meta">
              <span>${mod.lessons?.length || 0} уроков</span>
              <span>${mod.duration_hours}ч</span>
              <svg class="module__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </button>
          <div class="module__content" id="module-content-${i}" ${i === 0 ? '' : 'hidden'}>
            <ul class="lessons-list">
              ${(mod.lessons || []).map((lesson, j) => `
                <li class="lesson ${lesson.is_preview ? 'lesson--preview' : ''}">
                  <span class="lesson__number">${i + 1}.${j + 1}</span>
                  <span class="lesson__title">${this.escapeHtml(lesson.title)}</span>
                  <span class="lesson__duration">${lesson.duration_minutes} мин</span>
                  ${lesson.is_preview ? '<a class="lesson__preview" href="#">Превью</a>' : ''}
                </li>
              `).join('')}
            </ul>
            ${mod.description ? `<div class="module__homework"><strong>Описание:</strong> ${this.escapeHtml(mod.description)}</div>` : ''}
          </div>
        </div>
      `).join('');
    }

    renderInstructor() {
      const container = document.getElementById('instructorInfo');
      if (!container || !this.course.instructor_name) return;

      container.innerHTML = `
        <div class="instructor-detail">
          <img class="instructor-detail__photo" src="${this.escapeHtml(this.course.instructor_photo || '/img/instructors/default.jpg')}" alt="${this.escapeHtml(this.course.instructor_name)}">
          <h4 class="instructor-detail__name">${this.escapeHtml(this.course.instructor_name)}</h4>
          <p class="instructor-detail__role">${this.escapeHtml(this.course.instructor_role || 'Преподаватель')}</p>
          <p class="instructor-detail__bio">${this.escapeHtml(this.course.instructor_bio || '')}</p>
          <div class="instructor-detail__stats">
            <span>${this.course.experience_years} лет опыта</span>
            <span>${this.course.students_count || this.course.students} студентов</span>
            <span>★ ${this.course.instructor_rating || this.course.rating}</span>
          </div>
        </div>
      `;
    }

    renderTestimonials() {
      const container = document.getElementById('testimonials');
      if (!container || !this.course.testimonials?.length) {
        if (container) container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);">Пока нет отзывов</p>';
        return;
      }

      container.innerHTML = this.course.testimonials.map(t => `
        <div class="testimonial-card">
          <div class="testimonial-card__header">
            <img class="testimonial-card__avatar" src="${this.escapeHtml(t.avatar || '/img/testimonials/default.jpg')}" alt="${this.escapeHtml(t.user_name || 'Студент')}" width="48" height="48" loading="lazy">
            <div>
              <strong class="testimonial-card__name">${this.escapeHtml(t.user_name || 'Студент')}</strong>
              <span class="testimonial-card__role">${this.escapeHtml(t.before_role || 'Выпускник')}</span>
            </div>
          </div>
          <p class="testimonial-card__text">"${this.escapeHtml(t.text)}"</p>
          <div class="testimonial-card__result">
            <span class="result-before">${this.escapeHtml(t.before_role || 'Было')}: ${t.salary_before ? this.formatPrice(t.salary_before) + ' ₽' : ''}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            <span class="result-after">${this.escapeHtml(t.after_role || 'Стало')}: ${t.salary_after ? this.formatPrice(t.salary_after) + ' ₽' : ''}</span>
          </div>
        </div>
      `).join('');
    }

    renderFAQ() {
      const container = document.getElementById('courseFAQ');
      if (!container || !this.course.faq?.length) return;

      container.innerHTML = this.course.faq.map((item, i) => `
        <details class="faq-item">
          <summary class="faq-item__question">${this.escapeHtml(item.question)}</summary>
          <p class="faq-item__answer">${this.escapeHtml(item.answer)}</p>
        </details>
      `).join('');
    }

    bindEvents() {
      // Module accordion
      document.querySelectorAll('.module__header').forEach((btn) => {
        btn.addEventListener('click', () => {
          const module = btn.closest('.module');
          const content = module.querySelector('.module__content');
          const isActive = module.classList.contains('module--active');

          // Close all
          document.querySelectorAll('.module').forEach(m => {
            m.classList.remove('module--active');
            m.querySelector('.module__content').hidden = true;
            m.querySelector('.module__header').setAttribute('aria-expanded', 'false');
          });

          // Open clicked if not was active
          if (!isActive) {
            module.classList.add('module--active');
            content.hidden = false;
            btn.setAttribute('aria-expanded', 'true');
          }
        });
      });

      // Enroll buttons
      document.querySelectorAll('#enrollBtn, #sidebarEnrollBtn').forEach(btn => {
        btn.addEventListener('click', () => this.handleEnroll());
      });
    }

    async handleEnroll() {
      if (!window.OnlineSchool?.Auth?.isLoggedIn()) {
        const modal = document.getElementById('authModal');
        modal?.classList.add('active');
        modal?.setAttribute('aria-hidden', 'false');
        return;
      }

      // Redirect to enrollment flow or show tier selection
      window.location.href = `/enroll/${this.course.slug}`;
    }

    trackView() {
      if (typeof gtag !== 'undefined' && this.course) {
        gtag('event', 'view_item', {
          item_id: this.course.id,
          item_name: this.course.title,
          item_category: 'Course',
          value: this.course.price_basic,
          currency: 'RUB'
        });
      }
    }

    updateSchema(course) {
      // Update or add JSON-LD schema
      let script = document.getElementById('course-schema');
      if (!script) {
        script = document.createElement('script');
        script.id = 'course-schema';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Course",
        "name": course.title,
        "description": course.short_description || course.description,
        "url": window.location.href,
        "provider": {
          "@type": "EducationalOrganization",
          "name": "Online School"
        },
        "offers": {
          "@type": "Offer",
          "price": course.price_basic,
          "priceCurrency": "RUB",
          "availability": "https://schema.org/InStock"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": course.rating,
          "reviewCount": course.rating_count
        }
      });
    }

    showError() {
      const main = document.getElementById('main-content');
      if (main) {
        main.innerHTML = `
          <div class="error-page">
            <div class="container">
              <div class="error-page__content">
                <span class="error-page__code">404</span>
                <h1 class="error-page__title">Курс не найден</h1>
                <p class="error-page__text">К сожалению, запрашиваемый курс не существует или был удален.</p>
                <a href="./courses" class="btn btn--accent btn--lg">К каталогу курсов</a>
              </div>
            </div>
          </div>
        `;
      }
    }

    // Utility functions
    updateElement(id, content) {
      const el = document.getElementById(id);
      if (el) el.textContent = content;
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

    formatNumber(num) {
      if (!num) return '0';
      return new Intl.NumberFormat('ru-RU').format(num);
    }
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    const detail = new CourseDetail();
    detail.init();
  });
})();