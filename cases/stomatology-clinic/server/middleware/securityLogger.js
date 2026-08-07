const suspiciousPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)/i,
  /(<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>)/gi,
  /(javascript:)/gi,
  /(on\w+\s*=)/gi,
  /(\.\.\/)/g,
  /(\/etc\/passwd)/gi,
  /(UNION\s+SELECT)/i,
];

function securityLogger(req, res, next) {
  const suspicious = [];

  const checkValue = (value, location) => {
    if (typeof value !== 'string') return;
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(value)) {
        suspicious.push({ pattern: pattern.source, value: value.substring(0, 100), location });
      }
    }
  };

  checkValue(req.url, 'url');
  checkValue(req.headers['user-agent'], 'user-agent');
  checkValue(req.headers['referer'], 'referer');

  if (req.query) {
    Object.entries(req.query).forEach(([key, val]) => {
      checkValue(String(val), `query.${key}`);
    });
  }

  if (req.body && typeof req.body === 'object') {
    Object.entries(req.body).forEach(([key, val]) => {
      checkValue(String(val), `body.${key}`);
    });
  }

  if (suspicious.length > 0) {
    console.warn('[SECURITY] Suspicious request detected:', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      patterns: suspicious,
      timestamp: new Date().toISOString(),
    });

    if (suspicious.length >= 3) {
      return res.status(403).json({
        error: 'Заблокировано системой безопасности',
      });
    }
  }

  next();
}

module.exports = { securityLogger };
