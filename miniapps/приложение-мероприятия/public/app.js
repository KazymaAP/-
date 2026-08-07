'use strict';

const App = {
    events: [
        { id: 1, title: 'Tech Conference 2026', date: '15 сентября 2026', location: 'Москва, Крокус Сити', attendees: 250, description: 'Ежегодная технологическая конференция' },
        { id: 2, title: 'React Meetup', date: '22 октября 2026', location: 'Онлайн', attendees: 120, description: 'Встреча сообщества React-разработчиков' },
        { id: 3, title: 'Startup Pitch Day', date: '5 ноября 2026', location: 'СПб, Дыбенко 7', attendees: 80, description: 'День питчей для стартапов' }
    ],
    speakers: [
        { name: 'Алексей Петров', role: 'CTO, TechCorp', initials: 'АП' },
        { name: 'Мария Иванова', role: 'Lead Developer, StartupX', initials: 'МИ' },
        { name: 'Дмитрий Козлов', role: 'Product Manager, BigTech', initials: 'ДК' }
    ],
    schedule: [
        { time: '10:00', title: 'Регистрация и кофе', speaker: '', tag: '' },
        { time: '10:30', title: 'Открытие конференции', speaker: 'Организаторы', tag: 'Основное' },
        { time: '11:00', title: 'Тренды фронтенда 2026', speaker: 'Алексей Петров', tag: 'Frontend' },
        { time: '12:30', title: 'Обед', speaker: '', tag: '' },
        { time: '13:30', title: 'Масштабирование стартапа', speaker: 'Мария Иванова', tag: 'Бизнес' },
        { time: '15:00', title: 'AI в продуктах', speaker: 'Дмитрий Козлов', tag: 'AI' },
        { time: '16:30', title: 'Нетворкинг', speaker: '', tag: '' }
    ],
    messages: [],
    activeTab: 'events',
    activeEvent: null,

    init() {
        this.render();
        this.bindNav();
    },

    bindNav() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.activeTab = item.dataset.tab;
                this.render();
            });
        });
    },

    render() {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.tab === this.activeTab));
        document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === this.activeTab + 'Screen'));

        switch (this.activeTab) {
            case 'events': this.renderEvents(); break;
            case 'schedule': this.renderSchedule(); break;
            case 'speakers': this.renderSpeakers(); break;
            case 'map': this.renderMap(); break;
            case 'chat': this.renderChat(); break;
        }
    },

    renderEvents() {
        const el = document.getElementById('eventsScreen');
        if (!el) return;
        el.innerHTML = `
            <div class="screen-header"><h1>📅 Мероприятия</h1></div>
            ${this.events.map(e => `
                <div class="event-card" onclick="App.openEvent(${e.id})">
                    <div class="event-card__date">${e.date}</div>
                    <div class="event-card__title">${this.esc(e.title)}</div>
                    <div style="font-size:13px;color:var(--text-secondary);">${this.esc(e.description)}</div>
                    <div class="event-card__meta">
                        <span>📍 ${this.esc(e.location)}</span>
                        <span>👥 ${e.attendees} участников</span>
                    </div>
                </div>
            `).join('')}
        `;
    },

    openEvent(id) {
        this.activeEvent = this.events.find(e => e.id === id);
        this.activeTab = 'schedule';
        this.render();
    },

    renderSchedule() {
        const el = document.getElementById('scheduleScreen');
        if (!el) return;
        el.innerHTML = `
            <div class="screen-header"><h1>📋 Программа</h1></div>
            ${this.schedule.map(s => `
                <div class="schedule-item">
                    <div class="schedule-time">${s.time}</div>
                    <div class="schedule-info">
                        <div class="schedule-title">${this.esc(s.title)}</div>
                        ${s.speaker ? `<div class="schedule-speaker">${this.esc(s.speaker)}</div>` : ''}
                        ${s.tag ? `<span class="schedule-tag">${this.esc(s.tag)}</span>` : ''}
                    </div>
                </div>
            `).join('')}
        `;
    },

    renderSpeakers() {
        const el = document.getElementById('speakersScreen');
        if (!el) return;
        el.innerHTML = `
            <div class="screen-header"><h1>🎤 Спикеры</h1></div>
            ${this.speakers.map(s => `
                <div class="speaker-card">
                    <div class="speaker-avatar">${s.initials}</div>
                    <div class="speaker-info">
                        <div class="speaker-name">${this.esc(s.name)}</div>
                        <div class="speaker-role">${this.esc(s.role)}</div>
                    </div>
                </div>
            `).join('')}
        `;
    },

    renderMap() {
        const el = document.getElementById('mapScreen');
        if (!el) return;
        el.innerHTML = `
            <div class="screen-header"><h1>🗺 Карта</h1></div>
            <div class="map-placeholder">Карта площадки будет здесь</div>
        `;
    },

    renderChat() {
        const el = document.getElementById('chatScreen');
        if (!el) return;
        el.innerHTML = `
            <div class="screen-header"><h1>💬 Чат</h1></div>
            <div class="chat-messages">
                ${this.messages.length === 0 ? '<div class="empty-state">Пока нет сообщений</div>' :
                    this.messages.map(m => `<div class="chat-msg ${m.self ? 'self' : 'other'}">${this.esc(m.text)}</div>`).join('')}
            </div>
            <div class="chat-input">
                <input type="text" id="chatInput" placeholder="Сообщение..." onkeydown="if(event.key==='Enter')App.sendMessage()">
                <button class="btn btn-primary btn-sm" onclick="App.sendMessage()">→</button>
            </div>
        `;
    },

    sendMessage() {
        const input = document.getElementById('chatInput');
        if (!input || !input.value.trim()) return;
        this.messages.push({ text: input.value.trim(), self: true });
        setTimeout(() => {
            this.messages.push({ text: 'Сообщение доставлено! 👍', self: false });
            this.renderChat();
        }, 500);
        input.value = '';
        this.renderChat();
    },

    esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; },

    destroy() {
        const appContainer = document.getElementById('app');
        if (appContainer) {
            const clone = appContainer.cloneNode(true);
            appContainer.replaceWith(clone);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
