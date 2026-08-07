const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const crypto = require('crypto');

/* ============================================
   In-Memory Store
   ============================================ */
const orders = [];
let orderIdCounter = 1;

const DELIVERY_FEE = 350;
const FREE_DELIVERY_THRESHOLD = 2000;
const DELIVERY_ZONES = {
  inside_mkad: { fee: 0, minOrder: FREE_DELIVERY_THRESHOLD },
  outside_mkad: { fee: 500, minOrder: 1500 }
};

/* ============================================
   Server-Side Menu Prices (source of truth)
   ============================================ */
const serverMenuPrices = {
  1: 680, 2: 420, 3: 890, 4: 780, 5: 920, 6: 540,
  7: 1890, 8: 1490, 9: 1680, 10: 1190, 11: 1780,
  12: 680, 13: 620, 14: 980, 15: 520, 16: 890,
  17: 480, 18: 420, 19: 380, 20: 540,
  21: 890, 22: 680, 23: 380, 24: 180, 25: 320
};

/* ============================================
   Validation Rules
   ============================================ */
const orderValidation = [
  body('name')
    .notEmpty().withMessage('Имя обязательно')
    .isLength({ min: 2, max: 50 }),
  body('phone')
    .notEmpty().withMessage('Телефон обязателен')
    .matches(/^\+7\s?\(?\d{3}\)?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/),
  body('address')
    .notEmpty().withMessage('Адрес обязателен')
    .isLength({ min: 10, max: 200 }),
  body('items')
    .isArray({ min: 1 }).withMessage('Добавьте хотя бы одно блюдо'),
  body('items.*.id')
    .isInt({ min: 1 }),
  body('items.*.qty')
    .isInt({ min: 1, max: 20 }),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'online']).withMessage('Некорректный способ оплаты'),
  body('wishes')
    .optional()
    .isLength({ max: 500 }).withMessage('Пожелания не должны превышать 500 символов')
];

/* ============================================
   POST /api/delivery — Create Delivery Order
   ============================================ */
router.post('/', orderValidation, (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(e => e.msg)
      });
    }

    const { name, phone, address, items, paymentMethod, wishes } = req.body;

    // Validate all item IDs exist in menu and calculate total from server-side prices
    for (const item of items) {
      if (!serverMenuPrices[item.id]) {
        return res.status(400).json({
          success: false,
          errors: [`Блюдо с ID ${item.id} не найдено в меню`]
        });
      }
    }

    // Calculate total using SERVER-SIDE prices (never trust client prices)
    const total = items.reduce((sum, item) => sum + (serverMenuPrices[item.id] * item.qty), 0);
    const deliveryFee = total >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const grandTotal = total + deliveryFee;

    // Sanitize
    const sanitizedName = sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} });
    const sanitizedAddress = sanitizeHtml(address, { allowedTags: [], allowedAttributes: {} });
    const sanitizedWishes = wishes ? sanitizeHtml(wishes, { allowedTags: [], allowedAttributes: {} }) : '';

    const order = {
      id: orderIdCounter++,
      name: sanitizedName,
      phone,
      address: sanitizedAddress,
      items,
      total,
      deliveryFee,
      grandTotal,
      paymentMethod: paymentMethod || 'cash',
      wishes: sanitizedWishes,
      status: 'pending',
      estimatedDelivery: '30-60 мин',
      createdAt: new Date().toISOString()
    };

    orders.push(order);

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        total: order.total,
        deliveryFee: order.deliveryFee,
        grandTotal: order.grandTotal,
        estimatedDelivery: order.estimatedDelivery
      },
      message: 'Заказ принят! Ожидайте курьера.'
    });

  } catch (error) {
    console.error('Delivery order error:', error);
    res.status(500).json({
      success: false,
      errors: ['Внутренняя ошибка сервера']
    });
  }
});

/* ============================================
   GET /api/delivery/calculate — Calculate Delivery Cost
   ============================================ */
router.get('/calculate', (req, res) => {
  const { total } = req.query;
  const orderTotal = parseInt(total) || 0;

  if (orderTotal < 0) {
    return res.status(400).json({
      success: false,
      error: 'Некорректная сумма заказа'
    });
  }

  const deliveryFee = orderTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

  res.json({
    success: true,
    subtotal: orderTotal,
    deliveryFee,
    freeDelivery: deliveryFee === 0,
    threshold: FREE_DELIVERY_THRESHOLD,
    remaining: Math.max(0, FREE_DELIVERY_THRESHOLD - orderTotal)
  });
});

/* ============================================
   GET /api/delivery/:id — Get Order Status
   ============================================ */
router.get('/:id', (req, res) => {
  const orderId = parseInt(req.params.id);
  if (isNaN(orderId)) {
    return res.status(400).json({
      success: false,
      error: 'Некорректный ID заказа'
    });
  }

  const order = orders.find(o => o.id === orderId);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Заказ не найден'
    });
  }
  
  // Verify requester is the orderer via phone hash
  const requestPhone = req.query.phone;
  if (!requestPhone) {
    return res.status(400).json({
      success: false,
      error: 'Требуется подтверждение'
    });
  }
  
  const phoneHash = crypto.createHash('sha256').update(requestPhone).digest('hex');
  const orderPhoneHash = crypto.createHash('sha256').update(order.phone).digest('hex');
  if (phoneHash !== orderPhoneHash) {
    return res.status(403).json({
      success: false,
      error: 'Доступ запрещён'
    });
  }
  
  res.json({
    success: true,
    order: {
      id: order.id,
      status: order.status,
      total: order.grandTotal,
      estimatedDelivery: order.estimatedDelivery
    }
  });
});

module.exports = router;
