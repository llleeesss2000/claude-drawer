const express = require('express');
const router = express.Router();
const registry = require('../services/registry');
const logger = require('../services/logger');

// GET /
router.get('/', async (req, res) => {
  try {
    const { category, q } = req.query;
    const result = await registry.fetchRegistry(category, q);
    res.json(result);
  } catch (error) {
    logger.error('Error fetching registry:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /categories
router.get('/categories', (req, res) => {
  res.json([
    { id: 'all', label: '全部' },
    { id: 'productivity', label: '生產力' },
    { id: 'development', label: '開發' },
    { id: 'data', label: '資料處理' },
    { id: 'creative', label: '創意' },
    { id: 'other', label: '其他' }
  ]);
});

// GET /item/:name
router.get('/item/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const item = await registry.getItemByName(name);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    logger.error(`Error fetching item ${req.params.name}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;