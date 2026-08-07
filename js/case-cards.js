/* ============================================================
   CASE CARDS LOADER - Загрузка карточек кейсов в витринах
   ============================================================ */

import config from './config.js';

let caseCardsData = null;
let intersectionObserver = null;
const CARDS_PER_BATCH = 5;
let visibilityChangeHandler = null;
const tabButtonListeners = new Map();
const cardHoverListeners = new Map();
let isDestroyed = false;
const gridLoadingState = new Map(); // category -> 'idle' | 'loading' | 'loaded'

function escapeUrl(url) {
    try {
        const parsed = new URL(url, window.location.origin);
        return parsed.href;
    } catch {
        return 'about:blank';
    }
}

function loadCaseCardsData() {
    const telegramUsername = config.telegram?.username ?? 'nodeforge_dev';
    const miniAppsBaseUrl = config.miniApps?.baseUrl ?? 'https://miniapps.nodeforge.dev';

    // Base data from inventory
    return [
        // Sites (10)
        {
            id: 'stomatology-clinic',
            category: 'sites',
            name: 'Стоматология-клиника',
            description: 'Стоматологическая клиника среднего звена теряет 20–30% заявок из-за отсутствия онлайн-записи',
            status: 'done',
            tech: ['Vanilla JS', 'CSS', 'HTML'],
            eta: '3–4 недели'
        },
        {
            id: 'clothing-store',
            category: 'sites',
            name: 'Интернет-магазин одежды',
            description: 'Бренд одежды среднего ценового сегмента теряет маржу из-за комиссий маркетплейсов (15–25%)',
            status: 'done',
            tech: ['React', 'Node.js', 'PostgreSQL'],
            eta: '3–10 дней'
        },
        {
            id: 'legal-consultant',
            category: 'sites',
            name: 'Юрист-консультант',
            description: 'Частный юрист теряет доверия клиентов из-за отсутствия конкретики, кейсов и прозрачности цен',
            status: 'done',
            tech: ['Vanilla JS', 'CSS', 'HTML'],
            eta: '10–14 дней'
        },
        {
            id: 'restaurant-cafe',
            category: 'sites',
            name: 'Ресторан-кафе',
            description: 'Ресторан-кафе нуждается в системе бронирования столов и онлайн-заказе еды/товаров',
            status: 'done',
            tech: ['React', 'Node.js', 'PostgreSQL'],
            eta: '7–10 дней'
        },
        {
            id: 'fitness-studio',
            category: 'sites',
            name: 'Фитнес-студия',
            description: 'Фитнес-студия нуждается в системе записи на занятия, карточках тренеров и управлении членствами',
            status: 'done',
            tech: ['Vue.js', 'Node.js', 'MongoDB'],
            eta: '5–12 дней'
        },
        {
            id: 'saas-product',
            category: 'sites',
            name: 'SaaS-продукт',
            description: 'Необходим лендинг с четким описанием функций и ценами для SaaS-продукта',
            status: 'done',
            tech: ['Next.js', 'TypeScript', 'PostgreSQL'],
            eta: '10–14 дней'
        },
        {
            id: 'real-estate-agency',
            category: 'sites',
            name: 'Агентство недвижимости',
            description: 'Агентство недвижимости нуждается в каталоге объектов с фильтрацией и интерактивной картой',
            status: 'soon',
            tech: ['React', 'Node.js', 'PostgreSQL'],
            eta: '7–14 дней'
        },
        {
            id: 'online-school',
            category: 'sites',
            name: 'Онлайн-школа',
            description: 'Онлайн-школа нуждается в платформе для публикации курсов, отзывов и системы зачисления',
            status: 'done',
            tech: ['Angular', 'Node.js', 'PostgreSQL'],
            eta: '12–20 дней'
        },
        {
            id: 'conference-event',
            category: 'sites',
            name: 'Конференция-мероприятие',
            description: 'Организатор конференции нуждается в платформе для публикации программы, информации о спикерах и онлайн-продажи билетов',
            status: 'done',
            tech: ['React', 'Node.js', 'PostgreSQL'],
            eta: '7–10 дней'
        },
        {
            id: 'job-board',
            category: 'sites',
            name: 'Доска вакансий',
            description: 'База вакансий для малого бизнеса с возможностью подачи резюме и поиска работы',
            status: 'done',
            tech: ['React', 'Node.js', 'PostgreSQL'],
            eta: '7–10 дней'
        },

        // Telegram Bots (10) - все боты работают через одного демо-бота
        {
            id: 'service-booking-bot',
            category: 'telegram-bots',
            name: 'Бот записи на услуги',
            description: 'Бот для записи на услуги с календарем, интеграцией напоминаний и системой управления записями',
            status: 'done',
            tech: ['Node.js', 'PostgreSQL', 'Redis'],
            eta: '5 дней',
            telegramUsername: `https://t.me/${telegramUsername}?start=case_service-booking-bot`
        },
        {
            id: 'food-delivery-bot',
            category: 'telegram-bots',
            name: 'Бот заказа еды/товаров',
            description: 'Telegram-бот для заказа еды/товаров с каталогом, корзиной, реферальной системой и уведомлениями',
            status: 'done',
            tech: ['Node.js', 'PostgreSQL', 'Redis'],
            eta: '7 дней',
            telegramUsername: `https://t.me/${telegramUsername}?start=case_food-delivery-bot`
        },
        {
            id: 'support-bot',
            category: 'telegram-bots',
            name: 'Бот поддержки',
            description: 'Бот для поддержки клиентов с FAQ-системой и возможностью передачи запроса живому оператору',
            status: 'done',
            tech: ['Node.js', 'PostgreSQL', 'Redis'],
            eta: '5 дней',
            telegramUsername: `https://t.me/${telegramUsername}?start=case_support-bot`
        },
        {
            id: 'lead-qualification-bot',
            category: 'telegram-bots',
            name: 'Бот-опросник для лидов',
            description: 'Бот для квалификации лидов с системой опросов и передачи qualified-лидов менеджеру',
            status: 'done',
            tech: ['Node.js', 'PostgreSQL', 'Redis'],
            eta: '4 дней',
            telegramUsername: `https://t.me/${telegramUsername}?start=case_lead-qualification-bot`
        },
        {
            id: 'financial-bot',
            category: 'telegram-bots',
            name: 'Бот учёта финансов',
            description: 'Telegram-бот для учёта финансов с категориями расходов, отчетами и аналитикой',
            status: 'done',
            tech: ['Node.js', 'PostgreSQL', 'Redis'],
            eta: '6 дней',
            telegramUsername: `https://t.me/${telegramUsername}?start=case_financial-bot`
        },
        {
            id: 'newsletter-bot',
            category: 'telegram-bots',
            name: 'Бот рассылок',
            description: 'Бот для управления рассылками с сегментацией подписчиков, дайджестами и аналитикой',
            status: 'done',
            tech: ['Node.js', 'PostgreSQL', 'Redis'],
            eta: '5 дней',
            telegramUsername: `https://t.me/${telegramUsername}?start=case_newsletter-bot`
        },
        {
            id: 'hr-bot',
            category: 'telegram-bots',
            name: 'HR-бот',
            description: 'HR-бот для сбора резюме, скрининга кандидатов и управления процессом найма',
            status: 'done',
            tech: ['Node.js', 'PostgreSQL', 'Redis'],
            eta: '7 дней',
            telegramUsername: `https://t.me/${telegramUsername}?start=case_hr-bot`
        },
        {
            id: 'habit-tracker-bot',
            category: 'telegram-bots',
            name: 'Бот-трекер привычек',
            description: 'Бот для трекинга привычек с системой чек-инов, стриками и мотивационными функциями',
            status: 'done',
            tech: ['Node.js', 'PostgreSQL', 'Redis'],
            eta: '5 дней',
            telegramUsername: `https://t.me/${telegramUsername}?start=case_habit-tracker-bot`
        },
        {
            id: 'community-bot',
            category: 'telegram-bots',
            name: 'Бот для сообщества',
            description: 'Бот для управления Telegram-сообществом с системой приветствия, антиспамом и модерации',
            status: 'done',
            tech: ['Node.js', 'PostgreSQL', 'Redis'],
            eta: '5 дней',
            telegramUsername: `https://t.me/${telegramUsername}?start=case_community-bot`
        },
        {
            id: 'store-bot-with-payments',
            category: 'telegram-bots',
            name: 'Бот-магазин с оплатой',
            description: 'Ин-Telegram магазин с интеграцией Telegram Payments для оплаты товаров и услуг',
            status: 'done',
            tech: ['Node.js', 'PostgreSQL', 'Redis'],
            eta: '7 дней',
            telegramUsername: `https://t.me/${telegramUsername}?start=case_store-bot-with-payments`
        },

        // Mini Apps (10)
        {
            id: 'clicker-game',
            category: 'miniapps',
            name: 'Игра-кликер',
            description: 'Игра-кликер для вовлечения пользователей с лидербордом и системой рефералов',
            status: 'soon',
            tech: ['React', 'TypeScript', 'Web3'],
            eta: '5–10 дней',
            url: `${miniAppsBaseUrl}/clicker-game`
        },
        {
            id: 'quiz-test',
            category: 'miniapps',
            name: 'Квиз-тест',
            description: 'Интерактивный квиз для сбора лидов и аналитики ответов для маркетинга',
            status: 'soon',
            tech: ['React', 'TypeScript', 'Web3'],
            eta: '5–10 дней',
            url: `${miniAppsBaseUrl}/quiz-test`
        },
        {
            id: 'catalog-with-cart',
            category: 'miniapps',
            name: 'Каталог с корзиной',
            description: 'Полноценный мини-магазин внутри Telegram с каталогом товаров и корзиной',
            status: 'soon',
            tech: ['React', 'TypeScript', 'Web3'],
            eta: '5–10 дней',
            url: `${miniAppsBaseUrl}/catalog-with-cart`
        },
        {
            id: 'statistics-dashboard',
            category: 'miniapps',
            name: 'Личный дашборд статистики',
            description: 'Дашборд для отслеживания фитнеса/финансов/привычек с аналитикой и графиками',
            status: 'soon',
            tech: ['React', 'TypeScript', 'Web3'],
            eta: '5–10 дней',
            url: `${miniAppsBaseUrl}/statistics-dashboard`
        },
        {
            id: 'booking-calendar',
            category: 'miniapps',
            name: 'Бронирование с календарём',
            description: 'Мини-приложение для бронирования времени/услуг с интерактивным календарем',
            status: 'soon',
            tech: ['React', 'TypeScript', 'Web3'],
            eta: '5–10 дней',
            url: `${miniAppsBaseUrl}/booking-calendar`
        },
        {
            id: 'resume-builder',
            category: 'miniapps',
            name: 'Конструктор визиток-резюме',
            description: 'Конструктор резюме с формами для заполнения и скачиванием PDF',
            status: 'soon',
            tech: ['React', 'TypeScript', 'Web3'],
            eta: '5–10 дней',
            url: `${miniAppsBaseUrl}/resume-builder`
        },
        {
            id: 'loyalty-program',
            category: 'miniapps',
            name: 'Программа лояльности',
            description: 'Система лояльности с отслеживанием баллов, купонов и истории покупок',
            status: 'soon',
            tech: ['React', 'TypeScript', 'Web3'],
            eta: '5–10 дней',
            url: `${miniAppsBaseUrl}/loyalty-program`
        },
        {
            id: 'event-app',
            category: 'miniapps',
            name: 'Приложение мероприятия',
            description: 'Приложение для мероприятия с программой, картой вендоров и профилями участников',
            status: 'soon',
            tech: ['React', 'TypeScript', 'Web3'],
            eta: '5–10 дней',
            url: `${miniAppsBaseUrl}/event-app`
        },
        {
            id: 'mini-crm',
            category: 'miniapps',
            name: 'Мини-CRM',
            description: 'Мини-CRM для управления сделками и клиентами для фрилансеров',
            status: 'soon',
            tech: ['React', 'TypeScript', 'Web3'],
            eta: '5–10 дней',
            url: `${miniAppsBaseUrl}/mini-crm`
        },
        {
            id: 'educational-trainer',
            category: 'miniapps',
            name: 'Образовательный тренажёр',
            description: 'Образовательный тренажёр с flashcards и тестами для улучшения навыков',
            status: 'soon',
            tech: ['React', 'TypeScript', 'Web3'],
            eta: '5–10 дней',
            url: `${miniAppsBaseUrl}/educational-trainer`
        }
    ];
}

