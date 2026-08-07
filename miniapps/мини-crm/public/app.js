/* ================================
   Mini CRM Application
   ================================ */

'use strict';

// ==================== Utilities ====================
const Utils = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const day = d.getDate();
        const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
        return `${day} ${months[d.getMonth()]}`;
    },

    formatDateTime(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const day = d.getDate();
        const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${day} ${months[d.getMonth()]} ${hours}:${mins}`;
    },

    formatCurrency(value) {
        if (value === undefined || value === null) return '0 ₽';
        return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
    },

    getRelativeTime(dateStr) {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'только что';
        if (diffMins < 60) return `${diffMins} мин назад`;
        if (diffHours < 24) return `${diffHours} ч назад`;
        if (diffDays < 7) return `${diffDays} дн назад`;
        return Utils.formatDate(dateStr);
    },

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    debounce(fn, ms = 300) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    },

    getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    },

    getAvatarColor(name) {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    },

    today() {
        return new Date().toISOString().split('T')[0];
    },

    isToday(dateStr) {
        return dateStr === Utils.today();
    },

    isOverdue(dateStr) {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date(Utils.today());
    }
};

// ==================== Data Store ====================
class Store {
    constructor() {
        this.listeners = {};
        this.state = {
            contacts: [],
            deals: [],
            tasks: [],
            activities: [],
            pipelineStages: [
                { id: 'lead', name: 'Лиды', color: '#6366f1', order: 0 },
                { id: 'proposal', name: 'Переговоры', color: '#f59e0b', order: 1 },
                { id: 'negotiation', name: 'Оффер', color: '#3b82f6', order: 2 },
                { id: 'closed_won', name: 'Закрыто', color: '#10b981', order: 3 },
                { id: 'closed_lost', name: 'Потеряно', color: '#ef4444', order: 4 }
            ],
            settings: {
                darkMode: false,
                notifications: true
            }
        };
        this.load();
    }

    load() {
        try {
            const data = localStorage.getItem('miniCrm');
            if (data) {
                const parsed = JSON.parse(data);
                this.state.contacts = parsed.contacts || [];
                this.state.deals = parsed.deals || [];
                this.state.tasks = parsed.tasks || [];
                this.state.activities = parsed.activities || [];
                this.state.settings = { ...this.state.settings, ...parsed.settings };
            }
        } catch (e) {
            // Data corrupt or unavailable
        }
    }

    save() {
        try {
            localStorage.setItem('miniCrm', JSON.stringify({
                contacts: this.state.contacts,
                deals: this.state.deals,
                tasks: this.state.tasks,
                activities: this.state.activities,
                settings: this.state.settings
            }));
        } catch (e) {
            // Storage full or unavailable
        }
    }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        (this.listeners[event] || []).forEach(cb => cb(data));
    }

    // Contacts
    addContact(contact) {
        const newContact = {
            id: Utils.generateId(),
            name: contact.name || '',
            email: contact.email || '',
            phone: contact.phone || '',
            company: contact.company || '',
            position: contact.position || '',
            notes: contact.notes || '',
            tags: contact.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.state.contacts.unshift(newContact);
        this.save();
        this.emit('contacts:changed');
        this.addActivity('contact_created', `Создан контакт "${newContact.name}"`);
        return newContact;
    }

    updateContact(id, updates) {
        const idx = this.state.contacts.findIndex(c => c.id === id);
        if (idx === -1) return null;
        this.state.contacts[idx] = { ...this.state.contacts[idx], ...updates, updatedAt: new Date().toISOString() };
        this.save();
        this.emit('contacts:changed');
        return this.state.contacts[idx];
    }

    deleteContact(id) {
        const contact = this.state.contacts.find(c => c.id === id);
        this.state.contacts = this.state.contacts.filter(c => c.id !== id);
        this.state.deals.forEach(d => { if (d.contactId === id) d.contactId = null; });
        this.save();
        this.emit('contacts:changed');
        this.emit('deals:changed');
        if (contact) this.addActivity('contact_deleted', `Удалён контакт "${contact.name}"`);
    }

    getContact(id) {
        return this.state.contacts.find(c => c.id === id);
    }

    searchContacts(query) {
        const q = query.toLowerCase();
        return this.state.contacts.filter(c =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q) ||
            (c.phone || '').includes(q) ||
            (c.company || '').toLowerCase().includes(q)
        );
    }

    // Deals
    addDeal(deal) {
        const newDeal = {
            id: Utils.generateId(),
            contactId: deal.contactId || null,
            title: deal.title || '',
            value: parseInt(deal.value) || 0,
            stage: deal.stage || 'lead',
            currency: 'RUB',
            expectedClose: deal.expectedClose || '',
            notes: deal.notes || '',
            tags: deal.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.state.deals.unshift(newDeal);
        this.save();
        this.emit('deals:changed');
        this.addActivity('deal_created', `Создана сделка "${newDeal.title}"`);
        return newDeal;
    }

    updateDeal(id, updates) {
        const idx = this.state.deals.findIndex(d => d.id === id);
        if (idx === -1) return null;
        const oldStage = this.state.deals[idx].stage;
        this.state.deals[idx] = { ...this.state.deals[idx], ...updates, updatedAt: new Date().toISOString() };
        if (updates.stage && updates.stage !== oldStage) {
            const stageName = this.getStageName(updates.stage);
            this.addActivity('deal_stage_changed', `Сделка "${this.state.deals[idx].title}" перемещена в "${stageName}"`);
        }
        this.save();
        this.emit('deals:changed');
        return this.state.deals[idx];
    }

    deleteDeal(id) {
        const deal = this.state.deals.find(d => d.id === id);
        this.state.deals = this.state.deals.filter(d => d.id !== id);
        this.save();
        this.emit('deals:changed');
        if (deal) this.addActivity('deal_deleted', `Удалена сделка "${deal.title}"`);
    }

    getDeal(id) {
        return this.state.deals.find(d => d.id === id);
    }

    getDealsByStage(stage) {
        return this.state.deals.filter(d => d.stage === stage);
    }

    getStageName(stageId) {
        const stage = this.state.pipelineStages.find(s => s.id === stageId);
        return stage ? stage.name : stageId;
    }

    getStageColor(stageId) {
        const stage = this.state.pipelineStages.find(s => s.id === stageId);
        return stage ? stage.color : '#6366f1';
    }

    // Tasks
    addTask(task) {
        const newTask = {
            id: Utils.generateId(),
            dealId: task.dealId || null,
            contactId: task.contactId || null,
            title: task.title || '',
            description: task.description || '',
            priority: task.priority || 'medium',
            status: task.status || 'pending',
            dueDate: task.dueDate || '',
            dueTime: task.dueTime || '',
            completedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.state.tasks.unshift(newTask);
        this.save();
        this.emit('tasks:changed');
        this.addActivity('task_created', `Создана задача "${newTask.title}"`);
        return newTask;
    }

    updateTask(id, updates) {
        const idx = this.state.tasks.findIndex(t => t.id === id);
        if (idx === -1) return null;
        if (updates.status === 'completed' && this.state.tasks[idx].status !== 'completed') {
            updates.completedAt = new Date().toISOString();
        }
        this.state.tasks[idx] = { ...this.state.tasks[idx], ...updates, updatedAt: new Date().toISOString() };
        this.save();
        this.emit('tasks:changed');
        return this.state.tasks[idx];
    }

    deleteTask(id) {
        const task = this.state.tasks.find(t => t.id === id);
        this.state.tasks = this.state.tasks.filter(t => t.id !== id);
        this.save();
        this.emit('tasks:changed');
        if (task) this.addActivity('task_deleted', `Удалена задача "${task.title}"`);
    }

    getTask(id) {
        return this.state.tasks.find(t => t.id === id);
    }

    getTodayTasks() {
        return this.state.tasks.filter(t =>
            t.status !== 'completed' && t.status !== 'cancelled' &&
            (Utils.isToday(t.dueDate) || !t.dueDate)
        );
    }

    getPendingTasks() {
        return this.state.tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
    }

    getCompletedTasks() {
        return this.state.tasks.filter(t => t.status === 'completed');
    }

    // Activities
    addActivity(type, description) {
        const activity = {
            id: Utils.generateId(),
            type,
            description,
            createdAt: new Date().toISOString()
        };
        this.state.activities.unshift(activity);
        if (this.state.activities.length > 100) {
            this.state.activities = this.state.activities.slice(0, 100);
        }
        this.save();
        this.emit('activities:changed');
    }

    getRecentActivities(limit = 20) {
        return this.state.activities.slice(0, limit);
    }

    // Stats
    getStats() {
        const deals = this.state.deals;
        const activeDeals = deals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost');
        const closedDeals = deals.filter(d => d.stage === 'closed_won');
        const totalRevenue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
        const closedRevenue = closedDeals.reduce((sum, d) => sum + (d.value || 0), 0);
        const todayTasks = this.getTodayTasks();
        const completedTasks = this.getCompletedTasks();
        const allTasks = this.state.tasks;
        const taskCompletion = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;

        return {
            contactsCount: this.state.contacts.length,
            activeDealsCount: activeDeals.length,
            totalDealsCount: deals.length,
            totalRevenue,
            closedRevenue,
            todayTasksCount: todayTasks.length,
            taskCompletion
        };
    }

    getPipelineStats() {
        return this.state.pipelineStages.map(stage => ({
            ...stage,
            count: this.getDealsByStage(stage.id).length,
            value: this.getDealsByStage(stage.id).reduce((sum, d) => sum + (d.value || 0), 0)
        }));
    }

    clearAll() {
        this.state.contacts = [];
        this.state.deals = [];
        this.state.tasks = [];
        this.state.activities = [];
        this.save();
        this.emit('contacts:changed');
        this.emit('deals:changed');
        this.emit('tasks:changed');
        this.emit('activities:changed');
    }
}

// ==================== Toast Notifications ====================
class Toast {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    show(message, type = 'info', duration = 3000) {
        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${Utils.escapeHtml(message)}</span>
            <button class="toast-close" aria-label="Закрыть">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
        `;

        toast.querySelector('.toast-close').addEventListener('click', () => this.remove(toast));
        this.container.appendChild(toast);

        setTimeout(() => this.remove(toast), duration);
        return toast;
    }

    remove(toast) {
        if (!toast.parentNode) return;
        toast.classList.add('leaving');
        setTimeout(() => toast.remove(), 300);
    }

    success(msg) { return this.show(msg, 'success'); }
    error(msg) { return this.show(msg, 'error', 5000); }
    info(msg) { return this.show(msg, 'info'); }
    warning(msg) { return this.show(msg, 'warning', 4000); }
}

