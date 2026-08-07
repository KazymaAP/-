const express = require('express');
const router = express.Router();

const WORKING_HOURS = { start: 9, end: 21 };
const SLOT_DURATION = 30;
const DOCTORS_SCHEDULE = {
  'Иванов Иван Иванович': [1, 3, 5],
  'Петрова Анна Сергеевна': [2, 4],
  'Сидоров Алексей Петрович': [1, 2, 3, 4, 5],
};

function generateSlots(date, doctorName) {
  const dateObj = new Date(date + 'T00:00:00');

  if (isNaN(dateObj.getTime())) return [];

  const dayOfWeek = dateObj.getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dateObj < today) return [];

  if (dayOfWeek === 0 || dayOfWeek === 6) return [];

  if (doctorName && DOCTORS_SCHEDULE[doctorName]) {
    const numDay = dayOfWeek === 0 ? 7 : dayOfWeek;
    if (!DOCTORS_SCHEDULE[doctorName].includes(numDay)) return [];
  }

  const slots = [];
  const bookedSlots = new Set();

  for (let hour = WORKING_HOURS.start; hour < WORKING_HOURS.end; hour++) {
    for (let min = 0; min < 60; min += SLOT_DURATION) {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      const isBooked = bookedSlots.has(timeStr);
      const isPast = dateObj.getTime() === today.getTime() &&
        (hour < today.getHours() || (hour === today.getHours() && min <= today.getMinutes()));

      slots.push({
        time: timeStr,
        available: !isBooked && !isPast,
        doctor: doctorName || 'any',
      });
    }
  }

  return slots;
}

router.get('/', (req, res) => {
  try {
    const { date, doctor } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Параметр date обязателен' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Формат даты: YYYY-MM-DD' });
    }

    const slots = generateSlots(date, doctor);

    res.json({
      date,
      doctor: doctor || 'all',
      slots,
      workingHours: WORKING_HOURS,
      slotDuration: SLOT_DURATION,
    });
  } catch (error) {
    console.error('Slots error:', error);
    res.status(500).json({ error: 'Ошибка при получении слотов' });
  }
});

module.exports = router;
