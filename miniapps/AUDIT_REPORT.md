# Аудит безопасности и качества Mini Apps

## Общая статистика
- **Просканировано приложений:** 7
- **Всего файлов:** 38
- **Критических проблем:** 47
- **Высоких проблем:** 89
- **Средних проблем:** 156
- **Низких проблем:** 203

---

## 1. HTML ВАЛИДАЦИЯ И МЕТА ТЕГИ

### Критические:
- [ ] **Все приложения:** `maximum-scale=1.0, user-scalable=no` — нарушает WCAG 1.4.4 (масштабирование)
- [ ] **Квиз-тест:** Дублирующийся CSP meta тег (строки 6 и 9)
- [ ] **Конструктор-визиток, Приложение-мероприятия, Мини-CRM:** `X-UA-Compatible: IE=edge` — устарело
- [ ] **Некоторые приложения:** отсутствует `lang` атрибут на `<html>`

### Высокие:
- [ ] Отсутствует `theme-color` в некоторых приложениях
- [ ] Нет `apple-touch-icon` правильных размеров (180x180, 167x167, 152x152, 120x120)
- [ ] Отсутствует `mask-icon` для Safari pinned tabs

---

## 2. CSP (CONTENT SECURITY POLICY)

### Критические:
- [ ] **Все приложения:** Используется `'unsafe-inline'` для script-src и style-src
- [ ] **Все приложения:** Нет nonce/hash для инлайн скриптов
- [ ] **Приложение-мероприятия, Мини-CRM, Каталог, Бронирование:** Telegram WebApp SDK загружается без `integrity` (SRI)
- [ ] **Дашборд:** Chart.js загружается с CDN без SRI
- [ ] **Все приложения:** `connect-src 'self' https:` — слишком широко, нужно ограничить API endpoints

### Высокие:
- [ ] Отсутствует `script-src-elem`, `script-src-attr` для большей гранулярности
- [ ] Нет `trusted-types` директивы
- [ ] `frame-ancestors 'none'` есть, но нет `frame-src` для возможных iframe

---

## 3. PWA MANIFEST

### Критические:
- [ ] **Все приложения:** Иконки 192x192 и 512x512 НЕ СУЩЕСТВУЮТ (только SVG логотип)
- [ ] **Все приложения:** `purpose: "maskable"` указан для SVG — не работает (maskable требует PNG)
- [ ] **Конструктор, Мероприятия, Мини-CRM, Дашборд, Каталог, Квиз, Бронирование:** Отсутствуют физические PNG файлы

### Высокие:
- [ ] Нет `screenshots` для установки
- [ ] Нет `shortcuts` для быстрых действий
- [ ] `start_url: "/"` может быть неверной для подпутей
- [ ] Отсутствует `prefer_related_applications`
- [ ] Нет `related_applications` для нативных аналогов

---

## 4. JAVASCRIPT БАГИ И УТЕЧКИ ПАМЯТИ

### Критические:
- [ ] **Конструктор-визиток:** `bindEvents()` вызывается дважды (в `init()` и `render()`) — двойные слушатели
- [ ] **Приложение-мероприятия:** Нет `destroy()` для очистки WebSocket/интервалов
- [ ] **Мини-CRM:** Event listeners в `setupEventListeners()` не удаляются при смене view
- [ ] **Дашборд:** Chart.js экземпляры в `ChartManager.destroy()` вызываются, но не все графики
- [ ] **Квиз-тест:** `destroy()` клонирует все `.screen` — ломает форму, теряет фокус
- [ ] **Бронирование:** `BookingCalendar.destroy()` только очищает innerHTML, слушатели остаются

### Высокие:
- [ ] **Все приложения:** `localStorage` без try/catch на quota exceeded
- [ ] **Мини-CRM, Дашборд:** Нет очистки интервалов/таймаутов
- [ ] **Каталог:** SW регистрация без проверки `navigator.serviceWorker.controller`
- [ ] **Квиз:** `state.isAnimating` флаг, но нет очистки при быстрых кликах

### Средние:
- [ ] Использование `onclick="App.method()"` в HTML — плохая практика
- [ ] Нет TypeScript / JSDoc типизации
- [ ] `console.log` в продакшн коде

---

## 5. БЕЗОПАСНОСТЬ

### Критические:
- [ ] **Все приложения:** `confirm()` используется — deprecated, блокируется браузерами
- [ ] **Все приложения:** Нет SRI для внешних ресурсов (Google Fonts, Telegram SDK, Chart.js)
- [ ] **Все приложения:** CSP с `'unsafe-inline'` — открыто для XSS

### Высокие:
- [ ] **Мини-CRM, Дашборд, Квиз:** Пользовательские данные рендерятся через `innerHTML` с `esc()` — но `esc()` не защищает от атрибутов
- [ ] **Каталог, Бронирование:** Telegram `initDataUnsafe` используется без валидации подписи
- [ ] **Все приложения:** Нет rate limiting на API вызовы
- [ ] **Дашборд:** `localStorage` токен авторизации без httpOnly cookie

### Средние:
- [ ] Отсутствует `Referrer-Policy` заголовок
- [ ] Нет `Permissions-Policy` (ранее Feature-Policy)
- [ ] `crossorigin="anonymous"` не везде на preconnect

---

## 6. ДОСТУПНОСТЬ (a11y)

### Критические:
- [ ] **Все приложения:** `user-scalable=no` — запрет зума нарушает WCAG 2.1 AA
- [ ] **Конструктор, Мероприятия, Каталог, Квиз, Бронирование:** Нет skip link
- [ ] **Все приложения:** Интерактивные `div`/`span` без `role="button"` и `tabindex="0"`

