const App = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),

  init() {
    this.updateAuthUI();
    this.bindMobileMenu();
    this.bindLogout();
  },

  async api(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) {
      headers['Authorization'] = 'Bearer ' + this.token;
    }
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      this.logout();
      return null;
    }
    return res.json();
  },

  updateAuthUI() {
    const navAuth = document.getElementById('navAuth');
    const navUser = document.getElementById('navUser');
    if (this.user) {
      if (navAuth) navAuth.style.display = 'none';
      if (navUser) navUser.style.display = 'flex';
    } else {
      if (navAuth) navAuth.style.display = 'flex';
      if (navUser) navUser.style.display = 'none';
    }
  },

  bindMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const nav = document.getElementById('mainNav');
    if (btn && nav) {
      btn.addEventListener('click', () => {
        nav.classList.toggle('open');
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !expanded);
      });
    }
  },

  bindLogout() {
    const btn = document.getElementById('logoutBtn');
    if (btn) {
      btn.addEventListener('click', () => this.logout());
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token = null;
    this.user = null;
    window.location.href = '/';
  },

  toast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  },

  formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return days + ' дн. назад';
    if (days < 30) return Math.floor(days / 7) + ' нед. назад';
    return date.toLocaleDateString('ru-RU');
  },

  formatSalary(min, max) {
    const fmt = n => n ? (n / 1000).toFixed(0) + ' 000 ₽' : null;
    if (min && max) return 'от ' + fmt(min) + ' до ' + fmt(max);
    if (min) return 'от ' + fmt(min);
    if (max) return 'до ' + fmt(max);
    return 'Зарплата не указана';
  },

  formatExperience(level) {
    const map = { junior: 'Junior', middle: 'Middle', senior: 'Senior', lead: 'Lead' };
    return map[level] || level;
  },

  formatFormat(format) {
    const map = { remote: 'Удалённо', office: 'Офис', hybrid: 'Гибрид' };
    return map[format] || format;
  },

  createJobCard(job) {
    const premiumClass = job.is_premium ? ' premium' : '';
    return `
      <article class="job-card${premiumClass}" aria-label="Вакансия: ${this.escapeHtml(job.title)}">
        <div class="job-header">
          <div>
            <h3 class="job-title"><a href="./vacancy/${job.id}">${this.escapeHtml(job.title)}</a></h3>
            <div class="job-company">
              ${job.company_logo ? '<img src="' + this.escapeHtml(job.company_logo) + '" class="job-company-logo" alt="" loading="lazy">' : ''}
              <span>${this.escapeHtml(job.company_name)}</span>
            </div>
          </div>
          <div class="job-salary">${this.formatSalary(job.salary_min, job.salary_max)}</div>
        </div>
        <div class="job-meta">
          ${job.city ? '<span class="job-tag">📍 ' + this.escapeHtml(job.city) + '</span>' : ''}
          ${job.work_format ? '<span class="job-tag ' + job.work_format + '">' + this.formatFormat(job.work_format) + '</span>' : ''}
          ${job.experience_level ? '<span class="job-tag">' + this.formatExperience(job.experience_level) + '</span>' : ''}
        </div>
        <p class="job-description">${this.escapeHtml(job.description)}</p>
        <div class="job-footer">
          <span class="job-date">${this.formatDate(job.created_at)}</span>
          <div class="job-actions">
            <a href="./vacancy/${job.id}" class="btn btn-outline btn-sm">Подробнее</a>
            <button class="save-btn" data-id="${job.id}" aria-label="Сохранить вакансию" title="Сохранить">♡</button>
          </div>
        </div>
      </article>
    `;
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
