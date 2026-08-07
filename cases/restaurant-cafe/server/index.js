require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const bookingRoutes = require('./routes/booking');
const menuRoutes = require('./routes/menu');
const deliveryRoutes = require('./routes/delivery');

// Security middleware
const {
  sanitizeMiddleware,
  csrfMiddleware,
  securityHeaders,
  requestSizeLimit,
  ipViolationMiddleware
} = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

/* ============================================
   Security Middleware
   ============================================ */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Additional security headers
app.use(securityHeaders);

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Admin-Key'],
  credentials: true
}));

/* ============================================
   Rate Limiting
   ============================================ */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Слишком много запросов. Попробуйте позже.' },
  standardHeaders: true,
  legacyHeaders: false
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Слишком много бронирований. Попробуйте позже.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(generalLimiter);

// IP violation tracking
app.use(ipViolationMiddleware);

/* ============================================
   Body Parsing
   ============================================ */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Request size limit
app.use(requestSizeLimit('10kb'));

// Sanitize all inputs
app.use(sanitizeMiddleware);

// CSRF protection for API routes
app.use('/api', csrfMiddleware);

/* ============================================
   Static Files
   ============================================ */
app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: '30d',
  etag: true,
  lastModified: true
}));

// Inject CSRF token into index.html by reading and patching it
const fs = require('fs');
const indexHtmlPath = path.join(__dirname, '..', 'public', 'index.html');
let indexHtmlCached = null;

try {
  indexHtmlCached = fs.readFileSync(indexHtmlPath, 'utf8');
} catch (e) {
  console.warn('Could not read index.html for CSRF injection');
}

app.get('/', (req, res) => {
  if (!indexHtmlCached) {
    return res.sendFile(indexHtmlPath, (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        res.status(500).send('Server error');
      }
    });
  }

  const fingerprint = req.ip + '|' + (req.headers['accept-language'] || '').substring(0, 50);
  const token = require('./middleware/security').getCsrfTokenForFingerprint
    ? require('./middleware/security').getCsrfTokenForFingerprint(fingerprint)
    : '';

  const html = indexHtmlCached.replace(
    '<meta name="csrf-token" content="">',
    `<meta name="csrf-token" content="${token}">`
  );

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

/* ============================================
   API Routes
   ============================================ */
app.use('/api/menu', menuRoutes);
app.use('/api/booking', bookingLimiter, bookingRoutes);
app.use('/api/delivery', bookingLimiter, deliveryRoutes);

/* ============================================
   Health Check
   ============================================ */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ============================================
   SPA Fallback
   ============================================ */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

/* ============================================
   Error Handler
   ============================================ */
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON' });
  }
  
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

/* ============================================
   Start Server
   ============================================ */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
