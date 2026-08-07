# Ресторан Ла Чича — Сайт с онлайн-бронированием

Современный сайт ресторана итальянской кухни с цифровым меню, системой бронирования столов и доставкой еды.

## 🚀 Быстрый старт

```bash
# Установка зависимостей
npm install

# Разработка
npm run dev

# Продакшн
npm start

# Линтер
npm run lint

# Тесты
npm test
```

## 📁 Структура проекта

```
restaurant-site/
├── public/                 # Статические файлы (Frontend)
│   ├── css/
│   │   └── styles.css     # Полные стили (переменные, адаптивность, анимации)
│   ├── js/
│   │   └── app.js         # Основной JS (меню, бронирование, корзина, доставка)
│   ├── index.html         # Главная страница (SPA)
│   ├── robots.txt
│   └── sitemap.xml
├── server/                 # Backend (Node.js + Express)
│   ├── index.js           # Точка входа
│   ├── routes/
│   │   ├── booking.js     # API бронирования
│   │   ├── menu.js        # API меню
│   │   └── delivery.js    # API доставки
│   ├── middleware/        # Middleware (валидация, безопасность)
│   └── db/
│       ├── migrate.sql    # SQL миграции
│       └── seed.sql       # Начальные данные
├── nginx.conf             # Nginx конфигурация
├── Dockerfile             # Multi-stage Docker
├── docker-compose.yml     # Docker Compose
├── .github/workflows/     # CI/CD
└── package.json
```

## ✨ Функционал

### Frontend
- **Hero секция** — атмосферный баннер с параллаксом и CTA
- **Цифровое меню** — 5 категорий, табы, фото блюд, добавление в корзину
- **Бронирование столов** — календарь, выбор стола по схеме зала, валидация, SMS-подтверждение
- **Доставка** — расчет стоимости, бесплатная от 2000₽, корзина с количеством
- **Адаптивность** — mobile-first, от 320px до 1920px
- **Тёмная тема** — золотой акцент, премиальный дизайн
- **Доступность (a11y)** — ARIA, клавиатурная навигация, skip-link, prefers-reduced-motion
- **SEO** — meta теги, Schema.org Restaurant, sitemap.xml, robots.txt

### Backend
- **REST API** — бронирование, меню, доставка
- **Валидация** — express-validator, sanitize-html (XSS защита)
- **Rate limiting** — общий + специальный для бронирований
- **Security** — helmet, CSP, CORS, honeypot защита форм
- **PostgreSQL** — миграции, индексы, уникальные ограничения

## 🎨 Дизайн-система

### Цвета
```css
--bg: #0A0A0A;           /* Основной фон */
--surface: #141414;      /* Карточки */
--surface-hover: #1E1E1E;/* Hover состояния */
--text: #F5F5F5;         /* Основной текст */
--text-secondary: #A0A0A0;
--accent: #D4A853;       /* Золотой — премиум */
--accent-glow: rgba(212, 168, 83, 0.15);
--accent-secondary: #C2410C; /* Оранжевый — аппетит */
--danger: #EF4444;       /* Ошибки */
--success: #10B981;      /* Успех */
--border: rgba(255,255,255,0.08);
```

### Типографика
- **Display**: Playfair Display (элегантность, заголовки)
- **Body**: Inter (чистота, читаемость)
- **Mono**: JetBrains Mono (цены, цифры)

## 🔒 Безопасность

- **CSP** — строгая политика контента
- **Helmet** — security headers
- **Rate limiting** — 100 req/15min общий, 5 req/hour для бронирований
- **Sanitization** — sanitize-html на всех входящих данных
- **Honeypot** — скрытое поле для ботов
- **Form timing** — проверка времени заполнения формы
- **Validation** — клиентская + серверная

## ♿ Доступность (WCAG 2.1 AA)

- Семантический HTML5
- ARIA атрибуты (roles, labels, live regions)
- Клавиатурная навигация (Tab, Arrows, Enter, Escape)
- Skip link для скринридеров
- Фокус-индикаторы (focus-visible)
- Контрастность ≥ 4.5:1
- prefers-reduced-motion поддержка
- Минимальные таргеты 44x44px

## 📦 Деплой

### Docker
```bash
docker compose up -d --build
```

### Ручной
```bash
# На сервере
cd /var/www/restaurant-site
npm install --production
npm run db:migrate
npm start
# Настроить nginx (nginx.conf)
```

### CI/CD
GitHub Actions: тесты → сборка → деплой на сервер

## 📊 Мониторинг

- **Health check**: `GET /api/health`
- **API мониторинг** — проверка эндпоинтов каждые 5 минут
- **Analytics** — GA4 события (booking, menu_view, delivery)

## 📝 Чек-лист перед запуском

- [ ] HTTPS (SSL сертификат)
- [ ] Домен настроен (A-записи)
- [ ] Переменные окружения (.env)
- [ ] База данных мигрирована
- [ ] Тестовые бронирования проходят
- [ ] Картинки оптимизированы (WebP)
- [ ] PageSpeed > 85
- [ ] SEO теги проверены
- [ ] Доступность протестирована (axe-core)
- [ ] Безопасность (security headers)

## 📄 Лицензия

MIT — используйте свободно для своих проектов.

---

**Стек**: HTML5, CSS3 (Custom Properties), Vanilla JS (ES6+), Node.js 18, Express, PostgreSQL, Nginx, Docker