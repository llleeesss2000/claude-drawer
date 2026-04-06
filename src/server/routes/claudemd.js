const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const backup = require('../services/backup');
const logger = require('../services/logger');

// GET / - 讀取 ~/.claude/CLAUDE.md 內容
router.get('/', async (req, res) => {
  try {
    const claudemdPath = path.join(os.homedir(), '.claude', 'CLAUDE.md');
    
    let content = '';
    let exists = false;
    
    if (await fs.pathExists(claudemdPath)) {
      content = await fs.readFile(claudemdPath, 'utf8');
      exists = true;
    }
    
    res.json({
      content,
      exists,
      path: claudemdPath
    });
  } catch (error) {
    logger.error('Error reading CLAUDE.md:', error);
    res.status(500).json({
      content: '',
      exists: false,
      path: path.join(os.homedir(), '.claude', 'CLAUDE.md'),
      error: error.message
    });
  }
});

// POST /save - 寫入 ~/.claude/CLAUDE.md
router.post('/save', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (typeof content !== 'string') {
      return res.status(400).json({ success: false, error: 'Content must be a string' });
    }
    
    const claudemdPath = path.join(os.homedir(), '.claude', 'CLAUDE.md');
    
    // 建立目錄（如果不存在）
    await fs.ensureDir(path.dirname(claudemdPath));
    
    // 備份檔案
    const backupPath = await backup.createBackup(claudemdPath);
    
    // 寫入檔案
    await fs.writeFile(claudemdPath, content, 'utf8');
    
    logger.info(`CLAUDE.md saved to ${claudemdPath}`);
    
    res.json({
      success: true,
      backupPath
    });
  } catch (error) {
    logger.error('Error saving CLAUDE.md:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;