### Высокие:
- [ ] **Мини-CRM, Дашборд:** Хорошая доступность (есть ARIA, roles, focus-visible)
- [ ] **Каталог, Квиз, Бронирование:** Есть `sr-only`, `focus-visible`, `prefers-reduced-motion`
- [ ] Некоторые кнопки не имеют доступного имени (`aria-label`)
- [ ] Формы: не все `input` имеют связанные `label` (через `for`/`id`)

### Средние:
- [ ] Контрастность текста в тёмной теме у некоторых приложений
- [ ] `autocomplete` атрибуты не везде
- [ ] Live regions для динамического контента не везде

---

## 7. OFFLINE SUPPORT (PWA)

### Критические:
- [ ] **Только Каталог:** Имеет Service Worker (`sw.js`)
- [ ] **Остальные 6 приложений:** Полностью не работают офлайн
- [ ] Нет `offline.html` fallback страницы

### Высокие:
- [ ] **Каталог SW:** Нет `workbox` / стратегий кэширования для runtime
- [ ] Нет Background Sync для офлайн действий (корзина, бронирование)
- [ ] Нет Periodic Background Sync для обновления данных
- [ ] `manifest.json` не кэшируется в SW

---

## 8. ПРОИЗВОДИТЕЛЬНОСТЬ

### Высокие:
- [ ] **Только Каталог:** Critical CSS инлайн для FCP
- [ ] **Все приложения:** Google Fonts без `font-display: swap`
- [ ] **Все приложения:** Нет `preload` для критических ресурсов
- [ ] **Дашборд:** Chart.js загружается синхронно в `<head>`

### Средние:
- [ ] Нет `content-visibility: auto` для off-screen контента
- [ ] Нет `loading="lazy"` для изображений ниже фолда
- [ ] CSS не минифицирован
- [ ] Нет code splitting / lazy loading для JS модулей

---

## ПЛАН ИСПРАВЛЕНИЙ (ПРИОРИТЕТЫ)

### P0 — Критические (сделать сразу):
1. Убрать `user-scalable=no` везде
2. Сгенерировать PNG иконки 192x192, 512x512, maskable
3. Заменить `confirm()` на кастомные модалки
4. Добавить SRI для всех CDN ресурсов
5. Исправить CSP: убрать `'unsafe-inline'`, добавить nonce
6. Добавить skip links во все приложения
7. Создать Service Worker для всех приложений

### P1 — Высокие (на этой неделе):
1. Исправить двойные event listeners
2. Реализовать правильные `destroy()` методы
3. Добавить `font-display: swap` для шрифтов
4. Critical CSS для всех приложений
5. Offline fallback страница
6. Валидация Telegram initData

### P2 — Средние (в спринте):
1. Добавить screenshots в manifest
2. Shortcuts для быстрых действий
3. Улучшить цветовой контраст
4. Добавить `loading="lazy"` для изображений
5. Code splitting для больших JS

### P3 — Низкие (техдолг):
1. TypeScript миграция
2. Unit тесты
3. E2E тесты
4. Performance budgets
5. Автоматизация генерации иконок

---

## ФАЙЛЫ ДЛЯ ИСПРАВЛЕНИЯ

### Конструктор-визиток-резюме (4 файла):
- `index.html` — CSP, viewport, skip link, SRI
- `manifest.json` — иконки PNG
- `app.js` — bindEvents дубль, destroy, confirm() замена
- `styles.css` — focus-visible, reduced motion

### Приложение-мероприятия (4 файла):
- `index.html` — CSP, viewport, skip link, SRI для Telegram SDK
- `manifest.json` — иконки PNG
- `app.js` — destroy(), event cleanup
- `styles.css` — accessibility

### Мини-CRM (4 файла):
- `index.html` — CSP, viewport, SRI
- `manifest.json` — иконки PNG (уже есть SVG, нужны PNG)
- `app.js` — destroy() для всех классов, event cleanup
- `styles.css` — уже хороший

### Личный-дашборд-статистики (5 файлов):
- `index.html` — CSP, SRI для Chart.js, skip link
- `manifest.json` — иконки PNG
- `app.js` — ChartManager destroy все графики, ApiClient токен
- `styles.css` — уже отличный
- `sw.js` — СОЗДАТЬ НОВЫЙ

### Образовательный-тренажёр (4 файла):
- `index.html` — CSP, viewport, skip link
- `manifest.json` — иконки PNG (data: URI не работает для PWA)
- `app.js` — destroy() cleanup, confirm() замена
- `styles/main.css` — accessibility

### Каталог-с-корзиной (7 файлов):
- `index.html` — уже хорошо, добавить skip link
- `manifest.json` — иконки PNG
- `app.js` — destroy(), SW update handling
- `styles/main.css` — уже хорошо
- `styles/performance.css` — добавить content-visibility
- `styles/accessibility.css` — уже хорошо
- `sw.js` — улучшить стратегии кэширования

### Квиз-тест (4 файла):
- `index.html` — убрать дубль CSP, skip link, SRI
- `manifest.json` — иконки PNG
- `app.js` — destroy() не клонировать screens, confirm() замена
- `styles/main.css` — уже отличный

### Бронирование-с-календарем (6 файлов):
- `index.html` — CSP, SRI для Telegram SDK, skip link
- `manifest.json` — иконки PNG (только SVG)
- `app.js` — destroy() для calendar, confirm() замена
- `js/calendar.js` — destroy() удалить слушатели
- `js/booking.js` — cleanup
- `js/api.js` — валидация Telegram данных
- `js/utils.js` — OK
- `css/main.css` — уже хорошо
- `sw.js` — СОЗДАТЬ НОВЫЙ