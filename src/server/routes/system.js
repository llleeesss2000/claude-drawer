const express = require('express');
const router = express.Router();
const path = require('path');
const { exec } = require('child_process');
const envDetector = require('../services/envDetector');
const logger = require('../services/logger');
const packageJson = require('../../../package.json');

// GET /env-check
router.get('/env-check', async (req, res) => {
  try {
    const result = await envDetector.detectEnv();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /restart
router.post('/restart', (req, res) => {
  const isWindows = process.platform === 'win32';
  const command = isWindows 
    ? 'taskkill /IM claude.exe /F'
    : 'pkill -f "claude"';
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.json({
        success: false,
        message: `Restart failed: ${error.message}`
      });
    }
    res.json({
      success: true,
      message: `Restart command executed successfully on ${isWindows ? 'Windows' : 'Unix-like system'}`
    });
  });
});

// GET /health
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: packageJson.version || 'unknown'
  });
});

// GET /logs
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await logger.getLogs(limit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /friendly-error?code=XXX
router.get('/friendly-error', (req, res) => {
  const { code } = req.query;
  const msg = logger.ERROR_MESSAGES[code] || logger.ERROR_MESSAGES.UNKNOWN;
  res.json({ code, message: msg });
});

module.exports = router;