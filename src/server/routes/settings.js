const express = require('express');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const logger = require('../services/logger');

const router = express.Router();

const SETTINGS_FILE = path.join(os.homedir(), '.claude-drawer', 'settings.json');

const DEFAULT_SETTINGS = {
  language: 'zh-TW',
  theme: 'dark',
  firstLaunch: true,
  surveyDone: false
};

router.get('/', async (req, res) => {
  try {
    let settings = {};
    if (await fs.pathExists(SETTINGS_FILE)) {
      settings = await fs.readJson(SETTINGS_FILE) || {};
    }
    res.json({ ...DEFAULT_SETTINGS, ...settings });
  } catch (error) {
    res.json(DEFAULT_SETTINGS);
  }
});

router.post('/', async (req, res) => {
  try {
    const updates = req.body || {};
    
    // 讀取現有設定或建立空物件
    let existingSettings = await fs.readJson(SETTINGS_FILE, { throws: false }) || {};
    
    // 合併更新
    const mergedSettings = { ...existingSettings, ...updates };
    
    // 確保目標目錄存在
    const dirPath = path.dirname(SETTINGS_FILE);
    await fs.ensureDir(dirPath);
    
    // 寫入設定
    await fs.writeJson(SETTINGS_FILE, mergedSettings, { spaces: 2 });
    
    res.json(mergedSettings);
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;