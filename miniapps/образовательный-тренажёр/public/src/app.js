'use strict';

const App = {
    decks: (() => { try { return JSON.parse(localStorage.getItem('edu_decks') || '[]'); } catch (e) { return []; } })(),
    stats: (() => { try { return JSON.parse(localStorage.getItem('edu_stats') || '{"streak":0,"bestStreak":0,"reviews":0,"learned":0,"retention":0,"week":[]}'); } catch (e) { return {streak:0,bestStreak:0,reviews:0,learned:0,retention:0,week:[]}; } })(),
    currentScreen: 'home',
    studyDeck: null,
    studyCards: [],
    studyIndex: 0,
    studyStartTime: null,
    quizCards: [],
    quizIndex: 0,
    quizCorrect: 0,
    quizErrors: 0,
    quizStartTime: null,

    _eventsBound: false,
    _boundHandlers: [],

    init() {
        if (this.decks.length === 0) this.loadDemoData();
        this.render();
        this.bindNav();
        this.updateHome();
    },

    loadDemoData() {
        this.decks = [
            { id: '1', title: 'Irregular Verbs', emoji: '📚', cards: [
                { front: 'go — ?', back: 'went — пошёл', hint: 'n-past form', example: 'I went to school.' },
                { front: 'eat — ?', back: 'ate — ел', hint: 'vowel change', example: 'She ate breakfast.' },
                { front: 'run — ?', back: 'ran — бежал', hint: 'short vowel', example: 'He ran fast.' }
            ]},
            { id: '2', title: 'JavaScript Basics', emoji: '💻', cards: [
                { front: 'Что такое closure?', back: 'Функция + её лексическое окружение', hint: 'Scope concept', example: '' },
                { front: 'var vs let vs const?', back: 'let/const — block scope, var — function scope', hint: 'Scoping rules', example: '' }
            ]}
        ];
        try {
            localStorage.setItem('edu_decks', JSON.stringify(this.decks));
        } catch (e) {
            // Storage unavailable
        }
    },

    bindNav() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.currentScreen = item.dataset.screen;
                this.render();
                if (this.currentScreen === 'home') this.updateHome();
            });
        });
    },

    render() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => {
            n.classList.toggle('active', n.dataset.screen === this.currentScreen);
            const screens = n.closest('.bottom-nav')?.previousElementSibling;
        });

        const screenEl = document.getElementById(this.currentScreen + '-screen');
        if (screenEl) screenEl.classList.add('active');

        this.bindEvents();
        if (this.currentScreen === 'home') this.updateHome();
        if (this.currentScreen === 'progress') this.renderProgress();
        if (this.currentScreen === 'achievements') this.renderAchievements();
    },

    bindEvents() {
        if (this._eventsBound) return;
        this._eventsBound = true;

        const addListener = (id, event, handler) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener(event, handler);
                this._boundHandlers.push({ el, event, handler });
            }
        };

        addListener('start-review-btn', 'click', () => this.startReview());
        addListener('start-quiz-btn', 'click', () => this.startQuiz());
        addListener('add-deck-btn', 'click', () => this.showCreateDeckModal());
        addListener('study-back-btn', 'click', () => this.endStudy());
        addListener('quiz-back-btn', 'click', () => this.endQuiz());
        addListener('settings-btn', 'click', () => {
            this.currentScreen = 'settings';
            this.render();
        });
        addListener('settings-back-btn', 'click', () => {
            this.currentScreen = 'home';
            this.render();
        });
        addListener('flashcard', 'click', () => this.flipCard());
        addListener('flashcard', 'keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.flipCard(); }
        });
        document.querySelectorAll('.grade-btn').forEach(btn => {
            const handler = () => this.gradeCard(btn.dataset.grade);
            btn.addEventListener('click', handler);
            this._boundHandlers.push({ el: btn, event: 'click', handler });
        });
        addListener('create-deck-form', 'submit', (e) => {
            e.preventDefault();
            this.createDeck();
        });
        addListener('cancel-deck-btn', 'click', () => {
            document.getElementById('create-deck-modal').hidden = true;
        });
    },

    updateHome() {
        const totalDue = this.decks.reduce((s, d) => s + d.cards.length, 0);
        document.getElementById('due-count').textContent = totalDue;
        document.getElementById('review-count-btn').textContent = totalDue;
        document.getElementById('streak-count').textContent = this.stats.streak;
        document.getElementById('best-streak').textContent = this.stats.bestStreak;
        document.getElementById('day-number').textContent = this.stats.streak || 1;
        this.renderDecks();
        this.renderWeekBar();
    },

    renderDecks() {
        const container = document.getElementById('deck-list');
        const empty = document.getElementById('decks-empty');
        if (this.decks.length === 0) {
            empty.style.display = 'block';
            container.innerHTML = '';
            container.appendChild(empty);
            return;
        }
        empty.style.display = 'none';
        container.innerHTML = this.decks.map(d => `
            <div class="deck-item" onclick="App.startDeckReview('${d.id}')">
                <span class="deck-emoji">${d.emoji}</span>
                <div class="deck-info">
                    <div class="deck-name">${this.esc(d.title)}</div>
                    <div class="deck-count">${d.cards.length} карточек</div>
                </div>
            </div>
        `).join('');
    },

    renderWeekBar() {
        document.querySelectorAll('.day-dot').forEach((dot, i) => {
            dot.classList.toggle('done', this.stats.week.includes(i));
        });
    },

    startReview() {
        const allCards = this.decks.flatMap(d => d.cards.map(c => ({ ...c, deckTitle: d.title })));
        if (allCards.length === 0) { this.showToast('Нет карточек для повторения'); return; }
        this.studyCards = this.shuffle(allCards);
        this.studyIndex = 0;
        this.studyStartTime = Date.now();
        this.currentScreen = 'study';
        this.render();
        this.showCard();
    },

    startDeckReview(deckId) {
        const deck = this.decks.find(d => d.id === deckId);
        if (!deck || deck.cards.length === 0) return;
        this.studyCards = this.shuffle(deck.cards.map(c => ({ ...c, deckTitle: deck.title })));
        this.studyIndex = 0;
        this.studyStartTime = Date.now();
        this.studyDeck = deck;
        this.currentScreen = 'study';
        this.render();
        this.showCard();
    },

    showCard() {
        if (this.studyIndex >= this.studyCards.length) { this.endStudy(); return; }
        const card = this.studyCards[this.studyIndex];
        document.getElementById('card-front-text').textContent = card.front;
        document.getElementById('card-back-text').textContent = card.back;
        document.getElementById('card-index').textContent = this.studyIndex + 1;
        document.getElementById('total-cards').textContent = this.studyCards.length;
        document.getElementById('study-deck-name').textContent = card.deckTitle || '';
        document.getElementById('grade-buttons').hidden = true;
        document.getElementById('flashcard').classList.remove('flipped');

        const hint = document.getElementById('hint-toggle');
        hint.onclick = () => {
            document.getElementById('hint-text').textContent = card.hint || 'Нет подсказки';
        };
    },

    flipCard() {
        const fc = document.getElementById('flashcard');
        fc.classList.toggle('flipped');
        document.getElementById('grade-buttons').hidden = !fc.classList.contains('flipped');
    },

    gradeCard(grade) {
        this.studyIndex++;
        this.stats.reviews++;
        if (grade === 'good' || grade === 'easy') this.stats.learned++;
        try {
            localStorage.setItem('edu_stats', JSON.stringify(this.stats));
        } catch (e) {
            // Storage unavailable
        }
        this.showCard();
    },

    endStudy() {
        const elapsed = Math.floor((Date.now() - this.studyStartTime) / 1000);
        document.getElementById('session-reviewed').textContent = this.stats.reviews;
        document.getElementById('session-correct').textContent = this.stats.learned;
        document.getElementById('session-time').textContent = `${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')}`;
        document.getElementById('session-complete-modal').hidden = false;
        document.getElementById('session-home-btn').onclick = () => {
            document.getElementById('session-complete-modal').hidden = true;
            this.currentScreen = 'home';
            this.render();
        };
        this.updateStreak();
    },

    startQuiz() {
        const allCards = this.decks.flatMap(d => d.cards);
        if (allCards.length < 2) { this.showToast('Нужно минимум 2 карточки'); return; }
        this.quizCards = this.shuffle(allCards).slice(0, 10);
        this.quizIndex = 0;
        this.quizCorrect = 0;
        this.quizErrors = 0;
        this.quizStartTime = Date.now();
        this.currentScreen = 'quiz';
        this.render();
        this.showQuizQuestion();
    },

    showQuizQuestion() {
        if (this.quizIndex >= this.quizCards.length) { this.endQuiz(); return; }
        const card = this.quizCards[this.quizIndex];
        document.getElementById('quiz-question').textContent = card.front;
        document.getElementById('quiz-index').textContent = this.quizIndex + 1;
        document.getElementById('quiz-total').textContent = this.quizCards.length;
        document.getElementById('quiz-errors').textContent = this.quizErrors;
        document.getElementById('quiz-correct').textContent = this.quizCorrect;

        const options = document.getElementById('quiz-options');
        const wrong = this.quizCards.filter(c => c.back !== card.back);
        const distractors = this.shuffle(wrong).slice(0, 3).map(c => c.back);
        const allOptions = this.shuffle([card.back, ...distractors]);

        options.innerHTML = allOptions.map(opt => `
            <button class="quiz-option" onclick="App.answerQuiz(this, '${this.esc(opt)}', '${this.esc(card.back)}')">${this.esc(opt)}</button>
        `).join('');
    },

    answerQuiz(el, selected, correct) {
        const options = document.querySelectorAll('.quiz-option');
        options.forEach(o => o.disabled = true);

        if (selected === correct) {
            el.classList.add('correct');
            this.quizCorrect++;
        } else {
            el.classList.add('wrong');
            this.quizErrors++;
            options.forEach(o => { if (o.textContent === correct) o.classList.add('correct'); });
        }

        setTimeout(() => {
            this.quizIndex++;
            this.showQuizQuestion();
        }, 1000);
    },

    endQuiz() {
        const elapsed = Math.floor((Date.now() - this.quizStartTime) / 1000);
        document.getElementById('result-score').textContent = this.quizCorrect;
        document.getElementById('result-total').textContent = this.quizCards.length;
        document.getElementById('result-correct').textContent = this.quizCorrect;
        document.getElementById('result-wrong').textContent = this.quizErrors;
        document.getElementById('result-time').textContent = `${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')}`;
        this.currentScreen = 'quiz-results';
        this.render();

        document.getElementById('retry-quiz-btn').onclick = () => this.startQuiz();
        document.getElementById('quiz-home-btn').onclick = () => { this.currentScreen = 'home'; this.render(); };
        document.getElementById('review-mistakes-btn').onclick = () => { this.showToast('Повторение ошибок...'); this.startQuiz(); };
    },

    showCreateDeckModal() {
        document.getElementById('create-deck-modal').hidden = false;
    },

    createDeck() {
        const title = document.getElementById('deck-title-input').value.trim();
        if (!title) return;
        const emoji = document.getElementById('deck-emoji-input').value || '📚';
        this.decks.push({ id: Date.now().toString(), title, emoji, cards: [] });
        try {
            localStorage.setItem('edu_decks', JSON.stringify(this.decks));
        } catch (e) {
            // Storage unavailable
        }
        document.getElementById('create-deck-modal').hidden = true;
        document.getElementById('deck-title-input').value = '';
        this.renderDecks();
        this.showToast('Колода создана!');
    },

    renderProgress() {
        document.getElementById('stat-streak').textContent = this.stats.streak;
        document.getElementById('stat-reviews').textContent = this.stats.reviews;
        document.getElementById('stat-learned').textContent = this.stats.learned;
        document.getElementById('stat-retention').textContent = this.stats.reviews > 0 ?
            Math.round((this.stats.learned / this.stats.reviews) * 100) + '%' : '0%';

        const calendar = document.getElementById('calendar');
        if (calendar) {
            const days = 28;
            calendar.innerHTML = Array.from({ length: days }, (_, i) => {
                const day = i + 1;
                const done = this.stats.week.includes(i % 7);
                return `<div class="cal-day ${done ? 'active' : ''}">${day}</div>`;
            }).join('');
        }
    },

    renderAchievements() {
        const achievements = [
            { name: 'Первая карточка', icon: '🌟', done: this.stats.reviews > 0 },
            { name: '10 повторений', icon: '📚', done: this.stats.reviews >= 10 },
            { name: 'Сtrip 3 дня', icon: '🔥', done: this.stats.streak >= 3 },
            { name: 'Сtrip 7 дней', icon: '💪', done: this.stats.streak >= 7 },
            { name: '50 карточек', icon: '🎓', done: this.stats.learned >= 50 },
        ];
        const grid = document.getElementById('achievements-grid');
        grid.innerHTML = achievements.map(a => `
            <div class="stat-card" style="opacity: ${a.done ? 1 : 0.4}">
                <div class="stat-icon">${a.icon}</div>
                <div class="stat-label" style="font-weight:600;">${a.name}</div>
            </div>
        `).join('');
        document.getElementById('earned-count').textContent = achievements.filter(a => a.done).length;
        document.getElementById('total-achievements').textContent = achievements.length;
    },

    updateStreak() {
        const today = new Date().getDay();
        if (!this.stats.week.includes(today)) {
            this.stats.week.push(today);
            this.stats.streak++;
            if (this.stats.streak > this.stats.bestStreak) this.stats.bestStreak = this.stats.streak;
        }
        try {
            localStorage.setItem('edu_stats', JSON.stringify(this.stats));
        } catch (e) {
            // Storage unavailable
        }
    },

    shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    },

    showToast(msg) {
        const c = document.getElementById('toast-container');
        if (!c) return;
        const t = document.createElement('div');
        t.className = 'toast';
        t.textContent = msg;
        c.appendChild(t);
        setTimeout(() => t.remove(), 2500);
    },

    esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; },

    destroy() {
        this._boundHandlers.forEach(({ el, event, handler }) => {
            el.removeEventListener(event, handler);
        });
        this._boundHandlers = [];
        this._eventsBound = false;
        this.decks = [];
        this.stats = { streak: 0, bestStreak: 0, reviews: 0, learned: 0, retention: 0, week: [] };
    }
};

function initApp() { App.init(); }
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
window.appDestroy = () => App.destroy();
