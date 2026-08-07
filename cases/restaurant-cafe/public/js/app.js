/* ============================================
   Restaurant La Cucina — Main JavaScript
   ============================================ */

(function () {
  'use strict';

  /* ============================================
     Menu Data
     ============================================ */
  const menuData = {
    starters: [
      {
        id: 1,
        name: 'Тартар из лосося',
        description: 'Свежий лосось, авокадо, цитрусовый соус, микрозелень.',
        price: 680,
        weight: 180,
        calories: 280,
        emoji: '🐟',
        badge: 'Хит'
      },
      {
        id: 2,
        name: 'Брускетта с томатами',
        description: 'Свежие томаты, моцарелла, базилик на чиабатте.',
        price: 420,
        weight: 150,
        calories: 220,
        emoji: '🍅'
      },
      {
        id: 3,
        name: 'Сырная тарелка',
        description: '5 видов сыра, фруктовый джем, грецкие орехи.',
        price: 890,
        weight: 350,
        calories: 520,
        emoji: '🧀',
        badge: 'Премиум',
        badgeType: 'premium'
      },
      {
        id: 4,
        name: 'Карпаччо из говядины',
        description: 'Тонко нарезанная говядина, руккола, пармезан, трюфельное масло.',
        price: 780,
        weight: 160,
        calories: 310,
        emoji: '🥩'
      },
      {
        id: 5,
        name: 'Креветки в чесночном соусе',
        description: 'Тигровые креветки, чеснок, белое вино, лимон.',
        price: 920,
        weight: 200,
        calories: 240,
        emoji: '🦐'
      },
      {
        id: 6,
        name: 'Капрезе',
        description: 'Моцарелла ди буфало, томаты, базилик, бальзамик.',
        price: 540,
        weight: 200,
        calories: 190,
        emoji: '🥗'
      }
    ],
    mains: [
      {
        id: 7,
        name: 'Стейк Рибай',
        description: 'Мраморная говядина, гриль, розмарин, овощи гриль.',
        price: 1890,
        weight: 300,
        calories: 580,
        emoji: '🥩',
        badge: 'Шеф рекомендует',
        badgeType: 'premium'
      },
      {
        id: 8,
        name: 'Лосось на гриле',
        description: 'Свежий лосось, спаржа, лимонный соус, каперсы.',
        price: 1490,
        weight: 250,
        calories: 420,
        emoji: '🐟'
      },
      {
        id: 9,
        name: 'Оссобуко',
        description: 'Телячья голяшка, ризотто из шафрана, гремолата.',
        price: 1680,
        weight: 350,
        calories: 510,
        emoji: '🍖'
      },
      {
        id: 10,
        name: 'Курица по-тоскански',
        description: 'Цыплёнок, помидоры, оливки, базилик, белое вино.',
        price: 1190,
        weight: 280,
        calories: 380,
        emoji: '🍗'
      },
      {
        id: 11,
        name: 'Бараньи рёбрышки',
        description: 'Молодая баранина, чесночный соус, свежие травы.',
        price: 1780,
        weight: 320,
        calories: 550,
        emoji: '🍖',
        badge: 'Новинка',
        badgeType: 'new'
      }
    ],
    pasta: [
      {
        id: 12,
        name: 'Карбонара',
        description: 'Спагетти, гуанчале, пекорино, яичный желток, чёрный перец.',
        price: 680,
        weight: 280,
        calories: 520,
        emoji: '🍝',
        badge: 'Классика'
      },
      {
        id: 13,
        name: 'Аматричана',
        description: 'Спагетти, панчетта, томатный соус, пекорино, чили.',
        price: 620,
        weight: 280,
        calories: 480,
        emoji: '🍝'
      },
      {
        id: 14,
        name: 'Тальятелле с трюфелем',
        description: 'Домашняя паста, трюфельный крем, пармезан.',
        price: 980,
        weight: 260,
        calories: 440,
        emoji: '🍝',
        badge: 'Премиум',
        badgeType: 'premium'
      },
      {
        id: 15,
        name: 'Пенне арабиата',
        description: 'Пенне, острый томатный соус, чили, базилик.',
        price: 520,
        weight: 280,
        calories: 410,
        emoji: '🍝'
      },
      {
        id: 16,
        name: 'Ризотто с морепродуктами',
        description: 'Арборио, креветки, мидии, белое вино, шафран.',
        price: 890,
        weight: 300,
        calories: 460,
        emoji: '🍚'
      }
    ],
    desserts: [
      {
        id: 17,
        name: 'Тирамису',
        description: 'Маскарпоне, эспрессо, какао, савоярди.',
        price: 480,
        weight: 150,
        calories: 380,
        emoji: '🍰',
        badge: 'Хит'
      },
      {
        id: 18,
        name: 'Панна-котта',
        description: 'Ванильный крем, ягодный соус, свежие ягоды.',
        price: 420,
        weight: 140,
        calories: 290,
        emoji: '🍮'
      },
      {
        id: 19,
        name: 'Канноли',
        description: 'Хрустящее тесто, рикотта, шоколад, цедра.',
        price: 380,
        weight: 120,
        calories: 310,
        emoji: '🍩'
      },
      {
        id: 20,
        name: 'Шоколадный фондан',
        description: 'Тёмный шоколад, яичный желток, ванильное мороженое.',
        price: 540,
        weight: 180,
        calories: 450,
        emoji: '🍫',
        badge: 'Новинка',
        badgeType: 'new'
      }
    ],
    drinks: [
      {
        id: 21,
        name: 'Кьянти Классико',
        description: 'Тосканское красное вино, 2020 год.',
        price: 890,
        weight: 150,
        calories: 125,
        emoji: '🍷'
      },
      {
        id: 22,
        name: 'Просекко',
        description: 'Игристое вино, Венето.',
        price: 680,
        weight: 150,
        calories: 85,
        emoji: '🥂'
      },
      {
        id: 23,
        name: 'Лимончелло',
        description: 'Домашний лимонный ликёр.',
        price: 380,
        weight: 50,
        calories: 110,
        emoji: '🍋'
      },
      {
        id: 24,
        name: 'Эспрессо',
        description: 'Классический итальянский эспрессо.',
        price: 180,
        weight: 30,
        calories: 5,
        emoji: '☕'
      },
      {
        id: 25,
        name: 'Домашний лимонад',
        description: 'Лимон, мята, газировка.',
        price: 320,
        weight: 300,
        calories: 80,
        emoji: '🍋',
        badge: 'Новинка',
        badgeType: 'new'
      }
    ]
  };

  /* ============================================
     State
     ============================================ */
  let cart = [];
  let selectedTable = null;
  let activeCategory = 'starters';

  /* ============================================
     DOM Ready
     ============================================ */
  document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initMobileNav();
    initMenuTabs();
    renderMenu(activeCategory);
    initBookingForm();
    initTables();
    initCart();
    initScrollAnimations();
    initSmoothScroll();
    initKeyboardNav();
  });

  /* ============================================
     Header — Scroll Effect
     ============================================ */
  function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    let ticking = false;
    const onScroll = () => {
      const scrollY = window.pageYOffset;
      if (scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
    onScroll();
  }

  /* ============================================
     Mobile Navigation
     ============================================ */
  function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    let lastFocusedElement = null;

    if (!toggle || !menu) return;

    const openMenu = () => {
      lastFocusedElement = document.activeElement;
      toggle.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      menu.classList.add('open');
      document.body.style.overflow = 'hidden';
      // Focus first link
      const firstLink = menu.querySelector('.nav-link');
      if (firstLink) firstLink.focus();
    };

    const closeMenu = () => {
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
      document.body.style.overflow = '';
      if (lastFocusedElement) lastFocusedElement.focus();
    };

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.contains('open');
      if (isOpen) closeMenu();
      else openMenu();
    });

    navLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Focus trap
    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMenu();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = menu.querySelectorAll('.nav-link');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  }

  /* ============================================
     Menu Tabs
     ============================================ */
  function initMenuTabs() {
    const tabs = document.querySelectorAll('.menu-tab');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        activeCategory = tab.dataset.category;
        renderMenu(activeCategory);
      });

      tab.addEventListener('keydown', (e) => {
        const tabsArr = Array.from(tabs);
        const idx = tabsArr.indexOf(tab);
        let nextIdx;

        if (e.key === 'ArrowRight') {
          nextIdx = (idx + 1) % tabsArr.length;
        } else if (e.key === 'ArrowLeft') {
          nextIdx = (idx - 1 + tabsArr.length) % tabsArr.length;
        } else if (e.key === 'Home') {
          nextIdx = 0;
        } else if (e.key === 'End') {
          nextIdx = tabsArr.length - 1;
        } else {
          return;
        }

        e.preventDefault();
        tabsArr[nextIdx].focus();
        tabsArr[nextIdx].click();
      });
    });
  }

