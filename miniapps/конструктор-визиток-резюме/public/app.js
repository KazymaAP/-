'use strict';

const App = {
    data: { name: '', title: '', email: '', phone: '', website: '', about: '', template: 'gradient', color: '#667eea' },
    templates: [
        { id: 'gradient', name: 'Градиент', icon: '🎨', bg: 'linear-gradient(135deg, #667eea, #764ba2)' },
        { id: 'ocean', name: 'Океан', icon: '🌊', bg: 'linear-gradient(135deg, #0077b6, #00b4d8)' },
        { id: 'sunset', name: 'Закат', icon: '🌅', bg: 'linear-gradient(135deg, #f093fb, #f5576c)' },
        { id: 'forest', name: 'Лес', icon: '🌲', bg: 'linear-gradient(135deg, #11998e, #38ef7d)' },
        { id: 'dark', name: 'Тёмная', icon: '🌙', bg: 'linear-gradient(135deg, #232526, #414345)' },
        { id: 'fire', name: 'Огонь', icon: '🔥', bg: 'linear-gradient(135deg, #f12711, #f5af19)' }
    ],

    init() {
        this.load();
        this.bindEvents();
        this.render();
    },

    load() {
        try {
            const saved = localStorage.getItem('visirki_data');
            if (saved) Object.assign(this.data, JSON.parse(saved));
        } catch (e) {
            // Ignore corrupt data, start fresh
        }
    },

    save() {
        try {
            localStorage.setItem('visirki_data', JSON.stringify(this.data));
        } catch (e) {
            // Storage full or unavailable
        }
    },

    bindEvents() {
        ['name','title','email','phone','website','about'].forEach(field => {
            const el = document.getElementById(field);
            if (el) el.addEventListener('input', (e) => { this.data[field] = e.target.value; this.save(); this.updatePreview(); });
        });

        document.getElementById('generateBtn')?.addEventListener('click', () => this.generate());
        document.getElementById('shareBtn')?.addEventListener('click', () => this.share());
        document.getElementById('downloadBtn')?.addEventListener('click', () => this.showToast('Ссылка скопирована!'));
    },

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="app-container">
                <div class="app-header">
                    <h1>Visirki</h1>
                    <p>Создайте цифровую визитку за 5 минут</p>
                </div>

                <div class="form-card">
                    <h2>👤 Основная информация</h2>
                    <div class="form-group">
                        <label class="form-label" for="name">Имя *</label>
                        <input class="form-input" id="name" value="${this.esc(this.data.name)}" placeholder="Иван Иванов">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="title">Должность / Роль</label>
                        <input class="form-input" id="title" value="${this.esc(this.data.title)}" placeholder="Frontend Developer">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="email">Email</label>
                            <input class="form-input" id="email" type="email" value="${this.esc(this.data.email)}" placeholder="ivan@example.com">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="phone">Телефон</label>
                            <input class="form-input" id="phone" type="tel" value="${this.esc(this.data.phone)}" placeholder="+7 (999) 123-45-67">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="website">Сайт</label>
                        <input class="form-input" id="website" value="${this.esc(this.data.website)}" placeholder="https://example.com">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="about">О себе</label>
                        <textarea class="form-textarea" id="about" placeholder="Расскажите о себе...">${this.esc(this.data.about)}</textarea>
                    </div>
                </div>

                <div class="form-card">
                    <h2>🎨 Шаблон</h2>
                    <div class="template-grid">
                        ${this.templates.map(t => `
                            <div class="template-option ${this.data.template === t.id ? 'active' : ''}" data-template="${t.id}">
                                <div class="icon">${t.icon}</div>
                                <div class="name">${t.name}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="preview-container">
                    <div class="preview-header">
                        <h3>Предпросмотр</h3>
                    </div>
                    <div class="preview-body" id="previewBody"></div>
                </div>

                <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;">
                    <button class="btn btn-primary btn-block" id="shareBtn">📤 Поделиться</button>
                    <button class="btn btn-outline btn-block" id="downloadBtn">📋 Копировать ссылку</button>
                </div>

                <div class="toast-container" id="toastContainer"></div>
            </div>
        `;

        this.bindEvents();
        this.renderTemplateOptions();
        this.updatePreview();
    },

    renderTemplateOptions() {
        document.querySelectorAll('.template-option').forEach(el => {
            el.addEventListener('click', () => {
                this.data.template = el.dataset.template;
                this.save();
                document.querySelectorAll('.template-option').forEach(o => o.classList.toggle('active', o.dataset.template === this.data.template));
                this.updatePreview();
            });
        });
    },

    updatePreview() {
        const body = document.getElementById('previewBody');
        if (!body) return;
        const tmpl = this.templates.find(t => t.id === this.data.template) || this.templates[0];
        const initial = (this.data.name || '?')[0].toUpperCase();

        body.innerHTML = `
            <div class="visa-card" style="background: ${tmpl.bg};">
                <div class="visa-card__avatar">${initial}</div>
                <div class="visa-card__name">${this.esc(this.data.name || 'Ваше имя')}</div>
                <div class="visa-card__title">${this.esc(this.data.title || 'Должность')}</div>
                <div class="visa-card__contacts">
                    ${this.data.email ? `<div>📧 ${this.esc(this.data.email)}</div>` : ''}
                    ${this.data.phone ? `<div>📱 ${this.esc(this.data.phone)}</div>` : ''}
                    ${this.data.website ? `<div>🌐 ${this.esc(this.data.website)}</div>` : ''}
                    ${this.data.about ? `<div style="margin-top:8px;font-size:12px;opacity:0.85;">${this.esc(this.data.about)}</div>` : ''}
                </div>
            </div>
        `;
    },

    generate() {
        if (!this.data.name.trim()) { this.showToast('Введите имя'); return; }
        this.showToast('Визитка сохранена!');
    },

    share() {
        try {
            if (navigator.share) {
                navigator.share({ title: this.data.name + ' — Визитка', text: `Посмотрите визитку ${this.data.name}` });
            } else if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    this.showToast('Ссылка скопирована в буфер обмена!');
                }).catch(() => {
                    this.fallbackCopy(window.location.href);
                });
            } else {
                this.fallbackCopy(window.location.href);
            }
        } catch (e) {
            this.fallbackCopy(window.location.href);
        }
    },

    fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            this.showToast('Ссылка скопирована!');
        } catch (e) {
            this.showToast('Не удалось скопировать ссылку');
        }
        document.body.removeChild(textarea);
    },

    showToast(msg) {
        const c = document.getElementById('toastContainer');
        if (!c) return;
        const t = document.createElement('div');
        t.className = 'toast';
        t.setAttribute('role', 'alert');
        t.setAttribute('aria-live', 'polite');
        t.textContent = msg;
        c.appendChild(t);
        setTimeout(() => t.remove(), 2500);
    },

    esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; },

    destroy() {
        this.data = { name: '', title: '', email: '', phone: '', website: '', about: '', template: 'gradient', color: '#667eea' };
        const app = document.getElementById('app');
        if (app) {
            const clone = app.cloneNode(true);
            app.replaceWith(clone);
        }
        // Remove event listeners
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }
};

function initApp() { App.init(); }
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
window.appDestroy = () => App.destroy();