function initCaseCards() {
    // Проверяем, есть ли элементы для отображения карточек
    const sitesGrid = document.querySelector('.sites');
    const telegramBotsGrid = document.querySelector('.telegram-bots');
    const miniappsGrid = document.querySelector('.miniapps');

    if (!sitesGrid || !telegramBotsGrid || !miniappsGrid) {
        return;
    }

    // Add ARIA tablist semantics to grids
    const grids = [
        { el: sitesGrid, category: 'sites' },
        { el: telegramBotsGrid, category: 'telegram-bots' },
        { el: miniappsGrid, category: 'miniapps' }
    ];

    grids.forEach(({ el, category }) => {
        el.setAttribute('role', 'tabpanel');
        el.setAttribute('aria-label', `${category} cases`);
        el.setAttribute('aria-roledescription', 'tab panel');
        if (!el.id) {
            el.id = `${category}-panel`;
        }
    });

    // Инициализируем IntersectionObserver для ленивой загрузки
    const observer = initIntersectionObserver();

    // Отображаем карточки по категориям
    displayCategoryCards('sites');

    return observer;
}

function initIntersectionObserver() {
    // Проверяем поддержку IntersectionObserver
    if (!('IntersectionObserver' in window)) {
        // Fallback: загружаем все карточки сразу
        loadAllCards();
        return null;
    }

    // Создаем observer для отслеживания видимости вкладок и карточек
    intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isDestroyed) {
                const grid = entry.target;
                const category = grid.dataset.category;
                const loadingState = gridLoadingState.get(category);
                if (grid.classList.contains('active') && loadingState !== 'loading' && loadingState !== 'loaded') {
                    gridLoadingState.set(category, 'loading');
                    grid.dataset.loaded = 'true';
                    loadCardsForGrid(grid);
                }
            }
        });
    }, {
        rootMargin: '100px', // Загружаем за 100px до входа в viewport
        threshold: 0.01
    });

    // Наблюдаем за всеми сетками карточек
    document.querySelectorAll('.sites, .telegram-bots, .miniapps').forEach(grid => {
        intersectionObserver.observe(grid);
    });

    // Также отслеживаем видимость вкладки (document.visibilityState)
    visibilityChangeHandler = handleVisibilityChange;
    document.addEventListener('visibilitychange', visibilityChangeHandler);

    return intersectionObserver;
}

