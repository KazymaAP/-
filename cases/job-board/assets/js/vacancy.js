document.addEventListener('DOMContentLoaded', async () => {
  const path = window.location.pathname;
  const jobId = path.split('/').pop();

  if (!jobId || jobId === 'vacancy') {
    window.location.href = '/vacancies';
    return;
  }

  const loading = document.getElementById('jobLoading');
  const detail = document.getElementById('jobDetail');

  async function loadJob() {
    try {
      const job = await App.api('/api/vacancies/' + jobId);
      if (!job) { loading.textContent = 'Вакансия не найдена'; return; }
      renderJob(job);
      detail.style.display = 'grid';
      loading.style.display = 'none';
      loadSimilar(job.category, job.id);
    } catch {
      loading.textContent = 'Ошибка загрузки';
    }
  }

  function renderJob(job) {
    document.title = App.escapeHtml(job.title) + ' — Работа Мало';

    document.getElementById('jobTitle').textContent = job.title;

    const companyEl = document.getElementById('jobCompany');
    companyEl.innerHTML = `
      ${job.company_logo ? '<img src="' + App.escapeHtml(job.company_logo) + '" class="job-company-logo" alt="" loading="lazy">' : ''}
      <a href="./company/' + job.company_slug + '" style="font-weight:600;color:var(--text);">' + App.escapeHtml(job.company_name) + '</a>
      ${job.city ? ' · <span style="color:var(--text-secondary);">' + App.escapeHtml(job.city) + '</span>' : ''}
      ${job.work_format ? ' · <span style="color:var(--text-secondary);">' + App.formatFormat(job.work_format) + '</span>' : ''}
    `;

    let metaHtml = '';
    metaHtml += '<span class="job-tag"><strong>Зарплата:</strong> ' + App.formatSalary(job.salary_min, job.salary_max) + '</span>';
    if (job.experience_level) metaHtml += '<span class="job-tag"><strong>Опыт:</strong> ' + App.formatExperience(job.experience_level) + '</span>';
    if (job.category) metaHtml += '<span class="job-tag"><strong>Категория:</strong> ' + App.escapeHtml(job.category) + '</span>';
    if (job.contact_email) metaHtml += '<span class="job-tag"><strong>Email:</strong> ' + App.escapeHtml(job.contact_email) + '</span>';
    document.getElementById('jobMeta').innerHTML = metaHtml;

    document.getElementById('jobDescription').innerHTML = `
      <h3>Описание</h3>
      <div style="white-space:pre-wrap;">${App.escapeHtml(job.description)}</div>
    `;

    if (job.requirements) {
      document.getElementById('jobRequirements').innerHTML = `
        <h3>Требования</h3>
        <ul>${job.requirements.split('\n').filter(r => r.trim()).map(r => '<li>' + App.escapeHtml(r) + '</li>').join('')}</ul>
      `;
    }

    if (job.conditions) {
      document.getElementById('jobConditions').innerHTML = `
        <h3>Условия</h3>
        <ul>${job.conditions.split('\n').filter(r => r.trim()).map(r => '<li>' + App.escapeHtml(r) + '</li>').join('')}</ul>
      `;
    }
  }

  async function loadSimilar(category, excludeId) {
    try {
      const data = await App.api('/api/search?category=' + encodeURIComponent(category) + '&limit=5');
      if (data && data.vacancies) {
        const similar = data.vacancies.filter(v => v.id !== excludeId).slice(0, 3);
        document.getElementById('similarJobs').innerHTML = similar.map(v =>
          '<a href="./vacancy/' + v.id + '" class="similar-job">' + App.escapeHtml(v.title) + '</a>'
        ).join('');
      }
    } catch {}
  }

  const applyForm = document.getElementById('applyForm');
  if (applyForm) {
    applyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!App.token) {
        window.location.href = '/login';
        return;
      }
      const btn = document.getElementById('applyBtn');
      btn.disabled = true;
      btn.textContent = 'Отправка...';
      try {
        const res = await App.api('/api/applications', {
          method: 'POST',
          body: JSON.stringify({
            vacancy_id: jobId,
            cover_letter: document.getElementById('applyMessage').value
          })
        });
        if (res && res.id) {
          App.toast('Отклик отправлен!', 'success');
          applyForm.reset();
        } else {
          App.toast(res?.error || 'Ошибка отправки', 'error');
        }
      } catch {
        App.toast('Ошибка сети', 'error');
      }
      btn.disabled = false;
      btn.textContent = 'Отправить отклик';
    });
  }

  loadJob();
});