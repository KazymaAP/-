const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

let bookings = [];

const bookingValidation = [
  body('service')
    .trim()
    .notEmpty().withMessage('Услуга обязательна')
    .isLength({ min: 2, max: 200 }).withMessage('Некорректное название услуги'),
  body('doctor')
    .trim()
    .notEmpty().withMessage('Врач обязателен')
    .isLength({ min: 2, max: 200 }).withMessage('Некорректное ФИО врача'),
  body('date')
    .notEmpty().withMessage('Дата обязательна')
    .isISO8601().withMessage('Некорректный формат даты')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('Дата не может быть в прошлом');
      }
      return true;
    }),
  body('time')
    .notEmpty().withMessage('Время обязательно')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Некорректный формат времени'),
  body('name')
    .trim()
    .notEmpty().withMessage('Имя обязательно')
    .isLength({ min: 2, max: 100 }).withMessage('Имя должно быть от 2 до 100 символов')
    .matches(/^[а-яА-ЯёЁa-zA-Z\s\-]+$/).withMessage('Имя содержит недопустимые символы'),
  body('phone')
    .notEmpty().withMessage('Телефон обязателен')
    .matches(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/).withMessage('Формат: +7 (XXX) XXX-XX-XX'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Комментарий не должен превышать 500 символов')
    .escape(),
  body('price')
    .optional()
    .isInt({ min: 0 }).withMessage('Цена должна быть положительным числом'),
];

function generateBookingId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `DP-${timestamp}-${random}`;
}

function detectSQLInjection(input) {
  if (typeof input !== 'string') return false;
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|;|'|"|\/\*|\*\/)/,
    /(UNION\s+SELECT)/i,
    /(OR\s+1\s*=\s*1)/i,
    /(OR\s+'[^']*'\s*=\s*'[^']*')/i,
  ];
  return patterns.some((pattern) => pattern.test(input));
}

function isSlotAvailable(date, time, doctor) {
  return !bookings.some(
    (b) => b.date === date && b.time === time && b.doctor === doctor && b.status !== 'cancelled'
  );
}

router.post('/book', bookingValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({
          field: e.path,
          message: e.msg,
        })),
      });
    }

    const { service, doctor, date, time, name, phone, comment, price } = req.body;

    const fieldsToCheck = [service, doctor, name, phone, comment || ''];
    for (const field of fieldsToCheck) {
      if (detectSQLInjection(field)) {
        return res.status(400).json({
          success: false,
          message: 'Обнаружены недопустимые символы в данных',
        });
      }
    }

    if (!isSlotAvailable(date, time, doctor)) {
      return res.status(409).json({
        success: false,
        message: 'Это время уже занято. Пожалуйста, выберите другое.',
      });
    }

    const bookingId = generateBookingId();

    const booking = {
      id: bookingId,
      service: service.trim(),
      doctor: doctor.trim(),
      date,
      time,
      name: name.trim(),
      phone: phone.trim(),
      comment: (comment || '').trim(),
      price: parseInt(price) || 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    bookings.push(booking);

    if (bookings.length > 10000) {
      bookings = bookings.filter((b) => b.status !== 'cancelled').slice(-5000);
    }

    console.log('New booking:', {
      id: booking.id,
      service: booking.service,
      doctor: booking.doctor,
      date: booking.date,
      time: booking.time,
      name: booking.name,
      phone: booking.phone.replace(/\d{6}/g, '******'),
    });

    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      try {
        const escapeHtml = (str) =>
          String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        const safeService = escapeHtml(booking.service);
        const safeDoctor = escapeHtml(booking.doctor);
        const safeName = escapeHtml(booking.name);
        const safeComment = booking.comment ? escapeHtml(booking.comment) : '';

        const message = `<b>🦷 Новая запись!</b>\n\n` +
          `<b>📋 Услуга:</b> ${safeService}\n` +
          `<b>👨‍⚕️ Врач:</b> ${safeDoctor}\n` +
          `<b>📅 Дата:</b> ${escapeHtml(booking.date)}\n` +
          `<b>⏰ Время:</b> ${escapeHtml(booking.time)}\n` +
          `<b>👤 Имя:</b> ${safeName}\n` +
          `<b>📞 Телефон:</b> ${escapeHtml(booking.phone)}\n` +
          `<b>💰 Цена:</b> ${booking.price > 0 ? 'от ' + booking.price + ' ₽' : 'Бесплатно'}\n` +
          (safeComment ? `<b>💬 Комментарий:</b> ${safeComment}\n` : '') +
          `\n🆔 Код: <code>${bookingId}</code>`;

        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML',
          }),
        });
      } catch (tgError) {
        console.error('Telegram notification failed:', tgError.message);
      }
    }

    res.status(201).json({
      success: true,
      bookingId,
      message: `Вы записаны! Код подтверждения: ${bookingId}. Мы свяжемся с вами для уточнения деталей.`,
      booking: {
        id: bookingId,
        service: booking.service,
        doctor: booking.doctor,
        date: booking.date,
        time: booking.time,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера. Попробуйте позже.',
    });
  }
});

module.exports = router;