function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && !isDestroyed) {
        const activeGrid = document.querySelector('.sites.active, .telegram-bots.active, .miniapps.active');
        if (activeGrid) {
            const category = activeGrid.dataset.category;
            const loadingState = gridLoadingState.get(category);
            if (loadingState !== 'loading' && loadingState !== 'loaded') {
                gridLoadingState.set(category, 'loading');
                activeGrid.dataset.loaded = 'true';
                loadCardsForGrid(activeGrid);
            }
        }
    }
}

function loadAllCards() {
    // Fallback для браузеров без IntersectionObserver
    document.querySelectorAll('.case-cards-grid').forEach(grid => {
        const category = grid.dataset.category;
        const loadingState = gridLoadingState.get(category);
        if (loadingState !== 'loading' && loadingState !== 'loaded') {
            gridLoadingState.set(category, 'loading');
            grid.dataset.loaded = 'true';
            loadCardsForGrid(grid);
        }
    });
}

function loadCardsForGrid(grid) {
    if (!caseCardsData || isDestroyed) return;
    const category = grid.dataset.category;
    
    // Prevent race conditions: check and set loading state atomically
    const currentState = gridLoadingState.get(category);
    if (currentState === 'loading' || currentState === 'loaded') {
        return;
    }
    gridLoadingState.set(category, 'loading');
    grid.dataset.loaded = 'true';
    
    const filteredCards = caseCardsData.filter(card => card.category === category);
    
    // Рендерим карточки батчами для неблокирующего UI
    renderCardsInBatches(grid, filteredCards, category);
}

