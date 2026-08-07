/**
 * Student Dashboard Module
 * Handles dashboard with courses, certificates, progress
 */

(function() {
  'use strict';

  class StudentDashboard {
    constructor() {
      this.courses = [];
      this.certificates = [];
      this.currentSection = 'my-courses';
    }

    async init() {
      if (!window.OnlineSchool?.Auth?.isLoggedIn()) {
        window.location.href = '/?redirect=dashboard';
        return;
      }

      await Promise.all([
        this.loadCourses(),
        this.loadCertificates()
      ]);
      this.render();
      this.bindEvents();
    }

    async loadCourses() {
      try {
        const response = await fetch('/api/my-courses', {
          headers: window.OnlineSchool.Auth.getHeaders()
        });
        if (response.ok) {
          this.courses = await response.json();
        } else if (response.status === 401) {
          window.OnlineSchool.Auth.logout();
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
      }
    }

    async loadCertificates() {
      try {
        const response = await fetch('/api/my-certificates', {
          headers: window.OnlineSchool.Auth.getHeaders()
        });
        if (response.ok) {
          this.certificates = await response.json();
        }
      } catch (err) {
        console.error('Failed to load certificates:', err);
      }
    }

    render() {
      this.renderStats();
      this.renderCourses();
      this.renderCertificates();
      this.showSection(this.currentSection);
      this.updateWelcomeMessage();
    }

    updateWelcomeMessage() {
      const user = window.OnlineSchool.Auth.getUser();
      const welcome = document.getElementById('welcomeMessage');
      if (welcome && user) {
        welcome.textContent = `Привет, ${user.name}!`;
      }
    }

    renderStats() {
      const container = document.getElementById('dashboardStats');
      if (!container) return;

      const totalCourses = this.courses.length;
      const completedCourses = this.courses.filter(c => c.progress === 100).length;
      const totalHours = this.courses.reduce((sum, c) => sum + (c.hoursCompleted || 0), 0);

      container.innerHTML = `
        <div class="stat-card">
          <span class="stat-card__value">${totalCourses}</span>
          <span class="stat-card__label">Курсов</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__value">${completedCourses}</span>
          <span class="stat-card__label">Завершено</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__value">${totalHours}</span>
          <span class="stat-card__label">Часов обучения</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__value">${this.certificates.length}</span>
          <span class="stat-card__label">Сертификатов</span>
        </div>
      `;
    }

    renderCourses() {
      const container = document.getElementById('myCourses');
      const loading = document.getElementById('myCoursesLoading');
      const empty = document.getElementById('noCourses');

      if (loading) loading.setAttribute('hidden', '');

      if (!container) return;

      if (this.courses.length === 0) {
        container.innerHTML = '';
        empty?.removeAttribute('hidden');
        return;
      }

      empty?.setAttribute('hidden', '');

      container.innerHTML = this.courses.map(course => `
        <div class="my-course-card" data-course-id="${course.id}">
          <img class="my-course-card__image" src="${this.escapeHtml(course.image || '/img/courses/default.jpg')}" alt="${this.escapeHtml(course.title)}" loading="lazy">
          <div class="my-course-card__content">
            <h3 class="my-course-card__title">${this.escapeHtml(course.title)}</h3>
            <div class="my-course-card__progress">
              <div class="progress-bar">
                <div class="progress-bar__fill" style="width: ${course.progress}%"></div>
              </div>
              <span class="progress-text">${course.progress}% пройдено</span>
            </div>
            <div class="my-course-card__next">
              <span class="next-label">Следующий урок:</span>
              <span class="next-lesson">${this.escapeHtml(course.nextLesson || 'Все уроки пройдены!')}</span>
            </div>
            <div class="my-course-card__actions">
              <a href="./learn/${course.slug || course.id}" class="btn btn--accent btn--sm">
                ${course.progress > 0 ? 'Продолжить' : 'Начать'}
              </a>
              ${course.progress === 100 ? `
                <button class="btn btn--outline btn--sm" data-action="certificate" data-course-id="${course.id}">
                  Сертификат
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `).join('');

      // Bind certificate buttons
      container.querySelectorAll('[data-action="certificate"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const courseId = e.currentTarget.dataset.courseId;
          this.showCertificate(courseId);
        });
      });
    }

    renderCertificates() {
      const container = document.getElementById('myCertificates');
      const empty = document.getElementById('noCertificates');

      if (!container) return;

      if (this.certificates.length === 0) {
        container.innerHTML = '';
        empty?.removeAttribute('hidden');
        return;
      }

      empty?.setAttribute('hidden', '');

      container.innerHTML = this.certificates.map(cert => `
        <div class="certificate-card">
          <div class="certificate-card__preview">
            <img src="${this.escapeHtml(cert.thumbnail || '/img/certificates/default.jpg')}" alt="Сертификат ${this.escapeHtml(cert.course_name)}" loading="lazy">
          </div>
          <div class="certificate-card__info">
            <h4>${this.escapeHtml(cert.course_name)}</h4>
            <p>Получен: ${new Date(cert.issued_at).toLocaleDateString('ru-RU')}</p>
            <p>Номер: ${this.escapeHtml(cert.number)}</p>
            <div class="certificate-card__actions">
              <a href="./certificates/${cert.id}/download" class="btn btn--outline btn--sm">Скачать PDF</a>
              <a href="./certificates/${cert.id}/verify" class="btn btn--outline btn--sm">Проверить</a>
            </div>
          </div>
        </div>
      `).join('');
    }

    showSection(sectionId) {
      this.currentSection = sectionId;

      // Update nav
      document.querySelectorAll('.dashboard-sidebar a').forEach(link => {
        const target = link.dataset.section;
        if (target === sectionId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });

      // Show/hide sections
      document.querySelectorAll('.dashboard-section').forEach(section => {
        if (section.id === sectionId) {
          section.removeAttribute('hidden');
        } else {
          section.setAttribute('hidden', '');
        }
      });
    }

    bindEvents() {
      // Sidebar navigation
      document.querySelectorAll('.dashboard-sidebar a').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const target = e.currentTarget.dataset.section;
          this.showSection(target);
        });
      });

      // Certificate download tracking
      document.addEventListener('click', (e) => {
        const link = e.target.closest('[href*="/certificates/"][href*="/download"]');
        if (link) {
          this.trackCertificateDownload(link.href);
        }
      });
    }

    showCertificate(courseId) {
      const cert = this.certificates.find(c => c.course_id === courseId);
      if (cert) {
        window.open(`/certificates/${cert.id}/download`, '_blank');
      }
    }

    trackCertificateDownload(url) {
      if (typeof gtag !== 'undefined') {
        const courseId = url.match(/\/certificates\/(\d+)/)?.[1];
        gtag('event', 'download', {
          file_name: `certificate-${courseId}`,
          content_type: 'certificate'
        });
      }
    }

    // Utility functions
    escapeHtml(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new StudentDashboard();
    dashboard.init();
  });
})();