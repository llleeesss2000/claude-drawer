const express = require('express');
const fs = require('fs');
const path = require('path');
const claudeConfig = require('../services/claudeConfig');

const router = express.Router();

// GET /
router.get('/', async (req, res) => {
  try {
    const servers = await claudeConfig.getInstalledMcpServers();
    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get MCP servers' });
  }
});

// POST /toggle
router.post('/toggle', (req, res) => {
  try {
    const { name, disabled } = req.body;
    const disabledPath = path.join(__dirname, '..', 'data', 'disabled.json');
    
    // 確保資料目錄存在
    const dataDir = path.dirname(disabledPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    let disabledList = {};
    if (fs.existsSync(disabledPath)) {
      disabledList = JSON.parse(fs.readFileSync(disabledPath, 'utf8'));
    }
    
    disabledList[name] = disabled;
    
    fs.writeFileSync(disabledPath, JSON.stringify(disabledList, null, 2));
    
    res.json({ success: true, name, disabled });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to toggle MCP status' });
  }
});

// GET /status/:name
router.get('/status/:name', (req, res) => {
  try {
    const { name } = req.params;
    const disabledPath = path.join(__dirname, '..', 'data', 'disabled.json');
    
    let disabled = false;
    if (fs.existsSync(disabledPath)) {
      const disabledList = JSON.parse(fs.readFileSync(disabledPath, 'utf8'));
      disabled = disabledList[name] || false;
    }
    
    res.json({ name, disabled });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get MCP status' });
  }
});

module.exports = router;