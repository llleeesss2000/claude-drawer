const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
const DISABLED_PATH = path.join(os.homedir(), '.claude-drawer', 'disabled.json');

async function readSettings() {
  try {
    const data = await fs.readFile(CLAUDE_SETTINGS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { skills: [], mcpServers: {}, plugins: [] };
    }
    throw error;
  }
}

async function writeSettings(data) {
  const dir = path.dirname(CLAUDE_SETTINGS_PATH);
  await fs.ensureDir(dir);
  await fs.writeFile(CLAUDE_SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf8');
}

async function readDisabled() {
  try {
    const data = await fs.readFile(DISABLED_PATH, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.mcpServers && Array.isArray(parsed.mcpServers) ? parsed : { mcpServers: [] };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { mcpServers: [] };
    }
    throw error;
  }
}

async function writeDisabled(data) {
  const dir = path.dirname(DISABLED_PATH);
  await fs.ensureDir(dir);
  await fs.writeFile(DISABLED_PATH, JSON.stringify(data, null, 2), 'utf8');
}

async function getInstalledSkills() {
  const settings = await readSettings();
  return (settings.skills || []).map(skill => {
    const name = typeof skill === 'string' ? skill : skill.name;
    let source = 'community';
    
    if (typeof skill === 'object' && skill.source) {
      source = skill.source;
    } else {
      if (name.startsWith('official-')) {
        source = 'official';
      } else if (name.startsWith('local-')) {
        source = 'local';
      }
    }
    
    return { name, source };
  });
}

async function getInstalledMcpServers() {
  const settings = await readSettings();
  const disabledData = await readDisabled();
  const disabledList = new Set(disabledData.mcpServers || []);
  
  const servers = [];
  for (const [name, config] of Object.entries(settings.mcpServers || {})) {
    servers.push({
      name,
      config: config || {},
      disabled: disabledList.has(name)
    });
  }
  return servers;
}

module.exports = {
  readSettings,
  writeSettings,
  readDisabled,
  writeDisabled,
  getInstalledSkills,
  getInstalledMcpServers
};