function errorHandler(err, req, res, _next) {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Некорректный JSON',
      message: 'Проверьте формат данных',
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Слишком большой запрос',
      message: 'Размер тела запроса превышает допустимый лимит',
    });
  }

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'CSRF-токен невалиден',
      message: 'Попробуйте обновить страницу',
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Внутренняя ошибка сервера'
    : err.message;

  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Внутренняя ошибка сервера'
      : message,
  });
}

function notFoundHandler(req, res) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'API endpoint не найден',
      path: req.path,
    });
  }
  res.status(404).send('Not Found');
}

module.exports = { errorHandler, notFoundHandler };
