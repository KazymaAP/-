const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const crypto = require('crypto');

/* ============================================
   In-Memory Store (demo mode)
   Replace with PostgreSQL in production
   ============================================ */
const bookings = [];
let bookingIdCounter = 1;

/* ============================================
   Validation Rules
   ============================================ */
const bookingValidation = [
  body('date')
    .notEmpty().withMessage('Дата обязательна')
    .isDate().withMessage('Некорректная дата'),
  body('time')
    .notEmpty().withMessage('Время обязательно')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Некорректное время'),
  body('guests')
    .notEmpty().withMessage('Количество гостей обязательно')
    .isInt({ min: 1, max: 20 }).withMessage('Некорректное количество гостей'),
  body('table')
    .notEmpty().withMessage('Выберите стол')
    .isObject().withMessage('Некорректный выбор стола'),
  body('table.id')
    .notEmpty().withMessage('ID стола обязателен'),
  body('name')
    .notEmpty().withMessage('Имя обязательно')
    .isLength({ min: 2, max: 50 }).withMessage('Имя должно быть от 2 до 50 символов'),
  body('phone')
    .notEmpty().withMessage('Телефон обязателен')
    .matches(/^\+7\s?\(?\d{3}\)?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/).withMessage('Некорректный номер телефона'),
  body('wishes')
    .optional()
    .isLength({ max: 500 }).withMessage('Пожелания не должны превышать 500 символов')
];

/* ============================================
   POST /api/booking — Create Booking
   ============================================ */
router.post('/', bookingValidation, (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(e => e.msg)
      });
    }

    const { date, time, guests, table, name, phone, wishes } = req.body;

    // Validate date is not in the past
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        errors: ['Дата не может быть в прошлом']
      });
    }

    // Check date is within 30 days
    const maxDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (bookingDate > maxDate) {
      return res.status(400).json({
        success: false,
        errors: ['Можно бронировать максимум на 30 дней вперёд']
      });
    }

    // Check if table is already booked for this date/time
    const conflicting = bookings.find(b =>
      b.date === date &&
      b.time === time &&
      b.table.id === table.id &&
      b.status !== 'cancelled'
    );

    if (conflicting) {
      return res.status(409).json({
        success: false,
        errors: ['Этот стол уже забронирован на выбранное время']
      });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} });
    const sanitizedWishes = wishes ? sanitizeHtml(wishes, { allowedTags: [], allowedAttributes: {} }) : '';

    // Create booking
    const booking = {
      id: bookingIdCounter++,
      date,
      time,
      guests: parseInt(guests),
      table: {
        id: table.id,
        seats: table.seats,
        location: table.location
      },
      name: sanitizedName,
      phone,
      wishes: sanitizedWishes,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    bookings.push(booking);

    // TODO: Send SMS confirmation
    // TODO: Send Telegram notification

    res.status(201).json({
      success: true,
      booking: {
        id: booking.id,
        date: booking.date,
        time: booking.time,
        table: booking.table,
        name: booking.name
      },
      message: 'Стол забронирован! Подтверждение придет по SMS.'
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({
      success: false,
      errors: ['Внутренняя ошибка сервера']
    });
  }
});

/* ============================================
   Admin Authentication Middleware
   ============================================ */
const requireAdmin = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (!process.env.ADMIN_KEY) {
    return res.status(503).json({
      success: false,
      errors: ['Админ-панель не настроена']
    });
  }
  if (!adminKey) {
    return res.status(401).json({
      success: false,
      errors: ['Необходима админ-авторизация']
    });
  }
  try {
    const a = Buffer.from(adminKey);
    const b = Buffer.from(process.env.ADMIN_KEY);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({
        success: false,
        errors: ['Необходима админ-авторизация']
      });
    }
  } catch {
    return res.status(401).json({
      success: false,
      errors: ['Необходима админ-авторизация']
    });
  }
  next();
};

/* ============================================
   GET /api/booking — List Bookings (admin only)
   ============================================ */
router.get('/', requireAdmin, (req, res) => {
  const { date, status } = req.query;
  
  let filtered = [...bookings];
  
  if (date) {
    filtered = filtered.filter(b => b.date === date);
  }
  
  if (status) {
    filtered = filtered.filter(b => b.status === status);
  }
  
  res.json({
    success: true,
    bookings: filtered,
    total: filtered.length
  });
});

/* ============================================
   GET /api/booking/:id — Get Booking (admin only)
   ============================================ */
router.get('/:id', requireAdmin, (req, res) => {
  const booking = bookings.find(b => b.id === parseInt(req.params.id));
  
  if (!booking) {
    return res.status(404).json({
      success: false,
      errors: ['Бронирование не найдено']
    });
  }
  
  res.json({ success: true, booking });
});

/* ============================================
   DELETE /api/booking/:id — Cancel Booking (admin only)
   ============================================ */
router.delete('/:id', requireAdmin, (req, res) => {
  const booking = bookings.find(b => b.id === parseInt(req.params.id));
  
  if (!booking) {
    return res.status(404).json({
      success: false,
      errors: ['Бронирование не найдено']
    });
  }
  
  if (booking.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      errors: ['Бронирование уже отменено']
    });
  }
  
  booking.status = 'cancelled';
  
  res.json({
    success: true,
    message: 'Бронирование отменено'
  });
});

module.exports = router;