function renderCardsInBatches(grid, cards, category) {
    let index = 0;
    
    function renderBatch() {
        if (isDestroyed) return;
        
        const batch = cards.slice(index, index + CARDS_PER_BATCH);
        index += CARDS_PER_BATCH;
        
        batch.forEach(card => {
            const cardElement = createCaseCard(card);
            grid.appendChild(cardElement);
            // fade-up элементы, добавленные динамически после инициализации
            // observer'а в main.js, никогда не попадут в его выборку —
            // показываем карточку сразу, без ожидания скролла.
            requestAnimationFrame(() => cardElement.classList.add('visible'));
        });
        
        if (index < cards.length) {
            // Используем requestIdleCallback для неблокирующего рендеринга
            if ('requestIdleCallback' in window) {
                requestIdleCallback(renderBatch);
            } else {
                setTimeout(renderBatch, 0);
            }
        } else {
            // Все карточки загружены - инициализируем hover эффекты
            gridLoadingState.set(category, 'loaded');
            setupCaseCardHover(grid);
        }
    }
    
    renderBatch();
}

function displayCategoryCards(category) {
    const grids = {
        'sites': document.querySelector('.sites'),
        'telegram-bots': document.querySelector('.telegram-bots'),
        'miniapps': document.querySelector('.miniapps')
    };

    // Скрываем все сетки
    Object.values(grids).forEach(grid => {
        if (grid) {
            grid.classList.remove('active');
        }
    });

    // Отображаем выбранную сетку с карточками
    const activeGrid = grids[category];
    if (activeGrid) {
        activeGrid.classList.add('active');
        
        // Если сетка еще не загружена, загружаем карточки
        const loadingState = gridLoadingState.get(category);
        if (loadingState !== 'loading' && loadingState !== 'loaded') {
            gridLoadingState.set(category, 'loading');
            activeGrid.dataset.loaded = 'true';
            loadCardsForGrid(activeGrid);
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function createCaseCard(card) {
    const cardElement = document.createElement('article');
    const categoryClass = `category-${card.category}`;
    cardElement.className = `case-card fade-up ${categoryClass}`;
    cardElement.dataset.caseId = card.id;
    cardElement.dataset.caseCategory = card.category;
    
    // Определяем CTA и иконку в зависимости от категории
    let ctaElement, iconElement, statusBadge;
    
    if (card.category === 'sites') {
        if (card.status === 'done') {
            const safeUrl = escapeUrl(`/cases/${card.id}/`);
            ctaElement = `<a href="${safeUrl}" class="btn btn-primary" aria-label="Открыть кейс сайта ${escapeHtml(card.name)}">Посмотреть</a>`;
            statusBadge = `<div class="case-status-badge done" role="status" aria-label="Кейс готов к просмотру"><span class="status-dot"></span>Готово</div>`;
        } else {
            ctaElement = `<span class="soon-badge" aria-disabled="true">Скоро</span>`;
            statusBadge = `<div class="case-status-badge soon" role="status" aria-label="Кейс скоро будет доступен"><span class="status-dot"></span>Скоро</div>`;
        }
        iconElement = `<span class="case-type" aria-hidden="true">Сайт</span>`;
    } else if (card.category === 'telegram-bots') {
        if (card.status === 'done') {
            const safeUrl = escapeUrl(card.telegramUsername);
            ctaElement = `<a href="${safeUrl}" class="btn btn-primary" target="_blank" rel="noopener" aria-label="Открыть Telegram-бот ${escapeHtml(card.name)}">Открыть бота</a>`;
            statusBadge = `<div class="case-status-badge done" role="status" aria-label="Бот готов к использованию"><span class="status-dot"></span>Готово</div>`;
        } else {
            ctaElement = `<span class="soon-badge" aria-disabled="true">Скоро</span>`;
            statusBadge = `<div class="case-status-badge soon" role="status" aria-label="Бот скоро будет доступен"><span class="status-dot"></span>Скоро</div>`;
        }
        iconElement = `<span class="case-type" aria-hidden="true">Бот</span>`;
    } else if (card.category === 'miniapps') {
        if (card.status === 'done') {
            const safeUrl = escapeUrl(card.url);
            ctaElement = `<a href="${safeUrl}" class="btn btn-primary" target="_blank" rel="noopener" aria-label="Открыть Mini App ${escapeHtml(card.name)}">Открыть</a>`;
            statusBadge = `<div class="case-status-badge done" role="status" aria-label="Mini App готов к использованию"><span class="status-dot"></span>Готово</div>`;
        } else {
            ctaElement = `<span class="soon-badge" aria-disabled="true">Скоро</span>`;
            statusBadge = `<div class="case-status-badge soon" role="status" aria-label="Mini App скоро будет доступен"><span class="status-dot"></span>Скоро</div>`;
        }
        iconElement = `<span class="case-type" aria-hidden="true">Mini App</span>`;
    }
    
    // Create a summary for screen readers
    const summaryText = `${card.name}, ${card.description}. Технологии: ${card.tech.join(', ')}. Срок: ${card.eta}. Статус: ${card.status === 'done' ? 'Доступен' : 'Скоро будет доступен'}.`;
    
    cardElement.innerHTML = `
        <div class="case-header">
            ${iconElement}
            ${statusBadge}
        </div>
        <h3>${escapeHtml(card.name)}</h3>
        <p>${escapeHtml(card.description)}</p>
        <div class="case-stack">
            ${card.tech.map(t => `<span>${escapeHtml(t)}</span>`).join('')}
        </div>
        <div class="case-meta">Срок: ${escapeHtml(card.eta)}</div>
        <div class="case-cta">
            ${ctaElement}
        </div>
    `;
    
    // Add ARIA attributes for better accessibility
    cardElement.setAttribute('aria-label', summaryText);
    
    return cardElement;
}

function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContainer = document.querySelector('.tab-buttons');

    if (!tabContainer || tabButtons.length === 0) return;

    // Set up tablist role
    tabContainer.setAttribute('role', 'tablist');
    
    // Ensure first tab has aria-selected="true" on init
    tabButtons.forEach((button, index) => {
        button.setAttribute('role', 'tab');
        if (!button.id) {
            const category = button.getAttribute('data-category');
            button.id = `tab-${category}`;
        }
        if (index === 0) {
            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');
        } else {
            button.setAttribute('aria-selected', 'false');
        }
    });

    tabButtons.forEach(button => {
        const clickHandler = function() {
            const category = this.getAttribute('data-category');
            
            // Обновляем активный класс и ARIA атрибуты
            updateTabSelection(this);
            
            // Отображаем карточки для выбранной категории
            displayCategoryCards(category);
        };
        
        const keydownHandler = function(e) {
            const allTabs = Array.from(tabButtons);
            const currentIndex = allTabs.indexOf(this);

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % allTabs.length;
                allTabs[nextIndex].focus();
                updateTabSelection(allTabs[nextIndex]);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + allTabs.length) % allTabs.length;
                allTabs[prevIndex].focus();
                updateTabSelection(allTabs[prevIndex]);
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const category = this.getAttribute('data-category');
                updateTabSelection(this);
                displayCategoryCards(category);
            }
        };
        
        const focusHandler = function() {
            this.classList.add('focus-visible');
        };
        
        const blurHandler = function() {
            this.classList.remove('focus-visible');
        };

        button.addEventListener('click', clickHandler);
        button.addEventListener('keydown', keydownHandler);
        button.addEventListener('focus', focusHandler);
        button.addEventListener('blur', blurHandler);
        
        // Store listeners for cleanup
        tabButtonListeners.set(button, {
            click: clickHandler,
            keydown: keydownHandler,
            focus: focusHandler,
            blur: blurHandler
        });
    });
}

