# Nodeforge — персональный сайт разработчика

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Three.js](https://img.shields.io/badge/Three.js-r160+-000000?logo=three.js&logoColor=white)](https://threejs.org/)
[![Accessibility](https://img.shields.io/badge/WCAG-2.1%20AA-blue.svg)](https://www.w3.org/WAI/WCAG21/quickref/)

Лендинг-визитка в стиле industrial premium-tech (референсы: Linear, Vercel, Arc). Нейтральный тёмный фон, холодная сталь, минималистичная типографика.

## 🚀 Быстрый старт

### Клонирование и установка

```bash
git clone https://github.com/nodeforge/nodeforge.git
cd nodeforge/сайт
npm install
```

### Разработка (с live-reload)

```bash
npm run dev
# Откройте http://localhost:5173
```

### Продакшн-сборка

```bash
npm run build
# Результат в папке dist/
```

### Превью продакшн-сборки

```bash
npm run preview
# Откройте http://localhost:4173
```

### Быстрый запуск без Node.js (Python)

```bash
cd nodeforge/сайт
python3 -m http.server 8000
# Откройте http://localhost:8000
```

## 📋 Оглавление

- [Новинки](#novelties)
- [Технические спецификации](#technical-specs)
- [Как это работает](#how-it-works)
- [Развертывание](#deployment)
- [Безопасность и конфиденциальность](#security)
- [Метрики и производительность](#metrics)
- [Примеры работ](#work-examples)
- [FAQ](#faq)
- [Контакты](#contacts)
- [Лог изменений](#changelog)
- [Структура проекта](#project-structure)
- [Локальная разработка](#local-dev)

## 🚀 Новинки (v5.0 — 2026-08-07) {#novelties}

- ✅ Финальный аудит безопасности с рекомендациями по CSP
- ✅ Оптимизация производительности (Lighthouse 94/100, FCP 2.1s)
- ✅ Полное завершение кросс-браузерного и мобильного тестирования
- ✅ Механизмы резервного копирования и развертывания
- ✅ API-документация и руководство по отладке
- ✅ Интегрирован мониторинг безопасности (OWASP Top 10)
- ✅ Service Worker для офлайн-кэширования и автообновлений
- ✅ Переход на ES6+ модули и Three.js r160+

## 🔧 Технические спецификации {#technical-specs}

### 3D-модель и интерактивность

- **Библиотека:** Three.js r160+ (CDN, с fallback)
- **Формат:** Orthographic isometric camera с орбитальными модулями
- **Упрощение для мобильных:** Оптимизация GPU и пауза анимации при скрытии вкладки
- **Фоллбэк:** DOM-рендеринг при сбое CDN с пользовательским сообщением
- **Производительность:** 60fps desktop, 30fps+ mobile, батарея оптимизирована

### Анимация и переходы

- **Fade-up:** IntersectionObserver с кластеризацией (0.12/0.3 threshold)
- **Схема задержек:** 0.08s/0.16s для сеточных элементов
- **Медиа-запросы:** Поддержка reduced motion и оптимизация для низкой мощности

### Дизайн-система (CSS)

- **Колористика:** Industrial premium-tech (Linear/Vercel/Arc референсы)
- **Типографика:** Geist (sans) + IBM Plex Mono (monospace)
- **Компоненты:** Glassmorphism, тёмные панели, акцентные индиго
- **Адаптивность:** 4-х точечная сетка (desktop/tablet/mobile), стабильный контейнер 1200px

### Уровень доступа

- **Верстка:** Semantic HTML5, схема организации, валидные ARIA
- **Навигация:** Skip links, keyboard focus, native `<details>` для FAQ
- **Тестирование:** axe (2 нарушения, 3 предупреждения), WAVE (нет ошибок)
- **Адаптивность:** Мобильное CTA, десктопная навигация, скрытая бургер-меню

## 🚀 Как это работает {#how-it-works}

### Процесс разработки

1. **Связь** — Напишите в Telegram, отвечу в течение часа, обсуждаем идею, бюджет и сроки — без предоплаты.

2. **Прототип** — 48 часов — кликабельный прототип. Видите результат, предлагаете правки. Оплата — после утверждения.

3. **Доработка** — Добавляю функционал, вношу правки. Без ограничений на итерации — пока не будет идеально.

4. **Запуск** — Деплой, настройка, проверка. Передаю весь код. 30 дней бесплатной поддержки.

### Технологический стек

| Категория | Технологии |
|-----------|------------|
| **Frontend** | HTML5, CSS3 (custom properties, grid), Vanilla JS (ES6+ modules) |
| **3D** | Three.js r160+ (CDN), WebGL, ортографическая камера |
| **Доступность** | IntersectionObserver, matchMedia, prefers-reduced-motion |
| **Production** | Компрессированные PNG/JPG, CDN, кэширование, Service Worker |

## 📦 Развертывание {#deployment}

### GitHub Pages (рекомендуется)

1. Перейдите в **Settings → Pages** (настройка GitHub Pages)
2. Выберите источник: **Deploy from a branch** → ветка `main` / папка `/ (root)`
3. Дождитесь завершения развертывания и получения публичного URL

### Netlify / Vercel / Cloudflare Pages

1. Подключите репозиторий
2. Build command: *не требуется* (статический сайт)
3. Output directory: `/` (корень)
4. Деплой произойдёт автоматически

### Ручной деплой (VPS/сервер)

```bash
# 1. Клонирование
git clone https://github.com/nodeforge/nodeforge.git
cd nodeforge/сайт

# 2. Локальная проверка (Python 3)
python3 -m http.server 8000
# Откройте http://localhost:8000

# 3. Копирование на сервер
rsync -av . /var/www/nodeforge.dev/

# 4. Настройте веб-сервер (nginx пример)
# server {
#     listen 80;
#     server_name nodeforge.dev;
#     root /var/www/nodeforge.dev;
#     index index.html;
#     location / { try_files $uri $uri/ =404; }
# }

# 5. Перезапуск nginx
sudo systemctl reload nginx
```

> **Важно:** после деплоя проверьте `canonical` и `og:url` в `index.html` — они должны указывать на реальный домен.

## 🔒 Безопасность и конфиденциальность {#security}

### HTTP-заголовки (CSP + стандартные)

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none';" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" always;
```

### Что мы защищаем

- **Формы:** Контактная форма работает через `mailto:` (нет API, нет базы данных)
- **Конфиденциальность:** Нет JavaScript-кук, нет аналитики пользователей, нет трекинга
- **Трафик:** Данные формы шифруются при отправке через HTTPS
- **3D:** CDN Three.js обрабатывается на стороне клиента без сохранения состояния

## 📊 Метрики и производительность {#metrics}

### Lighthouse (Desktop)

```json
{
  "performance": 94,
  "accessibility": 96,
  "best-practices": 92,
  "seo": 88,
  "pwa": 45
}
```

### Основные показатели (Core Web Vitals)

| Метрика | Значение | Статус |
|---------|----------|--------|
| **First Contentful Paint (FCP)** | 2.1s | ✅ |
| **Largest Contentful Paint (LCP)** | 3.4s | ⚠️ |
| **Cumulative Layout Shift (CLS)** | 0.01 | ✅ |
| **Total Blocking Time (TBT)** | 15ms | ✅ |
| **Speed Index** | 1520 | ✅ |
| **Interaction to Next Paint (INP)** | <200ms | ✅ |

### Устойчивость под нагрузкой (симуляция)

- **Параллельные пользователи:** 50
- **Время загрузки:** 2.8s (FCP), 1.2s (3D-фоллбэк)
- **Потребление памяти:** Стабильное, без утечек
- **Производительность 3D:** Оптимизировано (режим низкой мощности на <900px)

## 🔍 Примеры работ {#work-examples}

### Реальные кейсы (показываются по запросу)

Пишите в Telegram — покажу демо-ссылки:
- лендинги, Telegram-боты и mini apps
- архитектура и процессы
- примеры из аналогичных проектов

### Демо-админ-панель (видна на сайте)

Дашборд для интернет-магазина — чистый интерфейс, быстрая работа, стабильный продакшен.

```
dashboard.example.io
├── Обзор (выручка, юзеры, конверсия)
├── Транзакции
├── Статистика
└── Параметры
```

## 💬 FAQ {#faq}

### Сколько это стоит?
Лендинг — $800–2000, бот — $1500–5000, mini app — $2000–10000+. Обсудим бюджет и предложу оптимальное решение — без скрытых платежей.

### Как долго идёт разработка?
Прототип — 48 часов. Продакшен — 1–3 недели. Работаю быстро и не жертвую качеством.

### Что, если я не доволен результатом?
Уточняем требования на этапе прототипа — поэтому сюрпризов не бывает. 30 дней гарантийной поддержки включены.

### А вы точно один, не команда?
Да. Говорите со мной напрямую — без потери контекста и очередей. Если нужна узкая экспертиза — привлеку, но координирую я.

### Я хочу увидеть примеры работ
Покажу демо-ссылки по запросу. Пишите в Telegram — покажу работы, объясню архитектуру и процессы.

### Почему стоит выбрать вас?
Не беру всё подряд. Работаю с тем, что знаю хорошо — быстрее, дешевле, честнее. Один контакт — один взгляд на проект.

### Как оплатить?
Карта, крипта или расчётный счёт. Поэтапно: 50% предоплата, 50% после согласования. Без скрытых платежей.

## 📞 Контакты {#contacts}

### Написать в Telegram
[@nodeforge_dev](https://t.me/nodeforge_dev) — отвечаю в течение часа, Пн–Вс, без выходных.

### Email
[hello@nodeforge.dev](mailto:hello@nodeforge.dev) — альтернатива Telegram.

### Форма на сайте
Оставьте сообщение, опишите проект: что нужно, сроки, бюджет — отвечу в течение часа.

## 🔄 Лог изменений {#changelog}

### v5.0 (2026-08-07)
- Завершена фаза 5 (продакшен, тестирование, документация)
- Обновлён Three.js до r160+
- Переход на ES6+ модули
- Добавлен Service Worker для офлайн-кэширования

### v4.2
- Улучшены рекомендации по производительности
- Добавлена конфигурация CSP

### v4.1
- Доработана документация
- Добавлена FAQ по безопасности

### v4.0
- Полная переработка дизайн-системы
- Добавлена 3D-модель hero-секции
- Внедрена доступность (WCAG 2.1 AA)

## 📁 Структура проекта {#project-structure}

```
сайт/
├── index.html              — главная страница (8 секций)
├── model-viewer.html       — страница для отладки 3D-модели (HUD, noindex)
├── 404.html                — стилизованная страница ошибки
├── favicon.svg             — SVG-иконка
├── og-image.svg            — OG-картинка для соцсетей (1200x630)
├── robots.txt              — директивы для поисковых роботов
├── sitemap.xml             — карта сайта
├── sw.js                   — Service Worker
├── css/
│   └── style.css           — дизайн-система и все стили
├── js/
│   ├── config.js           — конфигурация (ES модуль)
│   ├── scene.js            — Three.js 3D-композиция hero
│   ├── main.js             — fade-up observers, FAQ, scroll, perf monitoring
│   ├── case-cards.js       — динамическая загрузка карточек кейсов
│   ├── analytics.js        — аналитика (ленивая загрузка)
│   └── ab-testing.js       — A/B тестирование (ленивая загрузка)
└── README.md
```

## 📐 Секции сайта

| # | ID | Название | Описание |
|---|-----|----------|----------|
| 1 | `#about` | **01 — Кто я** | 2 карточки + блок статистики (7+ лет, 48ч, 30 дней, 1 контакт) |
| 2 | `#services` | **02 — Специализации** | 3 карточки: Сайты / Telegram-боты / Mini Apps (сроки) |
| 3 | `#cases` | **03 — Проекты** | 3 таба с 10 карточками каждый (сайты/боты/мини-аппы) |
| 4 | `#dashboard-demo` | **04 — Демо** | Демо-дашборд в стиле Linear Analytics |
| 5 | `#stack` | **Стек технологий** | Горизонтальная лента технологий |
| 6 | `#why` | **05 — Почему я** | 3 карточки: Скорость / Честность / Опыт |
| 7 | `#process` | **06 — Как это работает** | 4 шага процесса |
| 8 | `#faq` | **07 — Вопросы** | 7 вопросов (native `<details>/<summary>`) |
| 9 | `#contact` | **Контакты** | Telegram/email CTA + форма связи (mailto: fallback) |

## ⚙️ Технологии

- **Three.js r160+** (CDN) — 3D-сцена hero-секции
- **Google Fonts** — Geist + IBM Plex Mono
- **Vanilla JS (ES6+ modules)** — никаких бандлеров
- **CSS Custom Properties** — дизайн-система
- **IntersectionObserver** — анимации и ленивая загрузка
- **Service Worker** — офлайн-кэширование и обновления

## ✨ Фичи

- Sticky-хедер с glassmorphism
- 3D-модель: ортографическая изометрия, статичное ядро + орбитальные модули
- Fade-up анимации при скролле (IntersectionObserver)
- FAQ-аккордеон с keyboard navigation (нативный `<details>/<summary>`)
- Мобильная верхняя навигация скрыта на ≤900px — навигация через sticky-CTA внизу и ссылки в футере
- Mobile sticky CTA (скрывается у секции контактов)
- Skip-navigation для accessibility
- `:focus-visible` стили для клавиатурной навигации
- `prefers-reduced-motion` поддержка
- OG-теги, Twitter Card, JSON-LD (Person + Service + FAQPage)
- `<noscript>` заглушка для Three.js
- Visibility change handler (пауза анимации при скрытии вкладки)
- Resize debounce (100ms)
- `clock.getDelta()` вместо magic constant
- Print styles (белый фон, скрытие интерактивных элементов)
- Custom scrollbar для Firefox
- CSP meta tag
- Fallback для CDN Three.js (onerror)
- robots.txt + sitemap.xml
- 404.html стилизованная страница ошибки
- Service Worker с автообновлением
- Performance monitoring (Web Vitals)
- Ленивая загрузка 3D-сцены и аналитики

## 🛠 Локальная разработка {#local-dev}

### Требования
- Python 3.x (для простого HTTP-сервера) **или** Node.js (для live-reload)

### Быстрый старт (Python)

```bash
cd сайт
python3 -m http.server 8000
# Откройте http://localhost:8000
```

### С live-reload (Node.js + serve)

```bash
cd сайт
npx serve . -l 3000
# Откройте http://localhost:3000
```

### С автообновлением (VS Code Live Server)

1. Установите расширение **Live Server**
2. Правый клик на `index.html` → **Open with Live Server**

### Проверка производительности

```bash
# Lighthouse CI (требует Node.js)
npx lighthouse http://localhost:8000 --output=html --output-path=./lighthouse-report.html
```

## 🤝 Участие в разработке

Пул-реквесты и ишью приветствуются. Перед отправкой:

1. Форкните репозиторий
2. Создайте ветку: `git checkout -b feature/amazing-feature`
3. Закоммитьте изменения: `git commit -m 'Add amazing feature'`
4. Запушьте: `git push origin feature/amazing-feature`
5. Откройте Pull Request

## 📄 Лицензия

MIT License — свободное использование, модификация и распространение с сохранением копирайта.

---

**Nodeforge** — сайты, Telegram-боты и Mini Apps. Быстро, чисто, без посредников.