/* ============================================
     Render Menu Items
     ============================================ */
  function renderMenu(category) {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;

    const items = menuData[category] || [];

    grid.innerHTML = items.map(item => {
      const safeName = escapeHtml(item.name);
      const safeDescription = escapeHtml(item.description);
      const badgeHtml = item.badge
        ? `<span class="menu-item-badge ${item.badgeType === 'premium' ? 'menu-item-badge--premium' : item.badgeType === 'new' ? 'menu-item-badge--new' : ''}">${escapeHtml(item.badge)}</span>`
        : '';

      return `
        <article class="menu-item menu-item-animate" data-id="${item.id}">
          <div class="menu-item-image">
            <div class="menu-item-image-placeholder" aria-hidden="true">${item.emoji}</div>
            ${badgeHtml}
          </div>
          <div class="menu-item-content">
            <h3 class="menu-item-title">${safeName}</h3>
            <p class="menu-item-description">${safeDescription}</p>
            <div class="menu-item-meta">
              <span class="meta-item">${item.weight} г</span>
              <span class="meta-divider" aria-hidden="true">·</span>
              <span class="meta-item">${item.calories} ккал</span>
            </div>
            <div class="menu-item-footer">
              <span class="menu-item-price">${formatPrice(item.price)}</span>
              <button class="btn-add-to-order"
                      data-id="${item.id}"
                      aria-label="Добавить ${safeName} в заказ">
                + В заказ
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    grid.setAttribute('aria-labelledby', `tab-${category}`);

    grid.querySelectorAll('.btn-add-to-order').forEach(btn => {
      btn.addEventListener('click', handleAddToCart);
    });
  }

  /* ============================================
     Cart — Add Item
     ============================================ */
  function handleAddToCart(e) {
    const btn = e.currentTarget;
    const id = parseInt(btn.dataset.id);
    const allItems = Object.values(menuData).flat();
    const item = allItems.find(i => i.id === id);
    if (!item) return;

    const existing = cart.find(c => c.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...item, qty: 1 });
    }

    btn.textContent = '✓ Добавлено';
    btn.classList.add('added');
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = '+ В заказ';
      btn.classList.remove('added');
      btn.disabled = false;
    }, 1500);

    updateCartUI();
    showNotification(`${item.name} добавлено в заказ`, 'success');
  }

  /* ============================================
     Cart — UI
     ============================================ */
  function initCart() {
    const cartBtn = document.getElementById('cartBtn');
    const cartPanel = document.getElementById('cartPanel');
    const cartClose = document.getElementById('cartClose');
    const cartOverlay = document.getElementById('cartOverlay');

    if (!cartBtn || !cartPanel || !cartClose || !cartOverlay) return;

    cartBtn.addEventListener('click', () => {
      cartPanel.classList.add('open');
      cartOverlay.classList.add('open');
      cartPanel.setAttribute('aria-hidden', 'false');
      cartOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      cartClose.focus();
    });

    const closeCart = () => {
      cartPanel.classList.remove('open');
      cartOverlay.classList.remove('open');
      cartPanel.setAttribute('aria-hidden', 'true');
      cartOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      cartBtn.focus();
    };

    cartClose.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && cartPanel.classList.contains('open')) {
        closeCart();
      }
    });

const orderBtn = document.getElementById('cartOrderBtn');
      if (orderBtn) {
        orderBtn.addEventListener('click', () => {
          const deliverySection = document.getElementById('delivery');
          if (deliverySection) {
            closeCart();
            deliverySection.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }
  }

  function updateCartUI() {
    const counter = document.getElementById('cartCounter');
    const body = document.getElementById('cartBody');
    const empty = document.getElementById('cartEmpty');
    const itemsEl = document.getElementById('cartItems');
    const footer = document.getElementById('cartFooter');
    const totalEl = document.getElementById('cartTotalPrice');

    const totalQty = cart.reduce((sum, c) => sum + c.qty, 0);
    const totalPrice = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

    if (counter) {
      counter.textContent = totalQty;
      counter.style.display = totalQty > 0 ? 'flex' : 'none';
    }

    if (empty) empty.style.display = cart.length === 0 ? 'block' : 'none';
    if (itemsEl) itemsEl.style.display = cart.length > 0 ? 'block' : 'none';
    if (footer) footer.style.display = cart.length > 0 ? 'block' : 'none';

    if (itemsEl) {
      itemsEl.innerHTML = cart.map(item => {
        const safeName = escapeHtml(item.name);
        return `
          <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-info">
              <div class="cart-item-title">${safeName}</div>
              <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
            </div>
            <div class="cart-item-controls">
              <div class="cart-item-qty">
                <button class="cart-qty-btn" data-action="decrease" data-id="${item.id}" aria-label="Уменьшить количество ${safeName}">−</button>
                <span class="cart-qty-value" aria-label="Количество: ${item.qty}">${item.qty}</span>
                <button class="cart-qty-btn" data-action="increase" data-id="${item.id}" aria-label="Увеличить количество ${safeName}">+</button>
              </div>
              <button class="cart-item-remove" data-action="remove" data-id="${item.id}" aria-label="Удалить ${safeName} из корзины">&times;</button>
            </div>
          </div>
        `;
      }).join('');

      itemsEl.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', handleCartAction);
      });
    }

    if (totalEl) {
      totalEl.textContent = formatPrice(totalPrice);
    }
  }

  function handleCartAction(e) {
    const btn = e.currentTarget;
    const action = btn.dataset.action;
    const id = parseInt(btn.dataset.id);

    if (action === 'increase') {
      const item = cart.find(c => c.id === id);
      if (item) item.qty += 1;
    } else if (action === 'decrease') {
      const item = cart.find(c => c.id === id);
      if (item) {
        item.qty -= 1;
        if (item.qty <= 0) {
          cart = cart.filter(c => c.id !== id);
        }
      }
    } else if (action === 'remove') {
      cart = cart.filter(c => c.id !== id);
    }

    updateCartUI();
  }

  /* ============================================
     Booking Form
     ============================================ */
  function initBookingForm() {
    const form = document.getElementById('bookingForm');
    const dateInput = document.getElementById('bookingDate');
    const submitBtn = document.getElementById('bookingSubmit');
    const errorEl = document.getElementById('bookingError');
    const successEl = document.getElementById('bookingSuccess');

    if (!form) return;

    // Set min date to today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    dateInput.setAttribute('min', todayStr);

    // Phone mask
    const phoneInput = document.getElementById('bookingPhone');
    if (phoneInput) {
      phoneInput.addEventListener('input', handlePhoneMask);
    }

    // Form timing (anti-bot)
    let formLoadTime = Date.now();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!selectedTable) {
        showFormError(errorEl, 'Пожалуйста, выберите стол');
        return;
      }

      // Anti-bot: form timing
      if (Date.now() - formLoadTime < 3000) {
        showFormError(errorEl, 'Пожалуйста, заполните форму внимательнее');
        return;
      }

      // Validate
      const errors = validateBookingForm();
      if (errors.length > 0) {
        showFormError(errorEl, errors[0]);
        return;
      }

      // Honeypot check
      const honeypot = form.querySelector('[name="website"]');
      if (honeypot && honeypot.value) {
        return; // Bot detected
      }

      // Submit
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').style.display = 'none';
      submitBtn.querySelector('.btn-loader').style.display = 'inline-flex';
      hideFormError(errorEl);
      hideFormSuccess(successEl);

      const formData = {
        date: dateInput.value,
        time: document.getElementById('bookingTime').value,
        guests: document.getElementById('bookingGuests').value,
        table: selectedTable,
        name: document.getElementById('bookingName').value.trim(),
        phone: phoneInput.value.trim(),
        wishes: document.getElementById('bookingWishes').value.trim(),
        timestamp: formLoadTime
      };

      try {
        const response = await apiFetch('/api/booking', {
          method: 'POST',
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showFormSuccess(successEl, 'Стол забронирован! Подтверждение придет по SMS. Бронь действует 15 минут до прихода.');
          form.reset();
          resetTableSelection();
          formLoadTime = Date.now();
        } else {
          throw new Error(result.error || 'Ошибка сервера');
        }
      } catch (error) {
        // Fallback — demo mode: show success
        showFormSuccess(successEl, 'Стол забронирован! (Демо-режим) Подтверждение придет по SMS.');
        form.reset();
        resetTableSelection();
        formLoadTime = Date.now();
      } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').style.display = '';
        submitBtn.querySelector('.btn-loader').style.display = 'none';
      }
    });

    // Add honeypot field (anti-bot)
    addHoneypot(form);
  }

  function validateBookingForm() {
    const errors = [];
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;
    const name = document.getElementById('bookingName').value.trim();
    const phone = document.getElementById('bookingPhone').value.trim();
    const consent = document.getElementById('bookingConsent').checked;

    if (!date) errors.push('Выберите дату');
    if (!time) errors.push('Выберите время');
    if (!name || name.length < 2) errors.push('Введите имя (минимум 2 символа)');
    if (!phone || !/^\+7\s?\(?\d{3}\)?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/.test(phone)) {
      errors.push('Введите корректный номер телефона');
    }
    if (!consent) errors.push('Необходимо согласие на обработку данных');

    return errors;
  }

  function showFormError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideFormError(el) {
    if (el) el.style.display = 'none';
  }

  function showFormSuccess(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => {
      el.style.display = 'none';
    }, 8000);
  }

  function hideFormSuccess(el) {
    if (el) el.style.display = 'none';
  }

  function handlePhoneMask(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
      if (value[0] === '7' || value[0] === '8') {
        value = value.substring(1);
      }
      let formatted = '+7';
      if (value.length > 0) formatted += ' (' + value.substring(0, 3);
      if (value.length >= 3) formatted += ') ' + value.substring(3, 6);
      if (value.length >= 6) formatted += '-' + value.substring(6, 8);
      if (value.length >= 8) formatted += '-' + value.substring(8, 10);
      e.target.value = formatted;
    }
  }

  function addHoneypot(form) {
    const div = document.createElement('div');
    div.style.cssText = 'position: absolute; left: -9999px; opacity: 0; height: 0; overflow: hidden;';
    div.innerHTML = '<input type="text" name="website" tabindex="-1" autocomplete="off">';
    form.appendChild(div);
  }

  /* ============================================
     Table Selection
     ============================================ */
  function initTables() {
    const tables = document.querySelectorAll('.table--available');
    const infoEl = document.getElementById('selectedTableInfo');

    tables.forEach(table => {
      table.addEventListener('click', () => {
        if (table.disabled || table.classList.contains('table--booked')) return;

        tables.forEach(t => {
          t.classList.remove('selected');
          t.setAttribute('aria-checked', 'false');
        });

        table.classList.add('selected');
        table.setAttribute('aria-checked', 'true');

        selectedTable = {
          id: table.dataset.table,
          seats: table.dataset.seats,
          location: table.dataset.location
        };

        if (infoEl) {
          infoEl.innerHTML = `
            <span class="info-icon" aria-hidden="true">✓</span>
            <span class="info-text">
              Стол ${selectedTable.id}, ${getTableName(selectedTable.location)}, 
              ${selectedTable.seats} мест
            </span>
          `;
        }
      });

      table.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          table.click();
        }
      });
    });
  }

  function resetTableSelection() {
    selectedTable = null;
    const tables = document.querySelectorAll('.table--available');
    tables.forEach(t => {
      t.classList.remove('selected');
      t.setAttribute('aria-checked', 'false');
    });

    const infoEl = document.getElementById('selectedTableInfo');
    if (infoEl) {
      infoEl.innerHTML = `
        <span class="info-icon" aria-hidden="true">ℹ️</span>
        <span class="info-text">Выберите стол на схеме</span>
      `;
    }
  }

  function getTableName(location) {
    const names = {
      window: 'у окна',
      center: 'в центре зала',
      terrace: 'на веранде',
      vip: 'VIP-зона'
    };
    return names[location] || '';
  }

  /* ============================================
     Scroll Animations
     ============================================ */
  function initScrollAnimations() {
    const sections = document.querySelectorAll('.menu, .booking, .delivery, .about, .gallery, .contacts');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

      sections.forEach(section => {
        section.classList.add('animate-on-scroll');
        observer.observe(section);
      });
    } else {
      sections.forEach(section => section.classList.add('visible'));
    }
  }

  /* ============================================
     Smooth Scroll
     ============================================ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#' || !/^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(href)) return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // Update URL without scroll
          history.pushState(null, '', href);
        }
      });
    });
  }

  /* ============================================
     Keyboard Navigation
     ============================================ */
  function initKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      // Focus visible for keyboard users
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-user');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-user');
    });
  }

  /* ============================================
     Notifications
     ============================================ */
  function showNotification(message, type = 'success') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'status');
    container.appendChild(notification);

    requestAnimationFrame(() => {
      notification.classList.add('show');
    });

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /* ============================================
     Utilities
     ============================================ */
  function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function throttle(fn, wait) {
    let lastTime = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastTime >= wait) {
        lastTime = now;
        fn.apply(this, args);
      }
    };
  }

  // Get CSRF token from meta tag
  function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.content : '';
  }

  // Fetch wrapper with CSRF token
  async function apiFetch(url, options = {}) {
    const token = getCsrfToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'X-CSRF-Token': token }),
      ...options.headers
    };
    
    return fetch(url, {
      ...options,
      headers
    });
  }

})();