function updateTabSelection(selectedButton) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // Update all buttons
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
    });
    
    // Update selected button
    selectedButton.classList.add('active');
    selectedButton.setAttribute('aria-selected', 'true');
    
    // Update aria-controls and aria-labelledby for proper tab-panel association
    const category = selectedButton.getAttribute('data-category');
    const tabPanel = document.querySelector(`.${category}`);
    if (tabPanel) {
        selectedButton.setAttribute('aria-controls', tabPanel.id || `${category}-panel`);
        tabPanel.setAttribute('aria-labelledby', selectedButton.id || `tab-${category}`);
    }
}

function setupCaseCardHover(grid) {
    const caseCards = grid.querySelectorAll('.case-card');
    const category = grid.dataset.category;
    
    caseCards.forEach(card => {
        const touchStartHandler = function(e) {
            this.classList.add('touch-active');
        };
        
        const touchEndHandler = function() {
            setTimeout(() => this.classList.remove('touch-active'), 150);
        };
        
        const mouseEnterHandler = function() {
            const icon = this.querySelector('.case-type');
            if (icon) {
                icon.style.color = 'var(--accent)';
                icon.style.transform = 'translateY(-1px)';
            }
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
            this.style.borderColor = 'var(--steel-3)';
        };
        
        const mouseLeaveHandler = function() {
            const icon = this.querySelector('.case-type');
            if (icon) {
                icon.style.color = '';
                icon.style.transform = '';
            }
            this.style.transform = '';
            this.style.boxShadow = '';
            this.style.borderColor = '';
        };
        
        const focusHandler = function() {
            this.classList.add('focus-visible');
        };

        card.addEventListener('touchstart', touchStartHandler, { passive: true });
        card.addEventListener('touchend', touchEndHandler);
        card.addEventListener('mouseenter', mouseEnterHandler);
        card.addEventListener('mouseleave', mouseLeaveHandler);
        card.addEventListener('focus', focusHandler, { passive: true });
        
        // Store listeners for cleanup
        const cardKey = `${category}-${card.dataset.caseId}`;
        cardHoverListeners.set(cardKey, {
            touchstart: touchStartHandler,
            touchend: touchEndHandler,
            mouseenter: mouseEnterHandler,
            mouseleave: mouseLeaveHandler,
            focus: focusHandler
        });
    });
}

