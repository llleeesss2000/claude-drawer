const express = require('express');
const router = express.Router();
const backup = require('../services/backup');
const logger = require('../services/logger');

// GET /list - 取得備份清單
router.get('/list', async (req, res) => {
  try {
    const backups = await backup.listBackups();
    res.json(backups);
  } catch (error) {
    logger.error('Failed to list backups:', error);
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

// POST /create - 建立備份
router.post('/create', async (req, res) => {
  try {
    const { success, path, timestamp } = await backup.createBackup();
    res.json({ success, path, timestamp });
  } catch (error) {
    logger.error('Failed to create backup:', error);
    res.status(500).json({ success: false, error: 'Failed to create backup' });
  }
});

// POST /restore - 還原備份
router.post('/restore', async (req, res) => {
  const { filename } = req.body;
  
  if (!filename) {
    return res.status(400).json({ success: false, error: 'Filename is required' });
  }

  try {
    await backup.restoreBackup(filename);
    res.json({ success: true });
  } catch (error) {
    logger.error(`Failed to restore backup '${filename}':`, error);
    res.status(500).json({ success: false, error: error.message || 'Failed to restore backup' });
  }
});

module.exports = router;