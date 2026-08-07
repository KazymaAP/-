document.addEventListener('DOMContentLoaded', async () => {
  const state = {
    page: 1,
    limit: 20,
    filters: {}
  };

  const elements = {
    search: document.getElementById('searchInput'),
    city: document.getElementById('cityFilter'),
    format: document.getElementById('formatFilter'),
    experience: document.getElementById('experienceFilter'),
    salaryMin: document.getElementById('salaryMin'),
    salaryMax: document.getElementById('salaryMax'),
    category: document.getElementById('categoryFilter'),
    sort: document.getElementById('sortSelect'),
    searchBtn: document.getElementById('searchBtn'),
    jobsList: document.getElementById('jobsList'),
    resultsCount: document.getElementById('resultsCount'),
    pagination: document.getElementById('pagination')
  };

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('q')) elements.search.value = urlParams.get('q');

  async function loadCities() {
    try {
      const data = await App.api('/api/search');
      if (data && data.filters) {
        data.filters.cities.forEach(city => {
          const opt = document.createElement('option');
          opt.value = city;
          opt.textContent = city;
          elements.city.appendChild(opt);
        });
        data.filters.categories.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat;
          opt.textContent = cat;
          elements.category.appendChild(opt);
        });
      }
    } catch {}
  }

  function buildParams() {
    const params = new URLSearchParams();
    if (elements.search.value.trim()) params.set('search', elements.search.value.trim());
    if (elements.city.value) params.set('city', elements.city.value);
    if (elements.format.value) params.set('format', elements.format.value);
    if (elements.experience.value) params.set('experience', elements.experience.value);
    if (elements.salaryMin.value) params.set('salary_min', elements.salaryMin.value);
    if (elements.salaryMax.value) params.set('salary_max', elements.salaryMax.value);
    if (elements.category.value) params.set('category', elements.category.value);
    if (elements.sort.value) params.set('sort', elements.sort.value);
    params.set('page', state.page);
    params.set('limit', state.limit);
    return params;
  }

  async function loadVacancies() {
    elements.jobsList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    try {
      const params = buildParams();
      const data = await App.api('/api/vacancies?' + params.toString());
      if (data && data.vacancies) {
        renderVacancies(data.vacancies);
        renderPagination(data.pagination);
        elements.resultsCount.textContent = 'Найдено: ' + data.pagination.total + ' вакансий';
      } else {
        elements.jobsList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><h3 class="empty-state-title">Вакансии не найдены</h3><p class="empty-state-text">Попробуйте изменить параметры поиска</p></div>';
        elements.resultsCount.textContent = 'Найдено: 0 вакансий';
        elements.pagination.innerHTML = '';
      }
    } catch {
      elements.jobsList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3 class="empty-state-title">Ошибка загрузки</h3><p class="empty-state-text">Попробуйте обновить страницу</p></div>';
    }
  }

  function renderVacancies(vacancies) {
    elements.jobsList.innerHTML = vacancies.map(v => App.createJobCard(v)).join('');
    bindSaveButtons();
  }

  function bindSaveButtons() {
    document.querySelectorAll('.save-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!App.token) {
          window.location.href = '/login';
          return;
        }
        const id = btn.dataset.id;
        try {
          const res = await App.api('/api/vacancies/' + id + '/save', { method: 'POST' });
          if (res && res.saved !== undefined) {
            btn.classList.toggle('saved', res.saved);
            btn.innerHTML = res.saved ? '♥' : '♡';
            App.toast(res.saved ? 'Сохранено' : 'Удалено из сохранённых', 'success');
          }
        } catch {}
      });
    });
  }

  function renderPagination(pagination) {
    if (!pagination || pagination.pages <= 1) {
      elements.pagination.innerHTML = '';
      return;
    }

    let html = '';
    if (pagination.page > 1) {
      html += '<button class="pagination-btn" data-page="' + (pagination.page - 1) + '" aria-label="Предыдущая страница">←</button>';
    }

    const start = Math.max(1, pagination.page - 2);
    const end = Math.min(pagination.pages, pagination.page + 2);

    for (let i = start; i <= end; i++) {
      html += '<button class="pagination-btn' + (i === pagination.page ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }

    if (pagination.page < pagination.pages) {
      html += '<button class="pagination-btn" data-page="' + (pagination.page + 1) + '" aria-label="Следующая страница">→</button>';
    }

    elements.pagination.innerHTML = html;
    elements.pagination.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.page = parseInt(btn.dataset.page);
        loadVacancies();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  const debouncedSearch = debounce(() => {
    state.page = 1;
    loadVacancies();
  }, 300);

  elements.search.addEventListener('input', debouncedSearch);
  elements.search.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') { state.page = 1; loadVacancies(); }
  });
  elements.searchBtn.addEventListener('click', () => { state.page = 1; loadVacancies(); });
  elements.city.addEventListener('change', () => { state.page = 1; loadVacancies(); });
  elements.format.addEventListener('change', () => { state.page = 1; loadVacancies(); });
  elements.experience.addEventListener('change', () => { state.page = 1; loadVacancies(); });
  elements.salaryMin.addEventListener('input', debouncedSearch);
  elements.salaryMax.addEventListener('input', debouncedSearch);
  elements.category.addEventListener('change', () => { state.page = 1; loadVacancies(); });
  elements.sort.addEventListener('change', () => { state.page = 1; loadVacancies(); });

  await loadCities();
  loadVacancies();
});