function destroy() {
    isDestroyed = true;
    
    // Disconnect IntersectionObserver
    if (intersectionObserver) {
        intersectionObserver.disconnect();
        intersectionObserver = null;
    }
    
    // Remove visibilitychange listener
    if (visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', visibilityChangeHandler);
        visibilityChangeHandler = null;
    }
    
    // Remove tab button listeners
    tabButtonListeners.forEach((listeners, button) => {
        button.removeEventListener('click', listeners.click);
        button.removeEventListener('keydown', listeners.keydown);
        button.removeEventListener('focus', listeners.focus);
        button.removeEventListener('blur', listeners.blur);
    });
    tabButtonListeners.clear();
    
    // Remove card hover listeners
    cardHoverListeners.forEach((listeners, key) => {
        const [category, caseId] = key.split('-', 2);
        const grid = document.querySelector(`.${category}`);
        if (grid) {
            const card = grid.querySelector(`[data-case-id="${caseId}"]`);
            if (card) {
                card.removeEventListener('touchstart', listeners.touchstart);
                card.removeEventListener('touchend', listeners.touchend);
                card.removeEventListener('mouseenter', listeners.mouseenter);
                card.removeEventListener('mouseleave', listeners.mouseleave);
                card.removeEventListener('focus', listeners.focus);
            }
        }
    });
    cardHoverListeners.clear();
    
    // Clear data
    caseCardsData = null;
    gridLoadingState.clear();
}

// Инициализируем данные карточек при загрузке страницы
function init() {
    caseCardsData = loadCaseCardsData();
    const observer = initCaseCards();
    setupTabSwitching();

    // Cleanup on page unload
    window.addEventListener('pagehide', destroy, { once: true });
    window.addEventListener('beforeunload', destroy, { once: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}