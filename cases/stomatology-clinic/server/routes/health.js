const express = require('express');
const router = express.Router();
const os = require('os');

router.get('/', async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const healthcheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {},
  };

  if (!isProduction) {
    healthcheck.environment = process.env.NODE_ENV || 'development';
    healthcheck.memory = {
      total: Math.round(os.totalmem() / 1024 / 1024),
      free: Math.round(os.freemem() / 1024 / 1024),
      usage: Math.round((1 - os.freemem() / os.totalmem()) * 100),
    };
    healthcheck.cpu = {
      loadavg: os.loadavg(),
      cores: os.cpus().length,
    };
  }

  try {
    healthcheck.checks.process = {
      status: 'ok',
      pid: process.pid,
    };
  } catch (err) {
    healthcheck.checks.process = { status: 'error', message: err.message };
    healthcheck.status = 'degraded';
  }

  const statusCode = healthcheck.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthcheck);
});

module.exports = router;
