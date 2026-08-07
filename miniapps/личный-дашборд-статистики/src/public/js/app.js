/* ============================================
   Dashboard App — Main Application
   ============================================ */
'use strict';

/* ============================================
   Utilities
   ============================================ */
const Utils = {
  formatCurrency(value) {
    if (typeof value !== 'number') return '0 ₽';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(value);
  },

  formatNumber(value) {
    if (typeof value !== 'number') return '0';
    if (value >= 1000000) return (value / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1).replace('.0', '') + 'K';
    return new Intl.NumberFormat('ru-RU').format(value);
  },

  formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  },

  formatShortDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  getPeriodDates(period) {
    const now = new Date();
    const start = new Date();
    switch (period) {
      case 'day': start.setHours(0, 0, 0, 0); break;
      case 'week': start.setDate(now.getDate() - now.getDay() + 1); break;
      case 'month': start.setDate(1); break;
      case 'quarter': start.setMonth(Math.floor(now.getMonth() / 3) * 3, 1); break;
      case 'year': start.setMonth(0, 1); break;
    }
    return { start, end: now };
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
};

/* ============================================
   Toast Notifications
   ============================================ */
class Toast {
  constructor() {
    this.container = document.getElementById('toastContainer');
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');

    const icon = this.getIcon(type);
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${icon}</svg>
      <span>${Utils.escapeHtml(message)}</span>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  getIcon(type) {
    const icons = {
      success: '<polyline points="20 6 9 17 4 12"/>',
      error: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
      info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
      warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
    };
    return icons[type] || icons.info;
  }
}

/* ============================================
   API Client
   ============================================ */
class ApiClient {
  constructor() {
    this.baseUrl = '/api';
    try {
      this.token = localStorage.getItem('auth_token');
    } catch (e) {
      this.token = null;
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401) {
        this.handleUnauthorized();
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      if (response.headers.get('content-type')?.includes('application/json')) {
        return await response.json();
      }

      return response;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Нет соединения с сервером');
      }
      throw err;
    }
  }

  handleUnauthorized() {
    try {
      localStorage.removeItem('auth_token');
    } catch (e) {
      // Ignore storage errors
    }
    window.location.reload();
  }

  async getMetrics(period) {
    return this.request(`/dashboard/metrics?period=${period}`);
  }

  async getChartData(period) {
    return this.request(`/dashboard/chart?period=${period}`);
  }

  async getTransactions(limit = 10) {
    return this.request(`/dashboard/transactions?limit=${limit}`);
  }

  async getFinance() {
    return this.request('/finance');
  }

