const express = require('express');
const router = express.Router();
const presets = require('../services/presets');
const logger = require('../services/logger');

// GET / - list all presets
router.get('/', async (req, res) => {
  try {
    const result = await presets.listPresets();
    res.json(result);
  } catch (error) {
    logger.error('Error listing presets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / - create new preset
router.post('/', async (req, res) => {
  try {
    const { name, description, skills, mcpServers } = req.body;
    const result = await presets.createPreset({ name, description, skills, mcpServers });
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error creating preset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id - delete preset by ID
router.delete('/:id', async (req, res) => {
  try {
    await presets.deletePreset(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting preset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id/export - export preset as JSON file
router.get('/:id/export', async (req, res) => {
  try {
    const preset = await presets.exportPreset(req.params.id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="preset-${preset.name.replace(/[^a-z0-9]/gi, '-')}.json"`);
    res.json(preset);
  } catch (error) {
    logger.error('Error exporting preset:', error);
    res.status(404).json({ error: 'Preset not found' });
  }
});

// POST /import - import preset from data
router.post('/import', async (req, res) => {
  try {
    const { data } = req.body;
    const result = await presets.importPreset(data);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error importing preset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /apply-by-name - apply a builtin preset by name
router.post('/apply-by-name', async (req, res) => {
  try {
    const { name } = req.body;
    const all = await presets.listPresets();
    const preset = all.find(p => p.name === name);
    if (!preset) return res.status(404).json({ error: 'Preset not found' });
    res.json({ success: true, preset });
  } catch (error) {
    logger.error('presets', 'apply-by-name error', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;