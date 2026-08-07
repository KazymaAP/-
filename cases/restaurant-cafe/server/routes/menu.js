const express = require('express');
const router = express.Router();

/* ============================================
   Menu Data (In-Memory)
   Replace with PostgreSQL in production
   ============================================ */
const menuData = {
  starters: [
    { id: 1, name: 'Тартар из лосося', description: 'Свежий лосось, авокадо, цитрусовый соус, микрозелень.', price: 680, weight: 180, calories: 280, category: 'starters', available: true },
    { id: 2, name: 'Брускетта с томатами', description: 'Свежие томаты, моцарелла, базилик на чиабатте.', price: 420, weight: 150, calories: 220, category: 'starters', available: true },
    { id: 3, name: 'Сырная тарелка', description: '5 видов сыра, фруктовый джем, грецкие орехи.', price: 890, weight: 350, calories: 520, category: 'starters', available: true },
    { id: 4, name: 'Карпаччо из говядины', description: 'Тонко нарезанная говядина, руккола, пармезан, трюфельное масло.', price: 780, weight: 160, calories: 310, category: 'starters', available: true },
    { id: 5, name: 'Креветки в чесночном соусе', description: 'Тигровые креветки, чеснок, белое вино, лимон.', price: 920, weight: 200, calories: 240, category: 'starters', available: true },
    { id: 6, name: 'Капрезе', description: 'Моцарелла ди буфало, томаты, базилик, бальзамик.', price: 540, weight: 200, calories: 190, category: 'starters', available: true }
  ],
  mains: [
    { id: 7, name: 'Стейк Рибай', description: 'Мраморная говядина, гриль, розмарин, овощи гриль.', price: 1890, weight: 300, calories: 580, category: 'mains', available: true },
    { id: 8, name: 'Лосось на гриле', description: 'Свежий лосось, спаржа, лимонный соус, каперсы.', price: 1490, weight: 250, calories: 420, category: 'mains', available: true },
    { id: 9, name: 'Оссобуко', description: 'Телячья голяшка, ризотто из шафрана, гремолата.', price: 1680, weight: 350, calories: 510, category: 'mains', available: true },
    { id: 10, name: 'Курица по-тоскански', description: 'Цыплёнок, помидоры, оливки, базилик, белое вино.', price: 1190, weight: 280, calories: 380, category: 'mains', available: true },
    { id: 11, name: 'Бараньи рёбрышки', description: 'Молодая баранина, чесночный соус, свежие травы.', price: 1780, weight: 320, calories: 550, category: 'mains', available: true }
  ],
  pasta: [
    { id: 12, name: 'Карбонара', description: 'Спагетти, гуанчале, пекорино, яичный желток, чёрный перец.', price: 680, weight: 280, calories: 520, category: 'pasta', available: true },
    { id: 13, name: 'Аматричана', description: 'Спагетти, панчетта, томатный соус, пекорино, чили.', price: 620, weight: 280, calories: 480, category: 'pasta', available: true },
    { id: 14, name: 'Тальятелле с трюфелем', description: 'Домашняя паста, трюфельный крем, пармезан.', price: 980, weight: 260, calories: 440, category: 'pasta', available: true },
    { id: 15, name: 'Пенне арабиата', description: 'Пенне, острый томатный соус, чили, базилик.', price: 520, weight: 280, calories: 410, category: 'pasta', available: true },
    { id: 16, name: 'Ризотто с морепродуктами', description: 'Арборио, креветки, мидии, белое вино, шафран.', price: 890, weight: 300, calories: 460, category: 'pasta', available: true }
  ],
  desserts: [
    { id: 17, name: 'Тирамису', description: 'Маскарпоне, эспрессо, какао, савоярди.', price: 480, weight: 150, calories: 380, category: 'desserts', available: true },
    { id: 18, name: 'Панна-котта', description: 'Ванильный крем, ягодный соус, свежие ягоды.', price: 420, weight: 140, calories: 290, category: 'desserts', available: true },
    { id: 19, name: 'Канноли', description: 'Хрустящее тесто, рикотта, шоколад, цедра.', price: 380, weight: 120, calories: 310, category: 'desserts', available: true },
    { id: 20, name: 'Шоколадный фондан', description: 'Тёмный шоколад, яичный желток, ванильное мороженое.', price: 540, weight: 180, calories: 450, category: 'desserts', available: true }
  ],
  drinks: [
    { id: 21, name: 'Кьянти Классико', description: 'Тосканское красное вино, 2020 год.', price: 890, weight: 150, calories: 125, category: 'drinks', available: true },
    { id: 22, name: 'Просекко', description: 'Игристое вино, Венето.', price: 680, weight: 150, calories: 85, category: 'drinks', available: true },
    { id: 23, name: 'Лимончелло', description: 'Домашний лимонный ликёр.', price: 380, weight: 50, calories: 110, category: 'drinks', available: true },
    { id: 24, name: 'Эспрессо', description: 'Классический итальянский эспрессо.', price: 180, weight: 30, calories: 5, category: 'drinks', available: true },
    { id: 25, name: 'Домашний лимонад', description: 'Лимон, мята, газировка.', price: 320, weight: 300, calories: 80, category: 'drinks', available: true }
  ]
};

/* ============================================
   GET /api/menu — Get All Menu Items
   ============================================ */
router.get('/', (req, res) => {
  const { category } = req.query;
  
  if (category && menuData[category]) {
    return res.json({
      success: true,
      items: menuData[category].filter(item => item.available),
      category
    });
  }
  
  const allItems = Object.values(menuData).flat().filter(item => item.available);
  res.json({
    success: true,
    items: allItems,
    categories: Object.keys(menuData)
  });
});

/* ============================================
   GET /api/menu/:id — Get Single Item
   ============================================ */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const allItems = Object.values(menuData).flat();
  const item = allItems.find(i => i.id === id);
  
  if (!item) {
    return res.status(404).json({
      success: false,
      error: 'Блюдо не найдено'
    });
  }
  
  res.json({ success: true, item });
});

module.exports = router;
