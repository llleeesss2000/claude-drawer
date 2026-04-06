const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const https = require('https');
const backupService = require('../services/backup');
const logger = require('../services/logger');

const SETTINGS_DIR = path.join(os.homedir(), '.claude-drawer');
const CLAUDE_DIR = path.join(os.homedir(), '.claude');

router.get('/export', async (req, res) => {
  try {
    const settingsPath = path.join(SETTINGS_DIR, 'settings.json');
    const claudeSettingsPath = path.join(CLAUDE_DIR, 'settings.json');
    const claudeMdPath = path.join(CLAUDE_DIR, 'CLAUDE.md');
    const presetsPath = path.join(SETTINGS_DIR, 'presets.json');
    const disabledPath = path.join(SETTINGS_DIR, 'disabled.json');

    const settings = await fs.readJson(settingsPath).catch(() => ({}));
    const claudeSettings = await fs.readJson(claudeSettingsPath).catch(() => ({}));
    const claudeMd = await fs.readFile(claudeMdPath, 'utf8').catch(() => '');
    const presets = await fs.readJson(presetsPath).catch(() => ({}));
    const disabled = await fs.readJson(disabledPath).catch(() => ({}));

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      claudeSettings,
      claudeMd,
      presets,
      disabled
    };

    res.setHeader('Content-Disposition', 'attachment; filename="claude-drawer-export.json"');
    res.json(exportData);
  } catch (err) {
    logger.error('Export failed:', err);
    res.status(500).json({ error: 'Export failed', message: err.message });
  }
});

router.post('/import', async (req, res) => {
  try {
    const data = req.body;

    if (!data.version) {
      return res.status(400).json({ success: false, error: 'Missing version field' });
    }

    const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await backupService.backupAll(backupTimestamp);

    const restoredItems = [];

    // Write settings
    await fs.outputJson(path.join(SETTINGS_DIR, 'settings.json'), data.settings, { spaces: 2 });
    restoredItems.push('settings.json');

    // Write claude settings
    await fs.outputJson(path.join(CLAUDE_DIR, 'settings.json'), data.claudeSettings, { spaces: 2 });
    restoredItems.push('claude/settings.json');

    // Write CLAUDE.md
    await fs.outputFile(path.join(CLAUDE_DIR, 'CLAUDE.md'), data.claudeMd);
    restoredItems.push('claude/CLAUDE.md');

    // Write presets
    await fs.outputJson(path.join(SETTINGS_DIR, 'presets.json'), data.presets, { spaces: 2 });
    restoredItems.push('presets.json');

    // Write disabled
    await fs.outputJson(path.join(SETTINGS_DIR, 'disabled.json'), data.disabled, { spaces: 2 });
    restoredItems.push('disabled.json');

    logger.info(`Import completed: ${restoredItems.join(', ')}`);
    res.json({ success: true, restoredItems });
  } catch (err) {
    logger.error('Import failed:', err);
    res.status(500).json({ success: false, error: 'Import failed', message: err.message });
  }
});

router.get('/check-update', async (req, res) => {
  try {
    const packagePath = path.join(__dirname, '../../../package.json');
    const packageJson = await fs.readJson(packagePath);
    const currentVersion = packageJson.version;

    const options = {
      hostname: 'registry.npmjs.org',
      path: '/claude-drawer',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    return new Promise((resolve, res) => {
      const req = https.request(options, (npmRes) => {
        let data = '';
        npmRes.on('data', chunk => data += chunk);
        npmRes.on('end', () => {
          try {
            const json = JSON.parse(data);
            const latestVersion = json['dist-tags']?.latest || json['versions']?.[Object.keys(json.versions).pop()]?.version;
            const hasUpdate = require('semver').gt(latestVersion, currentVersion);
            
            let changelog = '';
            if (hasUpdate && json.versions?.[latestVersion]?.changelog) {
              changelog = json.versions[latestVersion].changelog;
            } else if (hasUpdate) {
              changelog = 'See https://github.com/your-org/claude-drawer/blob/main/CHANGELOG.md';
            }

            res.json({
              currentVersion,
              latestVersion,
              hasUpdate,
              changelog
            });
          } catch (parseErr) {
            res.json({ error: true, message: 'Failed to parse registry response' });
          }
          resolve();
        });
      });

      req.on('error', (err) => {
        res.json({ error: true, message: err.message });
        resolve();
      });

      req.end();
    });
  } catch (err) {
    logger.error('Check update failed:', err);
    res.json({ error: true, message: err.message });
  }
});

module.exports = router;