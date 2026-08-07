/* ============================================
   Security Middleware
   ============================================ */

const sanitizeHtml = require('sanitize-html');

/* ============================================
   Sanitize all incoming request bodies
   ============================================ */
const sanitizeMiddleware = (req, res, next) => {
  // Only sanitize for mutating methods
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  if (!req.body || typeof req.body !== 'object') {
    return next();
  }

  req.body = sanitizeObject(req.body);
  next();
};

/* ============================================
   Recursively sanitize object values
   ============================================ */
function sanitizeObject(obj) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Sanitize HTML from strings
      sanitized[key] = sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {},
        disallowedTagsMode: 'discard'
      });
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'object' ? sanitizeObject(item) : 
        typeof item === 'string' ? sanitizeHtml(item, { allowedTags: [], allowedAttributes: {} }) : item
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/* ============================================
   CSRF Protection Middleware
   ============================================ */
// Uses per-request double-submit cookie pattern
// In production, use csurf or similar package with proper session storage

const csrfTokens = new Map(); // In production: use Redis
const crypto = require('crypto');

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Generate a unique client fingerprint from IP + accept-language (more stable than user-agent)
function getClientFingerprint(req) {
  const acceptLang = req.headers['accept-language'] || '';
  const ip = req.ip || req.connection.remoteAddress || '';
  return ip + '|' + acceptLang.substring(0, 50);
}

const csrfMiddleware = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Generate token for forms
    const fingerprint = getClientFingerprint(req);
    const token = generateCsrfToken();
    csrfTokens.set(fingerprint, token);
    res.locals.csrfToken = token;
    return next();
  }

  // For mutating requests, validate CSRF token
  const fingerprint = getClientFingerprint(req);
  const token = req.headers['x-csrf-token'] || (req.body && req.body._csrf);
  const storedToken = csrfTokens.get(fingerprint);

  if (!token || !storedToken || token !== storedToken) {
    return res.status(403).json({
      success: false,
      errors: ['Неверный CSRF токен. Обновите страницу и попробуйте снова.']
    });
  }

  // Invalidate used token and generate new one
  csrfTokens.delete(fingerprint);
  const newToken = generateCsrfToken();
  csrfTokens.set(fingerprint, newToken);
  res.locals.csrfToken = newToken;
  
  next();
};

/* ============================================
   Strict Input Validation Middleware
   ============================================ */
const strictValidationMiddleware = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map(d => d.message)
      });
    }

    req.body = value;
    next();
  };
};

/* ============================================
   Security Headers Helper
   ============================================ */
const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  
  // HSTS (enable in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

/* ============================================
   API Key Validation (for internal APIs)
   ============================================ */
const apiKeyMiddleware = (req, res, next) => {
  // Skip if no API key configured
  if (!process.env.API_KEY) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      errors: ['Неверный API ключ']
    });
  }

  next();
};

/* ============================================
   Request Size Limit (additional to body-parser)
   ============================================ */
const requestSizeLimit = (maxSize = '10kb') => {
  const bytes = typeof maxSize === 'string' 
    ? parseInt(maxSize) * (maxSize.toLowerCase().includes('kb') ? 1024 : maxSize.toLowerCase().includes('mb') ? 1024 * 1024 : 1)
    : maxSize;

  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (isNaN(contentLength) || contentLength < 0) {
      // Missing or invalid content-length: let body-parser handle it
      return next();
    }

    if (contentLength > bytes) {
      return res.status(413).json({
        success: false,
        errors: ['Размер запроса превышает допустимый лимит']
      });
    }
    
    next();
  };
};

/* ============================================
   IP Blocking for Repeated Violations
   ============================================ */
const violationTracker = new Map();
const MAX_VIOLATIONS = 10;
const VIOLATION_WINDOW = 60 * 60 * 1000; // 1 hour

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, violations] of violationTracker.entries()) {
    const recent = violations.filter(t => now - t < VIOLATION_WINDOW);
    if (recent.length === 0) {
      violationTracker.delete(ip);
    } else {
      violationTracker.set(ip, recent);
    }
  }
}, 30 * 60 * 1000); // Every 30 minutes

const ipViolationMiddleware = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  
  if (!violationTracker.has(ip)) {
    violationTracker.set(ip, []);
  }
  
  const violations = violationTracker.get(ip).filter(t => now - t < VIOLATION_WINDOW);
  
  if (violations.length >= MAX_VIOLATIONS) {
    return res.status(429).json({
      success: false,
      errors: ['Слишком много нарушений. IP временно заблокирован.']
    });
  }
  
  // Add helper to track violations
  req.trackViolation = () => {
    violations.push(now);
    violationTracker.set(ip, violations);
  };
  
  next();
};

module.exports = {
  sanitizeMiddleware,
  csrfMiddleware,
  strictValidationMiddleware,
  securityHeaders,
  apiKeyMiddleware,
  requestSizeLimit,
  ipViolationMiddleware,
  getCsrfTokenForFingerprint: (fingerprint) => {
    if (!csrfTokens.has(fingerprint)) {
      const token = generateCsrfToken();
      csrfTokens.set(fingerprint, token);
      return token;
    }
    return csrfTokens.get(fingerprint);
  },
  getCsrfToken: () => generateCsrfToken()
};