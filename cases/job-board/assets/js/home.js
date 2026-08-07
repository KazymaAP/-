document.addEventListener('DOMContentLoaded', async () => {
  const search = document.getElementById('heroSearch');
  const searchBtn = document.getElementById('heroSearchBtn');

  if (search && searchBtn) {
    searchBtn.addEventListener('click', () => {
      window.location.href = '/vacancies?q=' + encodeURIComponent(search.value);
    });
    search.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        window.location.href = '/vacancies?q=' + encodeURIComponent(search.value);
      }
    });
  }

  try {
    const data = await App.api('/api/vacancies?limit=6');
    if (data && data.vacancies) {
      const container = document.getElementById('topVacancies');
      container.innerHTML = data.vacancies.map(v => App.createJobCard(v)).join('');
      bindSaveButtons();
    }
  } catch (err) {
    document.getElementById('topVacancies').innerHTML = '<p style="text-align:center;color:var(--text-secondary);">Ошибка загрузки вакансий</p>';
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
});