// ==================== Confirm Dialog ====================
class Confirm {
    constructor() {
        this.overlay = document.getElementById('confirmOverlay');
        this.titleEl = document.getElementById('confirmTitle');
        this.messageEl = document.getElementById('confirmMessage');
        this.cancelBtn = document.getElementById('confirmCancel');
        this.okBtn = document.getElementById('confirmOk');

        this.cancelBtn.addEventListener('click', () => this.close(false));
        this.okBtn.addEventListener('click', () => this.close(true));
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close(false);
        });
    }

    show(title, message, okText = 'Удалить') {
        return new Promise(resolve => {
            this.titleEl.textContent = title;
            this.messageEl.textContent = message;
            this.okBtn.textContent = okText;
            this.overlay.style.display = 'flex';
            this._resolve = resolve;
        });
    }

    close(result) {
        this.overlay.style.display = 'none';
        if (this._resolve) this._resolve(result);
    }
}

// ==================== Modal ====================
class Modal {
    constructor() {
        this.overlay = document.getElementById('modalOverlay');
        this.content = document.getElementById('modalContent');
        this.titleEl = document.getElementById('modalTitle');
        this.bodyEl = document.getElementById('modalBody');
        this.closeBtn = document.getElementById('modalClose');

        this.closeBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) this.close();
        });
    }

    open(title, contentHtml) {
        this.titleEl.textContent = title;
        this.bodyEl.innerHTML = contentHtml;
        this.overlay.style.display = 'flex';
        const firstInput = this.bodyEl.querySelector('input, select, textarea');
        if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }

    close() {
        this.overlay.style.display = 'none';
        this.bodyEl.innerHTML = '';
    }

    isOpen() {
        return this.overlay.style.display === 'flex';
    }
}

