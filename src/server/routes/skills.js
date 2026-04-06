const express = require('express');
const router = express.Router();
const claudeConfig = require('../services/claudeConfig');
const skillRunner = require('../services/skillRunner');
const backup = require('../services/backup');

let currentRunner = null;

router.get('/', async (req, res) => {
  try {
    const skills = await claudeConfig.getInstalledSkills();
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/apply', async (req, res) => {
  try {
    const { install, remove } = req.body;
    
    await backup.createBackup();
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const changes = { install: install || [], remove: remove || [] };
    
    currentRunner = skillRunner.applyChanges(changes, (event) => {
      res.write('data: ' + JSON.stringify(event) + '\n\n');
    });
    
    currentRunner.then(() => {
      res.end();
    }).catch((error) => {
      res.write('data: ' + JSON.stringify({ type: 'error', message: error.message }) + '\n\n');
      res.end();
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/resume', async (req, res) => {
  try {
    const { action } = req.body;
    
    if (!currentRunner) {
      return res.json({ success: false, message: 'No running runner to resume' });
    }
    
    const success = await currentRunner.resume(action);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;