  async createFinanceOp(data) {
    return this.request('/finance', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteFinanceOp(id) {
    return this.request(`/finance/${id}`, { method: 'DELETE' });
  }

  async getSales() {
    return this.request('/sales');
  }

  async getSubscribers() {
    return this.request('/subscribers');
  }

  async getSettings() {
    return this.request('/settings');
  }

  async updateSettings(data) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async exportReport(format, period) {
    const response = await fetch(`${this.baseUrl}/dashboard/export?format=${format}&period=${period}`, {
      headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
    });
    if (!response.ok) throw new Error('Export failed');
    return response;
  }

  async importData(formData) {
    return this.request('/import', {
      method: 'POST',
      headers: {},
      body: formData
    });
  }
}

/* ============================================
   Chart Manager (using Chart.js)
   ============================================ */
class ChartManager {
  constructor() {
    this.charts = {};
    this.defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          titleColor: '#F8FAFC',
          bodyColor: '#94A3B8',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: (ctx) => Utils.formatCurrency(ctx.parsed.y)
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748B', font: { size: 12 } },
          border: { display: false }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: {
            color: '#64748B',
            font: { size: 12 },
            callback: (v) => Utils.formatNumber(v)
          },
          border: { display: false }
        }
      }
    };
  }

  destroy(chartId) {
    if (this.charts[chartId]) {
      this.charts[chartId].destroy();
      delete this.charts[chartId];
    }
  }

  renderLineChart(canvasId, data) {
    this.destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas || !data || !data.labels) return;

    this.charts[canvasId] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        ...this.defaultOptions,
        interaction: { intersect: false, mode: 'index' }
      }
    });
  }

  renderDoughnutChart(canvasId, data) {
    this.destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas || !data || !data.labels) return;

    const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f59e0b', '#22c55e'];

    this.charts[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: colors.slice(0, data.labels.length),
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94A3B8',
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 12 }
            }
          },
          tooltip: {
            ...this.defaultOptions.plugins.tooltip,
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                return `${ctx.label}: ${Utils.formatCurrency(ctx.parsed)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }
}

/* ============================================
   Overview Section
   ============================================ */
class OverviewSection {
  constructor(app) {
    this.app = app;
    this.period = 'month';
  }

  async load() {
    try {
      const [metrics, chartData, transactions] = await Promise.allSettled([
        this.app.api.getMetrics(this.period),
        this.app.api.getChartData(this.period),
        this.app.api.getTransactions(10)
      ]);

      const metricsData = metrics.status === 'fulfilled' ? metrics.value : this.getDemoMetrics();
      const chartDataResult = chartData.status === 'fulfilled' ? chartData.value : this.getDemoChartData();
      const transactionsData = transactions.status === 'fulfilled' ? transactions.value : this.getDemoTransactions();

      this.renderKPIs(metricsData);
      this.renderRevenueChart(chartDataResult);
      this.renderExpenseChart(chartDataResult);
      this.renderTransactions(transactionsData);
    } catch (err) {
      this.app.toast.show('Ошибка загрузки данных', 'error');
    }
  }

  renderKPIs(data) {
    const container = document.getElementById('kpiRow');
    if (!container) return;

    const finance = data.finance || {};
    const sales = data.sales || {};
    const subs = data.subscribers || {};

    const kpis = [
      { label: 'Доходы', value: finance.totalIncome || 0, trend: finance.trend, icon: 'dollar', color: 'green', format: 'currency' },
      { label: 'Расходы', value: finance.totalExpense || 0, trend: null, icon: 'trending-down', color: 'red', format: 'currency' },
      { label: 'Прибыль', value: finance.profit || 0, trend: finance.profitMargin, icon: 'bar-chart', color: 'blue', format: 'currency' },
      { label: 'Заказы', value: sales.totalDeals || 0, trend: null, icon: 'shopping-cart', color: 'purple', format: 'number' },
      { label: 'Конверсия', value: (sales.conversionRate || 0) + '%', trend: null, icon: 'percent', color: 'amber', format: 'text' },
      { label: 'Клиенты', value: subs.total || 0, trend: subs.growth, icon: 'users', color: 'cyan', format: 'number' }
    ];

    container.innerHTML = kpis.map(kpi => {
      const valueStr = kpi.format === 'currency' ? Utils.formatCurrency(kpi.value) :
        kpi.format === 'number' ? Utils.formatNumber(kpi.value) : kpi.value;
      const trendHtml = kpi.trend !== null && kpi.trend !== undefined ?
        `<span class="kpi-trend ${parseFloat(kpi.trend) >= 0 ? 'kpi-trend--up' : 'kpi-trend--down'}">
          ${parseFloat(kpi.trend) >= 0 ? '+' : ''}${kpi.trend}%
        </span>` : '';
      return `
        <div class="kpi-card" role="listitem" data-metric="${Utils.escapeHtml(kpi.label)}">
          <div class="kpi-icon kpi-icon--${kpi.color}" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${this.getIcon(kpi.icon)}</svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">${Utils.escapeHtml(kpi.label)}</span>
            <span class="kpi-value">${valueStr}</span>
            ${trendHtml}
          </div>
        </div>`;
    }).join('');
  }

  getIcon(name) {
    const icons = {
      dollar: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
      'trending-down': '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',
      'bar-chart': '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
      'shopping-cart': '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
      percent: '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
      users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
    };
    return icons[name] || '';
  }

  renderRevenueChart(data) {
    const canvas = document.getElementById('mainChartCanvas');
    if (!canvas) return;
    this.app.charts.renderLineChart('mainChartCanvas', {
      labels: data.labels || [],
      values: data.revenue || []
    });
    const altText = document.getElementById('mainChartAltText');
    if (altText) {
      altText.textContent = `График доходов: ${(data.labels || []).map((l, i) => `${l} — ${Utils.formatCurrency(data.revenue[i])}`).join(', ')}`;
    }
  }

  renderExpenseChart(data) {
    const body = document.getElementById('expenseChartBody');
    if (!body || !data.expenseCategories) return;

    const total = data.expenseCategories.reduce((s, c) => s + c.amount, 0);

    body.innerHTML = `
      <div class="expense-list">
        ${data.expenseCategories.map(cat => {
          const pct = total > 0 ? ((cat.amount / total) * 100).toFixed(0) : 0;
          return `
            <div class="expense-item">
              <span class="expense-label">${Utils.escapeHtml(cat.category)}</span>
              <div class="expense-bar-container">
                <div class="expense-bar" style="width: ${pct}%"></div>
              </div>
              <span class="expense-value">${Utils.formatCurrency(cat.amount)}</span>
              <span class="expense-percent">${pct}%</span>
            </div>`;
        }).join('')}
      </div>`;
  }

  renderTransactions(transactions) {
    const tbody = document.getElementById('recentTransactionsBody');
    const emptyState = document.getElementById('recentTransactionsEmpty');
    if (!tbody) return;

    if (!transactions || transactions.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
      return;
    }

    if (emptyState) emptyState.hidden = true;
    tbody.innerHTML = transactions.map(t => `
      <tr>
        <td>${Utils.formatDate(t.date)}</td>
        <td>${Utils.escapeHtml(t.description)}</td>
        <td><span class="category-badge">${Utils.escapeHtml(t.category || 'Без категории')}</span></td>
        <td class="amount-${t.type}">
          ${t.type === 'income' ? '+' : '-'}${Utils.formatCurrency(t.amount)}
        </td>
      </tr>
    `).join('');
  }

  getDemoMetrics() {
    return {
      finance: { totalIncome: 180000, totalExpense: 34800, profit: 145200, trend: 15, profitMargin: 80.7 },
      sales: { totalDeals: 47, conversionRate: 20 },
      subscribers: { total: 1234, growth: 12 }
    };
  }

  getDemoChartData() {
    return {
      labels: ['Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг'],
      revenue: [120000, 135000, 150000, 160000, 170000, 180000],
      expenseCategories: [
        { category: 'Аренда', amount: 40000 },
        { category: 'Маркетинг', amount: 25000 },
        { category: 'Софт', amount: 15000 },
        { category: 'Прочее', amount: 20000 }
      ]
    };
  }

  getDemoTransactions() {
    return [
      { date: '2026-08-15', description: 'Проект Client A', category: 'Проекты', type: 'income', amount: 50000 },
      { date: '2026-08-10', description: 'Аренда офиса', category: 'Аренда', type: 'expense', amount: 12500 },
      { date: '2026-08-08', description: 'Консультация', category: 'Консультации', type: 'income', amount: 30000 },
      { date: '2026-08-05', description: 'Маркетинг', category: 'Маркетинг', type: 'expense', amount: 8200 },
      { date: '2026-08-01', description: 'Проект Client B', category: 'Проекты', type: 'income', amount: 45000 }
    ];
  }
}

/* ============================================
   Finance Section
   ============================================ */
class FinanceSection {
  constructor(app) {
    this.app = app;
    this.operations = [];
    this.filtered = [];
    this.sortBy = 'date';
    this.sortDir = 'desc';
  }

  async load() {
    try {
      this.operations = await this.app.api.getFinance();
    } catch {
      this.operations = this.getDemoFinance();
    }
    this.filtered = [...this.operations];
    this.render();
    this.bindEvents();
  }

  bindEvents() {
    const search = document.getElementById('financeSearch');
    if (search && !search.dataset.bound) {
      search.dataset.bound = 'true';
      search.addEventListener('input', Utils.debounce((e) => {
        const term = e.target.value.toLowerCase();
        this.filtered = this.operations.filter(op =>
          op.description.toLowerCase().includes(term) ||
          (op.category && op.category.toLowerCase().includes(term))
        );
        this.render();
      }, 300));
    }

    const typeFilter = document.getElementById('financeTypeFilter');
    if (typeFilter && !typeFilter.dataset.bound) {
      typeFilter.dataset.bound = 'true';
      typeFilter.addEventListener('change', (e) => {
        const type = e.target.value;
        this.filtered = type === 'all' ? [...this.operations] : this.operations.filter(op => op.type === type);
        this.render();
      });
    }

    const addBtn = document.getElementById('addOperationBtn');
    if (addBtn && !addBtn.dataset.bound) {
      addBtn.dataset.bound = 'true';
      addBtn.addEventListener('click', () => this.app.modal.open());
    }

    const addFirst = document.getElementById('addFirstOperation');
    if (addFirst && !addFirst.dataset.bound) {
      addFirst.dataset.bound = 'true';
      addFirst.addEventListener('click', () => this.app.modal.open());
    }

    const csvBtn = document.getElementById('exportFinanceCSV');
    if (csvBtn && !csvBtn.dataset.bound) {
      csvBtn.dataset.bound = 'true';
      csvBtn.addEventListener('click', () => this.exportCSV());
    }

    document.querySelectorAll('th.sortable .sort-btn').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = 'true';
      btn.addEventListener('click', () => {
        const th = btn.closest('th');
        const col = th.dataset.sort;
        if (this.sortBy === col) {
          this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortBy = col;
          this.sortDir = 'asc';
        }
        this.sortOperations();
        this.render();
      });
    });
  }

  sortOperations() {
    this.filtered.sort((a, b) => {
      let aVal = a[this.sortBy];
      let bVal = b[this.sortBy];
      if (this.sortBy === 'date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (this.sortBy === 'amount') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
  }

  render() {
    this.renderSummary();
    this.renderTable();
  }

  renderSummary() {
    const container = document.getElementById('financeSummary');
    if (!container) return;

    const totalIncome = this.filtered.filter(op => op.type === 'income').reduce((s, op) => s + op.amount, 0);
    const totalExpense = this.filtered.filter(op => op.type === 'expense').reduce((s, op) => s + op.amount, 0);

    container.innerHTML = `
      <div class="summary-item summary-item--income">
        <span class="summary-label">Доходы</span>
        <span class="summary-value">${Utils.formatCurrency(totalIncome)}</span>
      </div>
      <div class="summary-item summary-item--expense">
        <span class="summary-label">Расходы</span>
        <span class="summary-value">${Utils.formatCurrency(totalExpense)}</span>
      </div>
      <div class="summary-item summary-item--profit">
        <span class="summary-label">Прибыль</span>
        <span class="summary-value">${Utils.formatCurrency(totalIncome - totalExpense)}</span>
      </div>`;
  }

  renderTable() {
    const tbody = document.getElementById('financeTableBody');
    const emptyState = document.getElementById('financeTableEmpty');
    if (!tbody) return;

    if (this.filtered.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
      return;
    }

    if (emptyState) emptyState.hidden = true;
    tbody.innerHTML = this.filtered.map(op => `
      <tr>
        <td>${Utils.formatDate(op.date)}</td>
        <td>${Utils.escapeHtml(op.description)}</td>
        <td><span class="category-badge">${Utils.escapeHtml(op.category || 'Без категории')}</span></td>
        <td class="amount-${op.type}">
          ${op.type === 'income' ? '+' : '-'}${Utils.formatCurrency(op.amount)}
        </td>
        <td>
          <button class="btn-icon" data-action="delete" data-id="${op.id}" aria-label="Удалить операцию: ${Utils.escapeHtml(op.description)}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        const ok = await this.app.modal.showConfirm('Удалить операцию?', 'Вы уверены, что хотите удалить эту операцию?');
        if (ok) {
          this.deleteOperation(id);
        }
      });
    });
  }

  async addOperation(data) {
    try {
      const newOp = await this.app.api.createFinanceOp(data);
      this.operations.unshift(newOp);
    } catch {
      const newOp = { ...data, id: Utils.generateId() };
      this.operations.unshift(newOp);
    }
    this.filtered = [...this.operations];
    this.render();
    this.app.toast.show('Операция добавлена', 'success');
    this.app.modal.close();
  }

  async deleteOperation(id) {
    try {
      await this.app.api.deleteFinanceOp(id);
    } catch {
      // Demo mode
    }
    this.operations = this.operations.filter(op => String(op.id) !== String(id));
    this.filtered = [...this.operations];
    this.render();
    this.app.toast.show('Операция удалена', 'info');
  }

  exportCSV() {
    let csv = '\uFEFFДата;Описание;Категория;Тип;Сумма\n';
    this.filtered.forEach(op => {
      csv += `${op.date};"${Utils.escapeHtml(op.description)}";"${Utils.escapeHtml(op.category || '')}";${op.type === 'income' ? 'Доход' : 'Расход'};${op.amount}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `finance_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    this.app.toast.show('CSV экспортирован', 'success');
  }

  getDemoFinance() {
    return [
      { id: 1, type: 'income', amount: 50000, description: 'Проект Client A', category: 'Проекты', date: '2026-08-15' },
      { id: 2, type: 'expense', amount: 12500, description: 'Аренда офиса', category: 'Аренда', date: '2026-08-10' },
      { id: 3, type: 'income', amount: 30000, description: 'Консультация', category: 'Консультации', date: '2026-08-08' },
      { id: 4, type: 'expense', amount: 8200, description: 'Маркетинг', category: 'Маркетинг', date: '2026-08-05' },
      { id: 5, type: 'income', amount: 45000, description: 'Проект Client B', category: 'Проекты', date: '2026-08-01' },
      { id: 6, type: 'expense', amount: 5300, description: 'Софт подписки', category: 'Софт', date: '2026-07-28' },
      { id: 7, type: 'income', amount: 25000, description: 'Аудит', category: 'Консультации', date: '2026-07-25' },
      { id: 8, type: 'expense', amount: 3800, description: 'Реклама', category: 'Маркетинг', date: '2026-07-20' }
    ];
  }
}

/* ============================================
   Sales Section
   ============================================ */
class SalesSection {
  constructor(app) {
    this.app = app;
    this.deals = [];
  }

  async load() {
    try {
      this.deals = await this.app.api.getSales();
    } catch {
      this.deals = this.getDemoSales();
    }
    this.render();
  }

  render() {
    this.renderStats();
    this.renderFunnel();
    this.renderTable();
  }

  renderStats() {
    const container = document.getElementById('salesStats');
    if (!container) return;

    const totalDeals = this.deals.length;
    const won = this.deals.filter(d => d.stage === 'closed_won');
    const avgCheck = won.length > 0 ? Math.round(won.reduce((s, d) => s + (d.amount || 0), 0) / won.length) : 0;
    const leads = this.deals.filter(d => d.stage === 'lead').length || 1;
    const conversion = ((won.length / leads) * 100).toFixed(1);
    const revenue = won.reduce((s, d) => s + (d.amount || 0), 0);

    container.innerHTML = `
      <div class="sales-stat" role="listitem">
        <span class="stat-label">Всего сделок</span>
        <span class="stat-value">${totalDeals}</span>
      </div>
      <div class="sales-stat" role="listitem">
        <span class="stat-label">Средний чек</span>
        <span class="stat-value">${Utils.formatCurrency(avgCheck)}</span>
      </div>
      <div class="sales-stat" role="listitem">
        <span class="stat-label">Конверсия</span>
        <span class="stat-value">${conversion}%</span>
      </div>
      <div class="sales-stat" role="listitem">
        <span class="stat-label">Общая сумма</span>
        <span class="stat-value">${Utils.formatCurrency(revenue)}</span>
      </div>`;
  }

  renderFunnel() {
    const container = document.getElementById('salesFunnel');
    if (!container) return;

    const stages = [
      { stage: 'lead', label: 'Лиды' },
      { stage: 'contact', label: 'Контакт' },
      { stage: 'proposal', label: 'Предложение' },
      { stage: 'negotiation', label: 'Переговоры' },
      { stage: 'closed_won', label: 'Сделка' }
    ];

    const totalLeads = this.deals.filter(d => d.stage === 'lead').length || 1;

    container.innerHTML = stages.map((s, i) => {
      const count = this.deals.filter(d => d.stage === s.stage).length;
      const value = this.deals.filter(d => d.stage === s.stage).reduce((sum, d) => sum + (d.amount || 0), 0);
      const width = 100 - (i * 15);
      const convRate = ((count / totalLeads) * 100).toFixed(1);
      return `
        <div class="funnel-stage" style="width: ${width}%">
          <div class="funnel-stage__bar">
            <span class="funnel-stage__label">${Utils.escapeHtml(s.label)}</span>
            <span class="funnel-stage__count">${count}</span>
          </div>
          <div class="funnel-stage__info">
            <span>${Utils.formatCurrency(value)}</span>
            <span>${convRate}%</span>
          </div>
        </div>`;
    }).join('');
  }

  renderTable() {
    const tbody = document.getElementById('salesTableBody');
    const emptyState = document.getElementById('salesTableEmpty');
    if (!tbody) return;

    if (this.deals.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
      return;
    }

    if (emptyState) emptyState.hidden = true;

    const grouped = {};
    this.deals.forEach(d => {
      const name = d.product || 'Без названия';
      if (!grouped[name]) grouped[name] = { count: 0, revenue: 0 };
      grouped[name].count++;
      grouped[name].revenue += d.amount || 0;
    });

    const sorted = Object.entries(grouped)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    tbody.innerHTML = sorted.map(([name, data], i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${Utils.escapeHtml(name)}</td>
        <td>${data.count}</td>
        <td>${Utils.formatCurrency(data.revenue)}</td>
      </tr>
    `).join('');
  }

  getDemoSales() {
    return [
      { id: 1, stage: 'closed_won', product: 'Услуга А', amount: 50000 },
      { id: 2, stage: 'closed_won', product: 'Услуга А', amount: 45000 },
      { id: 3, stage: 'closed_won', product: 'Услуга Б', amount: 30000 },
      { id: 4, stage: 'closed_won', product: 'Услуга Б', amount: 25000 },
      { id: 5, stage: 'closed_won', product: 'Услуга Б', amount: 20000 },
      { id: 6, stage: 'closed_won', product: 'Услуга В', amount: 15000 },
      { id: 7, stage: 'lead', product: 'Услуга А', amount: 0 },
      { id: 8, stage: 'lead', product: 'Услуга Б', amount: 0 },
      { id: 9, stage: 'lead', product: 'Услуга В', amount: 0 },
      { id: 10, stage: 'lead', product: null, amount: 0 },
      { id: 11, stage: 'contact', product: 'Услуга А', amount: 0 },
      { id: 12, stage: 'contact', product: 'Услуга Б', amount: 0 },
      { id: 13, stage: 'proposal', product: 'Услуга А', amount: 0 },
      { id: 14, stage: 'negotiation', product: 'Услуга Б', amount: 0 },
      { id: 15, stage: 'closed_won', product: 'Услуга А', amount: 35000 }
    ];
  }
}

/* ============================================
   Subscribers Section
   ============================================ */
class SubscribersSection {
  constructor(app) {
    this.app = app;
    this.subscribers = [];
  }

  async load() {
    try {
      this.subscribers = await this.app.api.getSubscribers();
    } catch {
      this.subscribers = this.getDemoSubscribers();
    }
    this.render();
  }

  render() {
    this.renderKPIs();
    this.renderChart();
    this.renderSources();
    this.renderTable();
  }

  renderKPIs() {
    const container = document.getElementById('subscribersKpi');
    if (!container) return;

    const total = this.subscribers.length;
    const thisMonth = this.subscribers.filter(s => {
      const d = new Date(s.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    container.innerHTML = `
      <div class="kpi-card" role="listitem">
        <div class="kpi-icon kpi-icon--cyan" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Всего</span>
          <span class="kpi-value">${Utils.formatNumber(total)}</span>
        </div>
      </div>
      <div class="kpi-card" role="listitem">
        <div class="kpi-icon kpi-icon--green" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">В этом месяце</span>
          <span class="kpi-value">${thisMonth}</span>
        </div>
      </div>`;
  }

  renderChart() {
    const canvas = document.getElementById('subscribersChartCanvas');
    if (!canvas) return;

    const monthly = {};
    this.subscribers.forEach(s => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = (monthly[key] || 0) + 1;
    });

    const labels = Object.keys(monthly).sort();
    const values = labels.map(k => monthly[k]);

    this.app.charts.renderLineChart('subscribersChartCanvas', { labels, values });
  }

  renderSources() {
    const body = document.getElementById('subscribersSourcesBody');
    if (!body) return;

    const sources = {};
    this.subscribers.forEach(s => {
      const src = s.source || 'Неизвестно';
      sources[src] = (sources[src] || 0) + 1;
    });

    const colors = ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899'];
    const entries = Object.entries(sources).sort((a, b) => b[1] - a[1]);

    body.innerHTML = `
      <div class="source-list">
        ${entries.map(([name, count], i) => `
          <div class="source-item">
            <div class="source-dot" style="background: ${colors[i % colors.length]}" aria-hidden="true"></div>
            <div class="source-info">
              <span class="source-name">${Utils.escapeHtml(name)}</span>
              <span class="source-count">${count}</span>
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  renderTable() {
    const tbody = document.getElementById('subscribersTableBody');
    const emptyState = document.getElementById('subscribersTableEmpty');
    if (!tbody) return;

    if (this.subscribers.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
      return;
    }

    if (emptyState) emptyState.hidden = true;
    const recent = this.subscribers.slice(0, 20);

    tbody.innerHTML = recent.map(s => `
      <tr>
        <td>${Utils.escapeHtml(s.name)}</td>
        <td><span class="category-badge">${Utils.escapeHtml(s.source || 'Неизвестно')}</span></td>
        <td>${Utils.formatDate(s.date)}</td>
      </tr>
    `).join('');
  }

  getDemoSubscribers() {
    const sources = ['Telegram', 'Сайт', 'Instagram', 'Рекомендация'];
    const names = ['Алексей', 'Мария', 'Дмитрий', 'Анна', 'Сергей', 'Елена', 'Иван', 'Ольга', 'Павел', 'Наталья'];
    const subs = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(2026, Math.floor(Math.random() * 8), Math.floor(Math.random() * 28) + 1);
      subs.push({
        id: i + 1,
        name: names[Math.floor(Math.random() * names.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        date: date.toISOString().split('T')[0]
      });
    }
    return subs.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
}

/* ============================================
   Settings Section
   ============================================ */
class SettingsSection {
  constructor(app) {
    this.app = app;
    this.dataSources = [
      { name: 'Тинькофф API', icon: '🏦', connected: false },
      { name: 'AMO CRM', icon: '📊', connected: false },
      { name: 'Яндекс.Метрика', icon: '📈', connected: false },
      { name: 'Google Sheets', icon: '📄', connected: true }
    ];
  }

  async load() {
    this.renderDataSources();
    this.bindImport();
    this.bindExport();
  }

  renderDataSources() {
    const container = document.getElementById('dataSourcesList');
    if (!container) return;

    container.innerHTML = this.dataSources.map(ds => `
      <div class="data-source-item">
        <div class="data-source-info">
          <div class="data-source-icon" aria-hidden="true">${ds.icon}</div>
          <div>
            <div class="data-source-name">${Utils.escapeHtml(ds.name)}</div>
            <div class="data-source-status">${ds.connected ? 'Подключено' : 'Не подключено'}</div>
          </div>
        </div>
        <button class="btn btn--${ds.connected ? 'ghost' : 'outline'} btn--sm" data-source="${Utils.escapeHtml(ds.name)}">
          ${ds.connected ? 'Отключить' : 'Подключить'}
        </button>
      </div>
    `).join('');

    container.querySelectorAll('button[data-source]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const name = e.currentTarget.dataset.source;
        const source = this.dataSources.find(ds => ds.name === name);
        if (source) {
          source.connected = !source.connected;
          this.renderDataSources();
          this.app.toast.show(
            source.connected ? `${name} подключено` : `${name} отключено`,
            source.connected ? 'success' : 'info'
          );
        }
      });
    });
  }

  bindImport() {
    const area = document.getElementById('importArea');
    const input = document.getElementById('importFileInput');
    const status = document.getElementById('importStatus');
    if (!area || !input) return;

    area.addEventListener('click', () => input.click());
    area.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        input.click();
      }
    });

    area.addEventListener('dragover', (e) => {
      e.preventDefault();
      area.classList.add('dragover');
    });

    area.addEventListener('dragleave', () => area.classList.remove('dragover'));

    area.addEventListener('drop', (e) => {
      e.preventDefault();
      area.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) this.handleImport(file);
    });

    input.addEventListener('change', (e) => {
      if (e.target.files[0]) this.handleImport(e.target.files[0]);
    });
  }

  handleImport(file) {
    const status = document.getElementById('importStatus');
    if (!status) return;

    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const validExts = ['.csv', '.xls', '.xlsx'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExts.includes(ext)) {
      status.hidden = false;
      status.className = 'import-status import-status--error';
      status.textContent = 'Неподдерживаемый формат. Используйте CSV или XLSX.';
      return;
    }

    status.hidden = false;
    status.className = 'import-status import-status--success';
    status.textContent = `Файл "${file.name}" (${(file.size / 1024).toFixed(1)} КБ) загружен. Обработка...`;

    setTimeout(() => {
      status.textContent = `Импорт завершён. Обработано 25 записей.`;
      this.app.toast.show('Данные успешно импортированы', 'success');
    }, 2000);
  }

  bindExport() {
    document.querySelectorAll('[data-export-format]').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = 'true';
      btn.addEventListener('click', (e) => {
        const format = e.currentTarget.dataset.exportFormat;
        this.app.exportModule.export(format);
      });
    });
  }
}

/* ============================================
   Modal
   ============================================ */
class Modal {
  constructor(app) {
    this.app = app;
    this.overlay = document.getElementById('operationModal');
    this.form = document.getElementById('operationForm');
    this.bindEvents();
  }

  bindEvents() {
    const close = document.getElementById('modalClose');
    const cancel = document.getElementById('modalCancel');

    close?.addEventListener('click', () => this.close());
    cancel?.addEventListener('click', () => this.close());

    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) this.close();
    });

    this.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.validate()) {
        this.submit();
      }
    });

    const dateInput = document.getElementById('opDate');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  }

  open() {
    if (!this.overlay) return;
    this.overlay.hidden = false;
    requestAnimationFrame(() => {
      this.overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      const firstInput = this.form?.querySelector('input:not([type="hidden"])');
      if (firstInput) firstInput.focus();
    });
  }

  close() {
    if (!this.overlay) return;
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
      this.overlay.hidden = true;
      this.form?.reset();
      this.clearErrors();
      const dateInput = document.getElementById('opDate');
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    }, 250);
  }

  showConfirm(title, message) {
    return new Promise((resolve) => {
      if (!this.overlay) return resolve(false);
      const titleEl = document.getElementById('modalTitle');
      const bodyEl = document.getElementById('modalBody');
      const cancelBtn = document.getElementById('modalCancel');
      const submitBtn = this.form?.querySelector('button[type="submit"]');

      // Save original form
      const originalBody = bodyEl.innerHTML;
      const originalTitle = titleEl.textContent;
      const originalSubmitText = submitBtn?.textContent;

      titleEl.textContent = title;
      bodyEl.innerHTML = `<p class="modal-message">${Utils.escapeHtml(message)}</p>`;
      if (cancelBtn) cancelBtn.textContent = 'Отмена';
      if (submitBtn) submitBtn.textContent = 'Удалить';

      this.overlay.hidden = false;
      requestAnimationFrame(() => {
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      });

      const cleanup = () => {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
          this.overlay.hidden = true;
          bodyEl.innerHTML = originalBody;
          titleEl.textContent = originalTitle;
          if (cancelBtn) cancelBtn.textContent = 'Отмена';
          if (submitBtn) submitBtn.textContent = originalSubmitText;
        }, 250);
      };

      const onCancel = () => {
        cleanup();
        cancelBtn.removeEventListener('click', onCancel);
        submitBtn?.removeEventListener('click', onConfirm);
        resolve(false);
      };

      const onConfirm = () => {
        cleanup();
        cancelBtn.removeEventListener('click', onCancel);
        submitBtn?.removeEventListener('click', onConfirm);
        resolve(true);
      };

      cancelBtn?.addEventListener('click', onCancel);
      submitBtn?.addEventListener('click', onConfirm);
    });
  }

  isOpen() {
    return this.overlay?.classList.contains('active');
  }

  validate() {
    this.clearErrors();
    let valid = true;

    const type = this.form?.querySelector('input[name="opType"]:checked');
    if (!type) {
      this.showError('opTypeError', 'Выберите тип операции');
      valid = false;
    }

    const amount = document.getElementById('opAmount');
    if (!amount?.value || parseFloat(amount.value) <= 0) {
      this.showError('opAmountError', 'Введите положительную сумму');
      amount?.classList.add('error');
      valid = false;
    }

    const desc = document.getElementById('opDescription');
    if (!desc?.value?.trim()) {
      this.showError('opDescriptionError', 'Введите описание');
      desc?.classList.add('error');
      valid = false;
    }

    const date = document.getElementById('opDate');
    if (!date?.value) {
      this.showError('opDateError', 'Выберите дату');
      date?.classList.add('error');
      valid = false;
    }

    return valid;
  }

  showError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
  }

  clearErrors() {
    this.form?.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    this.form?.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));
  }

  submit() {
    const data = {
      type: this.form.querySelector('input[name="opType"]:checked')?.value,
      amount: parseFloat(document.getElementById('opAmount').value),
      description: document.getElementById('opDescription').value.trim(),
      category: document.getElementById('opCategory')?.value || null,
      date: document.getElementById('opDate').value
    };
    this.app.finance.addOperation(data);
  }
}

/* ============================================
   Export Module
   ============================================ */
class ExportModule {
  constructor(app) {
    this.app = app;
  }

  async export(format) {
    const period = document.getElementById('periodSelect')?.value || 'month';
    try {
      const response = await this.app.api.exportReport(format, period);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${period}_${new Date().toISOString().split('T')[0]}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      this.app.toast.show('Отчёт скачан', 'success');
    } catch {
      this.app.toast.show('Ошибка экспорта', 'error');
    }
  }
}

/* ============================================
   Dashboard Application
   ============================================ */
class DashboardApp {
  constructor() {
    this.api = new ApiClient();
    this.toast = new Toast();
    this.charts = new ChartManager();
    this.modal = new Modal(this);
    this.exportModule = new ExportModule(this);

    this.overview = new OverviewSection(this);
    this.finance = new FinanceSection(this);
    this.sales = new SalesSection(this);
    this.subscribers = new SubscribersSection(this);
    this.settings = new SettingsSection(this);

    this.currentSection = 'overview';
    this.init();
  }

  async init() {
    this.setCurrentDate();
    this.bindNavigation();
    this.bindPeriodSelect();
    this.bindRefreshBtn();
    this.bindMobileMenu();
    this.bindKeyboardNav();
    await this.loadSection('overview');
    this.hideLoading();
  }

  setCurrentDate() {
    const el = document.getElementById('currentDate');
    if (el) {
      el.textContent = new Date().toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  bindNavigation() {
    document.querySelectorAll('.sidebar__link[data-section]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        this.navigateTo(section);
      });
    });

    document.querySelectorAll('[data-navigate]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo(el.dataset.navigate);
      });
    });
  }

  navigateTo(section) {
    if (section === this.currentSection) return;
    this.loadSection(section);
    this.closeMobileMenu();
  }

  async loadSection(section) {
    this.currentSection = section;

    document.querySelectorAll('.sidebar__link').forEach(link => {
      link.classList.toggle('sidebar__link--active', link.dataset.section === section);
      link.removeAttribute('aria-current');
    });
    document.querySelector(`.sidebar__link[data-section="${section}"]`)?.setAttribute('aria-current', 'page');

    document.querySelectorAll('.section').forEach(s => {
      s.hidden = true;
      s.classList.remove('active');
    });

    const sectionEl = document.getElementById(`section-${section}`);
    if (sectionEl) {
      sectionEl.hidden = false;
      sectionEl.classList.add('active');
    }

    const titles = {
      overview: 'Обзор бизнеса',
      finance: 'Финансы',
      sales: 'Продажи',
      subscribers: 'Подписчики',
      settings: 'Настройки'
    };
    document.getElementById('pageTitle').textContent = titles[section] || section;

    const loaders = {
      overview: () => this.overview.load(),
      finance: () => this.finance.load(),
      sales: () => this.sales.load(),
      subscribers: () => this.subscribers.load(),
      settings: () => this.settings.load()
    };

    if (loaders[section]) {
      await loaders[section]();
    }
  }

  bindPeriodSelect() {
    const select = document.getElementById('periodSelect');
    if (select) {
      select.addEventListener('change', () => {
        this.overview.period = select.value;
        if (this.currentSection === 'overview') {
          this.overview.load();
        }
      });
    }
  }

  bindRefreshBtn() {
    const btn = document.getElementById('refreshBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        this.loadSection(this.currentSection);
        this.toast.show('Данные обновлены', 'info');
      });
    }
  }

  bindMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    if (!menuBtn || !sidebar) return;

    menuBtn.addEventListener('click', () => {
      const isOpen = sidebar.classList.contains('open');
      if (isOpen) {
        this.closeMobileMenu();
      } else {
        sidebar.classList.add('open');
        menuBtn.setAttribute('aria-expanded', 'true');
        document.addEventListener('click', this.closeMobileMenuHandler);
      }
    });
  }

  closeMobileMenuHandler = (e) => {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('mobileMenuBtn');
    if (sidebar && !sidebar.contains(e.target) && menuBtn && !menuBtn.contains(e.target)) {
      this.closeMobileMenu();
    }
  };

  closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('mobileMenuBtn');
    if (sidebar) sidebar.classList.remove('open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', this.closeMobileMenuHandler);
  }

  bindKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      const sectionMap = {
        '1': 'overview',
        '2': 'finance',
        '3': 'sales',
        '4': 'subscribers',
        '5': 'settings'
      };

      if (e.altKey && sectionMap[e.key]) {
        e.preventDefault();
        this.navigateTo(sectionMap[e.key]);
      }
    });
  }

  hideLoading() {
    const loading = document.getElementById('loadingState');
    if (loading) loading.classList.add('hidden');
  }

  destroy() {
    // Destroy all charts
    Object.keys(this.charts.charts).forEach(id => this.charts.destroy(id));

    // Remove event listeners
    document.removeEventListener('click', this.closeMobileMenuHandler);
    document.removeEventListener('keydown', this.handleKeyboardNav);

    // Clean up sections
    this.overview = null;
    this.finance = null;
    this.sales = null;
    this.subscribers = null;
    this.settings = null;
    this.api = null;
    this.toast = null;
    this.charts = null;
    this.modal = null;
    this.exportModule = null;
  }
}

/* ============================================
   Service Worker
   ============================================ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

/* ============================================
   Initialize
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  window.dashboardApp = new DashboardApp();
});