// ==================== Renderer ====================
class Renderer {
    constructor(store, toast, modal, confirm) {
        this.store = store;
        this.toast = toast;
        this.modal = modal;
        this.confirm = confirm;
        this.currentView = 'dashboard';
        this.dealsViewMode = 'kanban';
        this.taskFilter = 'all';
        this.draggedDeal = null;
    }

    init() {
        this.setupNavigation();
        this.setupMobileMenu();
        this.setupTheme();
        this.setupEventListeners();
        this.setupKeyboardNav();
        this.renderCurrentView();
        this.updateBadges();
        this.setDate();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item[data-view]');
        const bottomItems = document.querySelectorAll('.bottom-nav-item[data-view]');
        const allNavItems = [...navItems, ...bottomItems];

        allNavItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                this.navigateTo(view);
            });
        });

        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1) || 'dashboard';
            this.navigateTo(hash, false);
        });

        const hash = window.location.hash.slice(1);
        if (hash) this.navigateTo(hash, false);
    }

    navigateTo(view, updateHash = true) {
        if (this.currentView === view) return;
        this.currentView = view;

        document.querySelectorAll('.view').forEach(v => {
            v.style.display = 'none';
            v.classList.remove('active');
        });

        const targetView = document.getElementById(view + 'View');
        if (targetView) {
            targetView.style.display = 'block';
            targetView.classList.add('active');
        }

        document.querySelectorAll('.nav-item').forEach(n => {
            n.classList.remove('active');
            if (n.getAttribute('data-view') === view) n.classList.add('active');
        });

        document.querySelectorAll('.bottom-nav-item').forEach(n => {
            n.classList.remove('active');
            if (n.getAttribute('data-view') === view) n.classList.add('active');
        });

        const mobileTitle = document.getElementById('mobileTitle');
        const titles = {
            dashboard: 'Дашборд',
            contacts: 'Контакты',
            deals: 'Сделки',
            tasks: 'Задачи',
            analytics: 'Аналитика',
            settings: 'Настройки'
        };
        if (mobileTitle) mobileTitle.textContent = titles[view] || view;

        if (updateHash) window.location.hash = view;
        this.renderCurrentView();
        this.closeMobileMenu();
    }

    renderCurrentView() {
        switch (this.currentView) {
            case 'dashboard': this.renderDashboard(); break;
            case 'contacts': this.renderContacts(); break;
            case 'deals': this.renderDeals(); break;
            case 'tasks': this.renderTasks(); break;
            case 'analytics': this.renderAnalytics(); break;
            case 'settings': this.renderSettings(); break;
        }
    }

    setupMobileMenu() {
        const toggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const close = document.getElementById('sidebarClose');

        toggle.addEventListener('click', () => sidebar.classList.add('open'));
        overlay.addEventListener('click', () => this.closeMobileMenu());
        close.addEventListener('click', () => this.closeMobileMenu());
    }

    closeMobileMenu() {
        document.getElementById('sidebar').classList.remove('open');
    }

    setupTheme() {
        const darkMode = this.store.state.settings.darkMode;
        if (darkMode) document.documentElement.setAttribute('data-theme', 'dark');

        const toggle = document.getElementById('themeToggle');
        const settingsToggle = document.getElementById('darkModeToggle');

        toggle.addEventListener('click', () => this.toggleTheme());
        if (settingsToggle) {
            settingsToggle.checked = darkMode;
            settingsToggle.addEventListener('change', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            this.store.state.settings.darkMode = false;
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.store.state.settings.darkMode = true;
        }
        this.store.save();
        const settingsToggle = document.getElementById('darkModeToggle');
        if (settingsToggle) settingsToggle.checked = this.store.state.settings.darkMode;
    }

    setupEventListeners() {
        document.getElementById('addContactBtn').addEventListener('click', () => this.openContactModal());
        document.getElementById('addDealBtn').addEventListener('click', () => this.openDealModal());
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openTaskModal());

        const searchInput = document.getElementById('contactSearch');
        searchInput.addEventListener('input', Utils.debounce(() => {
            this.renderContacts(searchInput.value);
        }, 250));

        document.querySelectorAll('.view-toggle .toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-toggle .toggle-btn').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-checked', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-checked', 'true');
                this.dealsViewMode = btn.getAttribute('data-mode');
                this.renderDeals();
            });
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.taskFilter = btn.getAttribute('data-filter');
                this.renderTasks();
            });
        });

        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importDataBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });
        document.getElementById('importFileInput').addEventListener('change', (e) => this.importData(e));
        document.getElementById('clearDataBtn').addEventListener('click', () => this.clearData());

        this.store.on('contacts:changed', () => {
            this.updateBadges();
            if (this.currentView === 'contacts') this.renderContacts();
            if (this.currentView === 'dashboard') this.renderDashboard();
        });

        this.store.on('deals:changed', () => {
            this.updateBadges();
            if (this.currentView === 'deals') this.renderDeals();
            if (this.currentView === 'dashboard') this.renderDashboard();
            if (this.currentView === 'analytics') this.renderAnalytics();
        });

        this.store.on('tasks:changed', () => {
            this.updateBadges();
            if (this.currentView === 'tasks') this.renderTasks();
            if (this.currentView === 'dashboard') this.renderDashboard();
        });

        this.store.on('activities:changed', () => {
            if (this.currentView === 'dashboard') this.renderDashboard();
        });
    }

    setupKeyboardNav() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (this.modal.isOpen()) return;

            switch (e.key) {
                case '1': this.navigateTo('dashboard'); break;
                case '2': this.navigateTo('contacts'); break;
                case '3': this.navigateTo('deals'); break;
                case '4': this.navigateTo('tasks'); break;
                case '5': this.navigateTo('analytics'); break;
                case 'n':
                    e.preventDefault();
                    if (this.currentView === 'contacts') this.openContactModal();
                    else if (this.currentView === 'deals') this.openDealModal();
                    else if (this.currentView === 'tasks') this.openTaskModal();
                    break;
                case '/':
                    e.preventDefault();
                    if (this.currentView === 'contacts') document.getElementById('contactSearch').focus();
                    break;
            }
        });
    }

    setDate() {
        const now = new Date();
        const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        document.getElementById('currentDate').textContent = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    }

    updateBadges() {
        document.getElementById('contactsBadge').textContent = this.store.state.contacts.length;
        document.getElementById('dealsBadge').textContent = this.store.state.deals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost').length;
        document.getElementById('tasksBadge').textContent = this.store.getPendingTasks().length;
    }

    // ==================== Dashboard ====================
    renderDashboard() {
        const stats = this.store.getStats();
        document.getElementById('contactsCount').textContent = stats.contactsCount;
        document.getElementById('dealsCount').textContent = stats.activeDealsCount;
        document.getElementById('revenueValue').textContent = Utils.formatCurrency(stats.totalRevenue);
        document.getElementById('pendingTasksCount').textContent = stats.todayTasksCount;

        this.renderFunnel();
        this.renderUpcomingTasks();
        this.renderRecentActivity();
    }

    renderFunnel() {
        const stages = this.store.getPipelineStats();
        const totalCount = stages.reduce((sum, s) => sum + s.count, 0) || 1;
        const maxCount = Math.max(...stages.map(s => s.count), 1);
        const container = document.getElementById('funnelChart');

        container.innerHTML = stages.filter(s => s.id !== 'closed_lost').map(stage => {
            const width = Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 10 : 0);
            return `
                <div class="funnel-row">
                    <span class="funnel-label">${Utils.escapeHtml(stage.name)}</span>
                    <div class="funnel-bar-wrapper">
                        <div class="funnel-bar" style="width: ${width}%; background: ${stage.color};">
                            <span class="funnel-bar-text">${Utils.formatCurrency(stage.value)}</span>
                        </div>
                    </div>
                    <span class="funnel-count">${stage.count}</span>
                </div>
            `;
        }).join('');
    }

    renderUpcomingTasks() {
        const tasks = this.store.getTodayTasks().slice(0, 5);
        const container = document.getElementById('upcomingTasks');

        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 32px 16px;">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
                        <path d="M9 11l3 3L22 4"/>
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                    </svg>
                    <p>Нет задач на сегодня</p>
                </div>
            `;
            return;
        }

        container.innerHTML = tasks.map(task => `
            <div class="reminder-item" role="listitem" data-task-id="${task.id}">
                <span class="reminder-priority ${task.priority}"></span>
                <span class="reminder-time">${task.dueTime || '--:--'}</span>
                <span class="reminder-text">${Utils.escapeHtml(task.title)}</span>
            </div>
        `).join('');
    }

    renderRecentActivity() {
        const activities = this.store.getRecentActivities(8);
        const container = document.getElementById('recentActivity');

        if (activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 32px 16px;">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p>Пока нет активности</p>
                </div>
            `;
            return;
        }

        const icons = {
            contact_created: { bg: 'var(--primary-light)', color: 'var(--primary)', emoji: '👤' },
            contact_deleted: { bg: 'var(--danger-light)', color: 'var(--danger)', emoji: '👤' },
            deal_created: { bg: 'var(--success-light)', color: 'var(--success)', emoji: '💼' },
            deal_deleted: { bg: 'var(--danger-light)', color: 'var(--danger)', emoji: '💼' },
            deal_stage_changed: { bg: 'var(--warning-light)', color: 'var(--warning)', emoji: '📈' },
            task_created: { bg: 'var(--info-light)', color: 'var(--info)', emoji: '📋' },
            task_deleted: { bg: 'var(--danger-light)', color: 'var(--danger)', emoji: '📋' },
            task_completed: { bg: 'var(--success-light)', color: 'var(--success)', emoji: '✅' }
        };

        container.innerHTML = activities.map(act => {
            const icon = icons[act.type] || icons.contact_created;
            return `
                <div class="activity-item" role="listitem">
                    <div class="activity-icon" style="background: ${icon.bg}; color: ${icon.color};">
                        ${icon.emoji}
                    </div>
                    <div class="activity-content">
                        <div class="activity-text">${Utils.escapeHtml(act.description)}</div>
                        <div class="activity-time">${Utils.getRelativeTime(act.createdAt)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==================== Contacts ====================
    renderContacts(searchQuery = '') {
        const contacts = searchQuery ? this.store.searchContacts(searchQuery) : this.store.state.contacts;
        const container = document.getElementById('contactsList');
        const emptyEl = document.getElementById('contactsEmpty');

        if (contacts.length === 0) {
            container.innerHTML = '';
            container.appendChild(emptyEl);
            emptyEl.style.display = 'block';
            return;
        }

        emptyEl.style.display = 'none';
        container.innerHTML = contacts.map(contact => `
            <div class="contact-card" role="listitem" data-contact-id="${contact.id}" tabindex="0">
                <div class="contact-card-header">
                    <div class="contact-avatar" style="background: ${Utils.getAvatarColor(contact.name)};">
                        ${Utils.getInitials(contact.name)}
                    </div>
                    <div>
                        <div class="contact-name">${Utils.escapeHtml(contact.name)}</div>
                        <div class="contact-company">${Utils.escapeHtml(contact.company || 'Без компании')}</div>
                    </div>
                </div>
                <div class="contact-details">
                    ${contact.phone ? `
                        <div class="contact-detail">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                            ${Utils.escapeHtml(contact.phone)}
                        </div>
                    ` : ''}
                    ${contact.email ? `
                        <div class="contact-detail">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
                            ${Utils.escapeHtml(contact.email)}
                        </div>
                    ` : ''}
                </div>
                <div class="contact-actions">
                    <button class="contact-action-btn" data-action="edit" data-contact-id="${Utils.escapeHtml(String(contact.id))}" aria-label="Редактировать контакт">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Изменить
                    </button>
                    <button class="contact-action-btn danger" data-action="delete" data-contact-id="${Utils.escapeHtml(String(contact.id))}" aria-label="Удалить контакт">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        Удалить
                    </button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', () => {
                App.openContactModal(btn.dataset.contactId);
            });
        });
        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                App.deleteContact(btn.dataset.contactId);
            });
        });
    }

    openContactModal(contactId = null) {
        const contact = contactId ? this.store.getContact(contactId) : null;
        const title = contact ? 'Редактировать контакт' : 'Новый контакт';

        const html = `
            <form id="contactForm" novalidate>
                <div class="form-group">
                    <label class="form-label" for="contactName">Имя *</label>
                    <input type="text" id="contactName" class="form-input" value="${Utils.escapeHtml(contact?.name || '')}" placeholder="Иван Иванов" required aria-required="true">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="contactPhone">Телефон</label>
                        <input type="tel" id="contactPhone" class="form-input" value="${Utils.escapeHtml(contact?.phone || '')}" placeholder="+7 (999) 123-45-67">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="contactEmail">Email</label>
                        <input type="email" id="contactEmail" class="form-input" value="${Utils.escapeHtml(contact?.email || '')}" placeholder="ivan@example.com">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="contactCompany">Компания</label>
                        <input type="text" id="contactCompany" class="form-input" value="${Utils.escapeHtml(contact?.company || '')}" placeholder="ООО «Компания»">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="contactPosition">Должность</label>
                        <input type="text" id="contactPosition" class="form-input" value="${Utils.escapeHtml(contact?.position || '')}" placeholder="Директор">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="contactNotes">Заметки</label>
                    <textarea id="contactNotes" class="form-textarea" placeholder="Дополнительная информация...">${Utils.escapeHtml(contact?.notes || '')}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.modal.close()">Отмена</button>
                    <button type="submit" class="btn btn-primary">${contact ? 'Сохранить' : 'Добавить'}</button>
                </div>
            </form>
        `;

        this.modal.open(title, html);

        document.getElementById('contactForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('contactName').value.trim();
            if (!name) {
                this.toast.error('Введите имя контакта');
                return;
            }

            const data = {
                name,
                phone: document.getElementById('contactPhone').value.trim(),
                email: document.getElementById('contactEmail').value.trim(),
                company: document.getElementById('contactCompany').value.trim(),
                position: document.getElementById('contactPosition').value.trim(),
                notes: document.getElementById('contactNotes').value.trim()
            };

            if (contact) {
                this.store.updateContact(contactId, data);
                this.toast.success('Контакт обновлён');
            } else {
                this.store.addContact(data);
                this.toast.success('Контакт добавлен');
            }

            this.modal.close();
        });
    }

    async deleteContact(id) {
        const contact = this.store.getContact(id);
        if (!contact) return;
        const ok = await this.confirm.show('Удалить контакт?', `Вы уверены, что хотите удалить "${contact.name}"?`);
        if (ok) {
            this.store.deleteContact(id);
            this.toast.success('Контакт удалён');
        }
    }

    // ==================== Deals ====================
    renderDeals() {
        const board = document.getElementById('kanbanBoard');
        const list = document.getElementById('dealsList');
        const empty = document.getElementById('dealsEmpty');

        if (this.dealsViewMode === 'kanban') {
            board.style.display = 'block';
            list.style.display = 'none';
            this.renderKanban();
        } else {
            board.style.display = 'none';
            list.style.display = 'block';
            this.renderDealsList();
        }
    }

    renderKanban() {
        const container = document.getElementById('kanbanColumns');
        const stages = this.store.state.pipelineStages.filter(s => s.id !== 'closed_lost');

        container.innerHTML = stages.map(stage => {
            const deals = this.store.getDealsByStage(stage.id);
            return `
                <div class="kanban-column" data-stage="${stage.id}">
                    <div class="kanban-column-header" style="border-bottom-color: ${stage.color};">
                        <span class="kanban-column-title" style="color: ${stage.color};">${Utils.escapeHtml(stage.name)}</span>
                        <span class="kanban-column-count">${deals.length}</span>
                    </div>
                    <div class="kanban-column-cards" data-stage="${stage.id}"
                        ondragover="App.handleDragOver(event)"
                        ondragleave="App.handleDragLeave(event)"
                        ondrop="App.handleDrop(event, '${stage.id}')">
                        ${deals.map(deal => this.renderDealCard(deal)).join('')}
                    </div>
                </div>
            `;
        }).join('');

        const empty = document.getElementById('dealsEmpty');
        empty.style.display = this.store.state.deals.length === 0 ? 'block' : 'none';
    }

    renderDealCard(deal) {
        const contact = deal.contactId ? this.store.getContact(deal.contactId) : null;
        return `
            <div class="deal-card" draggable="true" data-deal-id="${deal.id}">
                <div class="deal-card-title">${Utils.escapeHtml(deal.title)}</div>
                <div class="deal-card-value">${Utils.formatCurrency(deal.value)}</div>
                ${contact ? `<div class="deal-card-contact">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    ${Utils.escapeHtml(contact.name)}
                </div>` : ''}
                <div class="deal-card-actions">
                    <button class="deal-card-btn" data-action="edit-deal" data-deal-id="${deal.id}">Изменить</button>
                    <button class="deal-card-btn" data-action="delete-deal" data-deal-id="${deal.id}">Удалить</button>
                </div>
            </div>
        `;
    }

    renderDealsList() {
        const container = document.getElementById('dealsListBody');
        const deals = [...this.store.state.deals].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        container.innerHTML = deals.map(deal => {
            const contact = deal.contactId ? this.store.getContact(deal.contactId) : null;
            return `
                <div class="list-row" data-deal-id="${deal.id}" onclick="App.openDealModal('${deal.id}')">
                    <span class="list-col" style="font-weight: 500;">${Utils.escapeHtml(deal.title)}</span>
                    <span class="list-col" style="color: var(--text-secondary);">${contact ? Utils.escapeHtml(contact.name) : '—'}</span>
                    <span class="list-col" style="font-weight: 600; color: var(--success);">${Utils.formatCurrency(deal.value)}</span>
                    <span class="list-col">
                        <span class="stage-badge" style="background: ${this.store.getStageColor(deal.stage)};">
                            ${this.store.getStageName(deal.stage)}
                        </span>
                    </span>
                    <span class="list-col" style="color: var(--text-secondary); font-size: var(--font-size-sm);">${Utils.formatDate(deal.updatedAt)}</span>
                    <span class="list-col">
                        <button class="deal-card-btn" onclick="App.deleteDeal('${deal.id}'); event.stopPropagation();">Удалить</button>
                    </span>
                </div>
            `;
        }).join('');

        const empty = document.getElementById('dealsEmpty');
        empty.style.display = deals.length === 0 ? 'block' : 'none';
    }

    handleDragStart(e, dealId) {
        this.draggedDeal = dealId;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dealId);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.kanban-column-cards').forEach(col => {
            col.classList.remove('drag-over');
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e, newStage) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const dealId = e.dataTransfer.getData('text/plain');
        if (dealId) {
            this.store.updateDeal(dealId, { stage: newStage });
            this.toast.success(`Сделка перемещена в "${this.store.getStageName(newStage)}"`);
        }
    }

    openDealModal(dealId = null) {
        const deal = dealId ? this.store.getDeal(dealId) : null;
        const title = deal ? 'Редактировать сделку' : 'Новая сделка';
        const contacts = this.store.state.contacts;
        const stages = this.store.state.pipelineStages;

        const html = `
            <form id="dealForm" novalidate>
                <div class="form-group">
                    <label class="form-label" for="dealTitle">Название сделки *</label>
                    <input type="text" id="dealTitle" class="form-input" value="${Utils.escapeHtml(deal?.title || '')}" placeholder="Разработка сайта" required aria-required="true">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="dealValue">Сумма (₽)</label>
                        <input type="number" id="dealValue" class="form-input" value="${deal?.value || ''}" placeholder="150000" min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="dealStage">Этап</label>
                        <select id="dealStage" class="form-select">
                            ${stages.map(s => `<option value="${s.id}" ${deal?.stage === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="dealContact">Контакт</label>
                    <select id="dealContact" class="form-select">
                        <option value="">Без контакта</option>
                        ${contacts.map(c => `<option value="${c.id}" ${deal?.contactId === c.id ? 'selected' : ''}>${Utils.escapeHtml(c.name)}${c.company ? ' (' + Utils.escapeHtml(c.company) + ')' : ''}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" for="dealExpectedClose">Ожидаемое закрытие</label>
                    <input type="date" id="dealExpectedClose" class="form-input" value="${deal?.expectedClose || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="dealNotes">Заметки</label>
                    <textarea id="dealNotes" class="form-textarea" placeholder="Подробности сделки...">${Utils.escapeHtml(deal?.notes || '')}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.modal.close()">Отмена</button>
                    <button type="submit" class="btn btn-primary">${deal ? 'Сохранить' : 'Создать'}</button>
                </div>
            </form>
        `;

        this.modal.open(title, html);

        document.getElementById('dealForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const titleVal = document.getElementById('dealTitle').value.trim();
            if (!titleVal) {
                this.toast.error('Введите название сделки');
                return;
            }

            const data = {
                title: titleVal,
                value: parseInt(document.getElementById('dealValue').value) || 0,
                stage: document.getElementById('dealStage').value,
                contactId: document.getElementById('dealContact').value || null,
                expectedClose: document.getElementById('dealExpectedClose').value,
                notes: document.getElementById('dealNotes').value.trim()
            };

            if (deal) {
                this.store.updateDeal(dealId, data);
                this.toast.success('Сделка обновлена');
            } else {
                this.store.addDeal(data);
                this.toast.success('Сделка создана');
            }

            this.modal.close();
        });
    }

    async deleteDeal(id) {
        const deal = this.store.getDeal(id);
        if (!deal) return;
        const ok = await this.confirm.show('Удалить сделку?', `Вы уверены, что хотите удалить "${deal.title}"?`);
        if (ok) {
            this.store.deleteDeal(id);
            this.toast.success('Сделка удалена');
        }
    }

    // ==================== Tasks ====================
    renderTasks() {
        let tasks;
        switch (this.taskFilter) {
            case 'pending': tasks = this.store.getPendingTasks(); break;
            case 'completed': tasks = this.store.getCompletedTasks(); break;
            default: tasks = [...this.store.state.tasks];
        }

        tasks.sort((a, b) => {
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (a.status !== 'completed' && b.status === 'completed') return -1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        const container = document.getElementById('tasksList');
        const empty = document.getElementById('tasksEmpty');

        if (tasks.length === 0) {
            container.innerHTML = '';
            container.appendChild(empty);
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        container.innerHTML = tasks.map(task => {
            const deal = task.dealId ? this.store.getDeal(task.dealId) : null;
            const isCompleted = task.status === 'completed';
            const isOverdue = !isCompleted && Utils.isOverdue(task.dueDate) && task.dueDate;

            return `
                <div class="task-item ${isCompleted ? 'completed' : ''}" role="listitem" data-task-id="${task.id}">
                    <div class="task-checkbox ${isCompleted ? 'checked' : ''}" onclick="App.toggleTask('${task.id}')" role="checkbox" aria-checked="${isCompleted}" tabindex="0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                    <div class="task-content">
                        <div class="task-title">${Utils.escapeHtml(task.title)}</div>
                        <div class="task-meta">
                            <span class="task-priority ${task.priority}">${{ urgent: 'Срочно', high: 'Высокий', medium: 'Средний', low: 'Низкий' }[task.priority]}</span>
                            ${task.dueDate ? `<span class="task-date" style="color: ${isOverdue ? 'var(--danger)' : 'var(--text-tertiary)'};">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                                ${Utils.formatDate(task.dueDate)}${task.dueTime ? ' ' + task.dueTime : ''}
                                ${isOverdue ? ' (просрочено)' : ''}
                            </span>` : ''}
                            ${deal ? `<span style="color: var(--primary);">→ ${Utils.escapeHtml(deal.title)}</span>` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="deal-card-btn" onclick="App.openTaskModal('${task.id}')" aria-label="Редактировать задачу">Изменить</button>
                        <button class="deal-card-btn" onclick="App.deleteTask('${task.id}')" aria-label="Удалить задачу">Удалить</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    toggleTask(id) {
        const task = this.store.getTask(id);
        if (!task) return;
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        this.store.updateTask(id, { status: newStatus });
        if (newStatus === 'completed') {
            this.toast.success('Задача выполнена!');
        }
    }

    openTaskModal(taskId = null) {
        const task = taskId ? this.store.getTask(taskId) : null;
        const title = task ? 'Редактировать задачу' : 'Новая задача';
        const deals = this.store.state.deals;
        const contacts = this.store.state.contacts;

        const html = `
            <form id="taskForm" novalidate>
                <div class="form-group">
                    <label class="form-label" for="taskTitle">Название задачи *</label>
                    <input type="text" id="taskTitle" class="form-input" value="${Utils.escapeHtml(task?.title || '')}" placeholder="Позвонить клиенту" required aria-required="true">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="taskDueDate">Дата</label>
                        <input type="date" id="taskDueDate" class="form-input" value="${task?.dueDate || Utils.today()}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="taskDueTime">Время</label>
                        <input type="time" id="taskDueTime" class="form-input" value="${task?.dueTime || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="taskPriority">Приоритет</label>
                        <select id="taskPriority" class="form-select">
                            <option value="low" ${task?.priority === 'low' ? 'selected' : ''}>Низкий</option>
                            <option value="medium" ${(!task || task.priority === 'medium') ? 'selected' : ''}>Средний</option>
                            <option value="high" ${task?.priority === 'high' ? 'selected' : ''}>Высокий</option>
                            <option value="urgent" ${task?.priority === 'urgent' ? 'selected' : ''}>Срочно</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="taskDeal">Связанная сделка</label>
                        <select id="taskDeal" class="form-select">
                            <option value="">Без сделки</option>
                            ${deals.map(d => `<option value="${d.id}" ${task?.dealId === d.id ? 'selected' : ''}>${Utils.escapeHtml(d.title)}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="taskDescription">Описание</label>
                    <textarea id="taskDescription" class="form-textarea" placeholder="Подробности задачи...">${Utils.escapeHtml(task?.description || '')}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.modal.close()">Отмена</button>
                    <button type="submit" class="btn btn-primary">${task ? 'Сохранить' : 'Добавить'}</button>
                </div>
            </form>
        `;

        this.modal.open(title, html);

        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const titleVal = document.getElementById('taskTitle').value.trim();
            if (!titleVal) {
                this.toast.error('Введите название задачи');
                return;
            }

            const data = {
                title: titleVal,
                dueDate: document.getElementById('taskDueDate').value,
                dueTime: document.getElementById('taskDueTime').value,
                priority: document.getElementById('taskPriority').value,
                dealId: document.getElementById('taskDeal').value || null,
                description: document.getElementById('taskDescription').value.trim()
            };

            if (task) {
                this.store.updateTask(taskId, data);
                this.toast.success('Задача обновлена');
            } else {
                this.store.addTask(data);
                this.toast.success('Задача добавлена');
            }

            this.modal.close();
        });
    }

    async deleteTask(id) {
        const task = this.store.getTask(id);
        if (!task) return;
        const ok = await this.confirm.show('Удалить задачу?', `Вы уверены, что хотите удалить "${task.title}"?`);
        if (ok) {
            this.store.deleteTask(id);
            this.toast.success('Задача удалена');
        }
    }

    // ==================== Analytics ====================
    renderAnalytics() {
        const stages = this.store.getPipelineStats();
        const totalDeals = this.store.state.deals.length;
        const closedWon = this.store.state.deals.filter(d => d.stage === 'closed_won').length;
        const conversionRate = totalDeals > 0 ? Math.round((closedWon / totalDeals) * 100) : 0;

        const closedDeals = this.store.state.deals.filter(d => d.stage === 'closed_won');
        const avgDeal = closedDeals.length > 0
            ? Math.round(closedDeals.reduce((sum, d) => sum + d.value, 0) / closedDeals.length)
            : 0;

        document.getElementById('conversionRate').textContent = conversionRate + '%';
        document.getElementById('avgDealValue').textContent = Utils.formatCurrency(avgDeal);

        this.renderConversionBars(stages);
        this.renderStageChart(stages);
        this.renderTaskCompletion();
        this.renderActivityChart();
    }

    renderConversionBars(stages) {
        const container = document.getElementById('conversionBars');
        const filtered = stages.filter(s => s.id !== 'closed_lost');
        const maxCount = Math.max(...filtered.map(s => s.count), 1);

        container.innerHTML = filtered.map(stage => {
            const width = Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 8 : 0);
            return `
                <div class="conversion-row">
                    <span class="conversion-label">${Utils.escapeHtml(stage.name)}</span>
                    <div class="conversion-bar-wrapper">
                        <div class="conversion-bar" style="width: ${width}%; background: ${stage.color};"></div>
                    </div>
                    <span class="conversion-value">${stage.count}</span>
                </div>
            `;
        }).join('');
    }

    renderStageChart(stages) {
        const container = document.getElementById('stageChart');
        const filtered = stages.filter(s => s.id !== 'closed_lost');
        const maxCount = Math.max(...filtered.map(s => s.count), 1);

        container.innerHTML = filtered.map(stage => {
            const width = Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 12 : 0);
            return `
                <div class="stage-row">
                    <span class="stage-name">${Utils.escapeHtml(stage.name)}</span>
                    <div class="stage-bar-wrapper">
                        <div class="stage-bar" style="width: ${width}%; background: ${stage.color};">
                            <span class="stage-bar-text">${Utils.formatCurrency(stage.value)}</span>
                        </div>
                    </div>
                    <span class="stage-count">${stage.count}</span>
                </div>
            `;
        }).join('');
    }

    renderTaskCompletion() {
        const stats = this.store.getStats();
        document.getElementById('taskCompletionRate').textContent = stats.taskCompletion + '%';
        document.getElementById('taskProgressFill').style.width = stats.taskCompletion + '%';
    }

    renderActivityChart() {
        const container = document.getElementById('activityChart');
        const days = 14;
        const now = new Date();
        const data = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const count = this.store.state.activities.filter(a => {
                const actDate = new Date(a.createdAt).toISOString().split('T')[0];
                return actDate === dateStr;
            }).length;
            data.push({ date: dateStr, count, day: date.getDate() });
        }

        const maxCount = Math.max(...data.map(d => d.count), 1);

        container.innerHTML = data.map(d => {
            const height = Math.max((d.count / maxCount) * 100, d.count > 0 ? 8 : 4);
            return `<div class="activity-bar" style="height: ${height}%;" data-count="${d.count}活动" title="${d.date}: ${d.count} действий"></div>`;
        }).join('');
    }

    // ==================== Settings ====================
    renderSettings() {
        const stats = this.store.getStats();
        const totalRecords = this.store.state.contacts.length + this.store.state.deals.length + this.store.state.tasks.length;
        document.getElementById('storageUsage').textContent = `${totalRecords} записей`;
    }

    exportData() {
        const data = {
            contacts: this.store.state.contacts,
            deals: this.store.state.deals,
            tasks: this.store.state.tasks,
            exportDate: new Date().toISOString()
        };

        let csv = 'Тип,Название,Контакт,Сумма,Этап,Статус,Дата\n';
        data.contacts.forEach(c => {
            csv += `Контакт,"${c.name}","${c.company || ''}","","","${Utils.formatDate(c.createdAt)}"\n`;
        });
        data.deals.forEach(d => {
            const contact = d.contactId ? this.store.getContact(d.contactId) : null;
            csv += `Сделка,"${d.title}","${contact?.name || ''}","${d.value}","${this.store.getStageName(d.stage)}","","${Utils.formatDate(d.createdAt)}"\n`;
        });
        data.tasks.forEach(t => {
            csv += `Задача,"${t.title}","","","","${t.status}","${Utils.formatDate(t.dueDate)}"\n`;
        });

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crm-export-${Utils.today()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.toast.success('Данные экспортированы');
    }

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const lines = text.split('\n').filter(l => l.trim());
                let imported = 0;

                for (let i = 1; i < lines.length; i++) {
                    const parts = lines[i].split(',').map(p => p.replace(/^"|"$/g, '').trim());
                    const type = parts[0];

                    if (type === 'Контакт' && parts[1]) {
                        this.store.addContact({ name: parts[1], company: parts[2] || '' });
                        imported++;
                    } else if (type === 'Сделка' && parts[1]) {
                        this.store.addDeal({ title: parts[1], value: parseInt(parts[3]) || 0, stage: 'lead' });
                        imported++;
                    }
                }

                this.toast.success(`Импортировано ${imported} записей`);
            } catch (err) {
                this.toast.error('Ошибка при импорте файла');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    async clearData() {
        const ok = await this.confirm.show(
            'Очистить все данные?',
            'Это действие нельзя отменить. Все контакты, сделки и задачи будут удалены.',
            'Очистить'
        );
        if (ok) {
            this.store.clearAll();
            this.toast.success('Данные очищены');
        }
    }

    destroy() {
        // Remove store event listeners
        this.store.on = () => {};
        this.store.emit = () => {};

        // Remove modal and overlay event listeners
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.replaceWith(modalOverlay.cloneNode(true));
        }

        const confirmOverlay = document.getElementById('confirmOverlay');
        if (confirmOverlay) {
            confirmOverlay.replaceWith(confirmOverlay.cloneNode(true));
        }

        // Remove keyboard navigation listener
        document.removeEventListener('keydown', this.handleKeyboardNav);
        delete this.handleKeyboardNav;

        // Clear references
        this.store = null;
        this.toast = null;
        this.modal = null;
        this.confirm = null;
    }
}

// ==================== Application ====================
class CRMApp {
    constructor() {
        this.store = new Store();
        this.toast = new Toast('toastContainer');
        this.modal = new Modal();
        this.confirm = new Confirm();
        this.renderer = new Renderer(this.store, this.toast, this.modal, this.confirm);
    }

    init() {
        this.renderer.init();
        this.seedDemoData();
    }

    seedDemoData() {
        if (this.store.state.contacts.length > 0) return;

        const contacts = [
            { name: 'Иван Петров', phone: '+7 (999) 123-45-67', email: 'ivan@example.com', company: 'ООО "Пример"', position: 'Директор' },
            { name: 'Мария Сидорова', phone: '+7 (999) 234-56-78', email: 'maria@example.com', company: 'ИП Сидорова', position: 'Менеджер' },
            { name: 'Алексей Козлов', phone: '+7 (999) 345-67-89', email: 'alex@example.com', company: 'ООО "Технологии"', position: 'CTO' },
            { name: 'Елена Новикова', phone: '+7 (999) 456-78-90', email: 'elena@example.com', company: 'ООО "Дизайн"', position: 'Креативный директор' },
            { name: 'Дмитрий Волков', phone: '+7 (999) 567-89-01', email: 'dmitry@example.com', company: 'Волков и партнёры', position: 'Юрист' }
        ];

        const savedContacts = contacts.map(c => this.store.addContact(c));

        const deals = [
            { title: 'Разработка сайта', value: 150000, stage: 'lead', contactId: savedContacts[0].id },
            { title: 'Мобильное приложение', value: 350000, stage: 'proposal', contactId: savedContacts[1].id },
            { title: 'SEO-продвижение', value: 80000, stage: 'negotiation', contactId: savedContacts[2].id },
            { title: 'Дизайн логотипа', value: 25000, stage: 'lead', contactId: savedContacts[3].id },
            { title: 'Консультация', value: 15000, stage: 'closed_won', contactId: savedContacts[4].id }
        ];

        deals.forEach(d => this.store.addDeal(d));

        const tasks = [
            { title: 'Позвонить Петрову', dueDate: Utils.today(), dueTime: '14:00', priority: 'high', dealId: this.store.state.deals[0]?.id },
            { title: 'Отправить оффер', dueDate: Utils.today(), dueTime: '16:30', priority: 'medium', dealId: this.store.state.deals[1]?.id },
            { title: 'Подготовить презентацию', dueDate: Utils.today(), dueTime: '11:00', priority: 'medium' },
            { title: 'Проверить договор', dueDate: Utils.today(), dueTime: '09:00', priority: 'low' },
            { title: 'Запланировать встречу', dueDate: Utils.today(), dueTime: '17:00', priority: 'low' }
        ];

        tasks.forEach(t => this.store.addTask(t));
    }
}

// Expose globally for event handlers
const App = new CRMApp();

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Add destroy method for cleanup
CRMApp.prototype.destroy = function() {
    if (this.renderer && typeof this.renderer.destroy === 'function') {
        this.renderer.destroy();
    }
    this.renderer = null;
    this.store = null;
    this.toast = null;
    this.modal = null;
    this.confirm = null;
};
