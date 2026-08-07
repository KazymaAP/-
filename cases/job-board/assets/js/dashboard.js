document.addEventListener('DOMContentLoaded', async () => {
  if (!App.token) { window.location.href = '/login'; return; }

  const tabs = document.querySelectorAll('.dashboard-sidebar a[data-tab]');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.style.display = 'none');
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).style.display = 'block';
      loadTab(tab.dataset.tab);
    });
  });

  async function loadTab(tab) {
    switch (tab) {
      case 'applications': loadApplications(); break;
      case 'saved': loadSaved(); break;
      case 'my-vacancies': loadMyVacancies(); break;
      case 'company': loadCompany(); break;
      case 'resume': loadResume(); break;
      case 'subscription': loadSubscription(); break;
    }
  }

  async function loadApplications() {
    try {
      const data = await App.api('/api/applications/my');
      const container = document.getElementById('applications');
      if (data && data.length > 0) {
        container.innerHTML = data.map(app => `
          <article class="application-card">
            <div class="application-header">
              <h3 class="application-title"><a href="./vacancy/${app.vacancy_id}">${App.escapeHtml(app.vacancy_title)}</a></h3>
              <span class="status status-${app.status}">${getStatusLabel(app.status)}</span>
            </div>
            <p class="application-company">${App.escapeHtml(app.company_name)}</p>
            <p class="application-date">${App.formatDate(app.created_at)}</p>
          </article>
        `).join('');
      } else {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📄</div><h3 class="empty-state-title">Откликов пока нет</h3><p class="empty-state-text"><a href="./vacancies" class="btn btn-primary btn-sm">Посмотреть вакансии</a></p></div>';
      }
    } catch { document.getElementById('applications').innerHTML = '<p style="color:var(--danger);">Ошибка загрузки</p>'; }
  }

  function getStatusLabel(status) {
    const map = { pending: 'На рассмотрении', reviewing: 'Рецензия', shortlisted: 'В шорт-листе', rejected: 'Отклонено', hired: 'Принято' };
    return map[status] || status;
  }

  async function loadSaved() {
    try {
      const data = await App.api('/api/vacancies?saved=true');
      const container = document.getElementById('savedVacancies');
      if (data && data.vacancies && data.vacancies.length > 0) {
        container.innerHTML = data.vacancies.map(v => App.createJobCard(v)).join('');
        bindSaveButtons();
      } else {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">♥</div><h3 class="empty-state-title">Нет сохранённых вакансий</h3></div>';
      }
    } catch { document.getElementById('savedVacancies').innerHTML = '<p style="color:var(--danger);">Ошибка загрузки</p>'; }
  }

  function bindSaveButtons() {
    document.querySelectorAll('.save-btn').forEach(btn => {
      btn.classList.add('saved');
      btn.innerHTML = '♥';
    });
  }

  async function loadMyVacancies() {
    try {
      const data = await App.api('/api/vacancies/my');
      const container = document.getElementById('myVacancies');
      if (data && data.vacancies && data.vacancies.length > 0) {
        container.innerHTML = data.vacancies.map(v => `
          <article class="job-card${v.is_premium ? ' premium' : ''}" style="display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;justify-content:space-between;align-items:start;">
              <div>
                <h3 class="job-title">${App.escapeHtml(v.title)}</h3>
                <p class="job-company">${App.escapeHtml(v.city || '')} · ${App.formatFormat(v.work_format)} · ${App.formatExperience(v.experience_level)}</p>
              </div>
              <span class="status status-${v.status === 'active' ? 'pending' : v.status}">${getStatusLabel(v.status)}</span>
            </div>
            <div class="job-footer">
              <span class="job-date">Просмотров: ${v.views_count} · Откликов: ${v.applications_count}</span>
              <div class="job-actions">
                <a href="./vacancy/${v.id}" class="btn btn-secondary btn-sm">Просмотр</a>
                <button class="btn btn-outline btn-sm" onclick="editVacancy(${v.id})">Редактировать</button>
                <button class="btn btn-danger btn-sm" onclick="deleteVacancy(${v.id})">Удалить</button>
              </div>
            </div>
          </article>
        `).join('');
      } else {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><h3 class="empty-state-title">У вас пока нет вакансий</h3><p class="empty-state-text"><a href="./post" class="btn btn-primary">Создать первую вакансию</a></p></div>';
      }
    } catch { document.getElementById('myVacancies').innerHTML = '<p style="color:var(--danger);">Ошибка загрузки</p>'; }
  }

  async function loadCompany() {
    try {
      const data = await App.api('/api/companies/my');
      if (data) {
        document.getElementById('companyName').value = data.name || '';
        document.getElementById('companyDesc').value = data.description || '';
        document.getElementById('companyIndustry').value = data.industry || '';
        document.getElementById('companySize').value = data.size || '10-50';
        document.getElementById('companyCity').value = data.city || '';
        document.getElementById('companyWebsite').value = data.website || '';
      }
    } catch {}

    document.getElementById('companyForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Сохранение...';
      try {
        const res = await App.api('/api/companies', {
          method: 'POST',
          body: JSON.stringify({
            name: document.getElementById('companyName').value,
            description: document.getElementById('companyDesc').value,
            industry: document.getElementById('companyIndustry').value,
            size: document.getElementById('companySize').value,
            city: document.getElementById('companyCity').value,
            website: document.getElementById('companyWebsite').value
          })
        });
        if (res && res.id) App.toast('Компания сохранена!', 'success');
        else App.toast(res?.error || 'Ошибка', 'error');
      } catch { App.toast('Ошибка сети', 'error'); }
      btn.disabled = false;
      btn.textContent = 'Сохранить';
    });
  }

  async function loadResume() {
    try {
      const data = await App.api('/api/resumes/my');
      if (data) {
        document.getElementById('resumeTitle').value = data.title || '';
        document.getElementById('resumeName').value = data.name || '';
        document.getElementById('resumeEmail').value = data.email || '';
        document.getElementById('resumePhone').value = data.phone || '';
        document.getElementById('resumeCity').value = data.city || '';
        document.getElementById('resumeExp').value = data.experience_years || '';
        document.getElementById('resumeSalary').value = data.salary_expectation || '';
        document.getElementById('resumeSkills').value = (data.skills || []).join(', ');
        document.getElementById('resumeAbout').value = data.about || '';
      }
    } catch {}

    document.getElementById('resumeForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Сохранение...';
      try {
        const skills = document.getElementById('resumeSkills').value.split(',').map(s => s.trim()).filter(s => s);
        const res = await App.api('/api/resumes', {
          method: 'POST',
          body: JSON.stringify({
            title: document.getElementById('resumeTitle').value,
            name: document.getElementById('resumeName').value,
            email: document.getElementById('resumeEmail').value,
            phone: document.getElementById('resumePhone').value,
            city: document.getElementById('resumeCity').value,
            experience_years: parseInt(document.getElementById('resumeExp').value) || 0,
            skills,
            salary_expectation: parseInt(document.getElementById('resumeSalary').value) || 0,
            about: document.getElementById('resumeAbout').value
          })
        });
        if (res && res.id) App.toast('Резюме сохранено!', 'success');
        else App.toast(res?.error || 'Ошибка', 'error');
      } catch { App.toast('Ошибка сети', 'error'); }
      btn.disabled = false;
      btn.textContent = 'Сохранить резюме';
    });
  }

  async function loadSubscription() {
    try {
      const data = await App.api('/api/payments/my');
      const container = document.getElementById('subscriptionInfo');
      if (data && data.plan && data.plan !== 'free') {
        container.innerHTML = `
          <p><strong>Текущий тариф:</strong> ${data.plan === 'standard' ? 'Стандарт' : 'Премиум'}</p>
          <p><strong>Действует до:</strong> ${data.expires_at ? new Date(data.expires_at).toLocaleDateString('ru-RU') : '—'}</p>
          <a href="./pricing" class="btn btn-primary">Изменить тариф</a>
        `;
      } else {
        container.innerHTML = `
          <p>У вас бесплатный тариф (1 вакансия)</p>
          <a href="./pricing" class="btn btn-primary">Выбрать тариф</a>
        `;
      }
    } catch { document.getElementById('subscriptionInfo').innerHTML = '<p style="color:var(--danger);">Ошибка загрузки</p>'; }
  }

  window.editVacancy = (id) => { window.location.href = '/post?edit=' + id; };
  window.deleteVacancy = async (id) => {
    if (!confirm('Удалить вакансию?')) return;
    try {
      await App.api('/api/vacancies/' + id, { method: 'DELETE' });
      App.toast('Удалено', 'success');
      loadMyVacancies();
    } catch { App.toast('Ошибка', 'error'); }
  };

  loadTab('applications');
});