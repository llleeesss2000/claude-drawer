const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PRESETS_DIR = path.join(os.homedir(), '.claude-drawer');
const PRESETS_FILE = path.join(PRESETS_DIR, 'presets.json');

const BUILTIN_PRESETS = [
  {
    id: 'writing',
    name: '寫作模式',
    description: '適合寫作、文書處理',
    createdAt: new Date().toISOString(),
    skills: ['pdf-reader', 'grammar-check'],
    mcpServers: [],
    isBuiltin: true
  },
  {
    id: 'development',
    name: '開發模式',
    description: '適合軟體開發',
    createdAt: new Date().toISOString(),
    skills: ['eslint', 'typescript'],
    mcpServers: ['github', 'filesystem'],
    isBuiltin: true
  },
  {
    id: 'data',
    name: '資料分析模式',
    description: '適合資料處理與分析',
    createdAt: new Date().toISOString(),
    skills: ['csv-reader', 'chart-generator'],
    mcpServers: [],
    isBuiltin: true
  }
];

// Ensure presets directory and file exist
async function ensurePresetsFile() {
  await fs.ensureDir(PRESETS_DIR);
  if (!(await fs.pathExists(PRESETS_FILE))) {
    await fs.writeJson(PRESETS_FILE, BUILTIN_PRESETS);
  }
}

// Load presets from file
async function loadPresets() {
  await ensurePresetsFile();
  try {
    const data = await fs.readJson(PRESETS_FILE);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    throw new Error(`Failed to load presets: ${err.message}`);
  }
}

// Save presets to file
async function savePresets(presets) {
  await fs.writeJson(PRESETS_FILE, presets, { spaces: 2 });
}

// Exported functions
async function listPresets() {
  const presets = await loadPresets();
  return presets;
}

async function createPreset({ name, description, skills, mcpServers }) {
  const presets = await loadPresets();
  const newPreset = {
    id: crypto.randomUUID(),
    name,
    description: description || '',
    createdAt: new Date().toISOString(),
    skills: skills || [],
    mcpServers: mcpServers || [],
    isBuiltin: false
  };
  presets.push(newPreset);
  await savePresets(presets);
  return newPreset;
}

async function deletePreset(id) {
  const presets = await loadPresets();
  const presetIndex = presets.findIndex(p => p.id === id);
  if (presetIndex === -1) {
    return { success: false, error: 'Preset not found' };
  }
  if (presets[presetIndex].isBuiltin) {
    return { success: false, error: 'Cannot delete builtin preset' };
  }
  presets.splice(presetIndex, 1);
  await savePresets(presets);
  return { success: true };
}

async function exportPreset(id) {
  const presets = await loadPresets();
  const preset = presets.find(p => p.id === id);
  if (!preset) {
    throw new Error('Preset not found');
  }
  // Create exportable version (remove id and createdAt, as these will be regenerated)
  const exportablePreset = {
    name: preset.name,
    description: preset.description,
    skills: preset.skills,
    mcpServers: preset.mcpServers,
    isBuiltin: preset.isBuiltin
  };
  return JSON.stringify(exportablePreset, null, 2);
}

async function importPreset(jsonString) {
  try {
    const presetData = JSON.parse(jsonString);
    
    // Validate required fields
    if (typeof presetData.name !== 'string') {
      return { success: false, error: 'Name field is required' };
    }
    if (!Array.isArray(presetData.skills)) {
      return { success: false, error: 'Skills must be an array' };
    }
    if (!Array.isArray(presetData.mcpServers)) {
      return { success: false, error: 'MCP servers must be an array' };
    }
    
    const presets = await loadPresets();
    
    // Create new preset with generated ID
    const newPreset = {
      id: crypto.randomUUID(),
      name: presetData.name,
      description: presetData.description || '',
      createdAt: new Date().toISOString(),
      skills: presetData.skills,
      mcpServers: presetData.mcpServers,
      isBuiltin: presetData.isBuiltin || false
    };
    
    // If the imported preset is marked as builtin, set it to non-builtin on import
    if (newPreset.isBuiltin) {
      newPreset.isBuiltin = false;
    }
    
    presets.push(newPreset);
    await savePresets(presets);
    return { success: true, preset: newPreset };
  } catch (err) {
    return { success: false, error: `Invalid JSON: ${err.message}` };
  }
}

module.exports = {
  listPresets,
  createPreset,
  deletePreset,
  exportPreset,
  importPreset
};