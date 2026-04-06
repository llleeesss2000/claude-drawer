const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const https = require('https');
const { CURATED_ITEMS } = require('../data/curated');

const CACHE_DIR = path.join(os.homedir(), '.claude-drawer', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'registry.json');
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper function to determine category from keywords
function getCategory(keywords) {
  const lowerKeywords = keywords.map(k => k.toLowerCase());
  if (lowerKeywords.some(k => k.includes('dev') || k.includes('code') || k.includes('git'))) {
    return 'development';
  }
  if (lowerKeywords.some(k => k.includes('data') || k.includes('csv') || k.includes('chart'))) {
    return 'data';
  }
  if (lowerKeywords.some(k => k.includes('write') || k.includes('doc') || k.includes('pdf'))) {
    return 'productivity';
  }
  if (lowerKeywords.some(k => k.includes('creative') || k.includes('image'))) {
    return 'creative';
  }
  return 'other';
}

// Parse npm search result item to standardized format
function parseItem(item) {
  const pkg = item.package;
  const keywords = pkg.keywords || [];
  const source = pkg.name.startsWith('@anthropic') ? 'official' : 'community';
  
  return {
    name: pkg.name,
    description: pkg.description || '',
    version: pkg.version || 'latest',
    author: pkg.author?.name || '',
    source,
    category: getCategory(keywords),
    keywords,
    npmUrl: `https://www.npmjs.com/package/${pkg.name}`
  };
}

async function fetchRegistry() {
  const now = Date.now();
  
  try {
    const data = await new Promise((resolve, reject) => {
      const req = https.request(
        'https://registry.npmjs.org/-/v1/search?text=claude-code+skills&size=200',
        { timeout: 10000 },
        (res) => {
          let rawData = '';
          res.on('data', chunk => rawData += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(rawData);
              resolve(parsed);
            } catch (e) {
              reject(e);
            }
          });
        }
      );
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });

    const npmItems = data.objects.map(obj => parseItem(obj));

    // 合併精選清單：精選優先，npm 結果去除已在精選中的重複項目
    const curatedNames = new Set(CURATED_ITEMS.map(i => i.name));
    const filtered = npmItems.filter(i => !curatedNames.has(i.name));

    // 官方排在社群前面
    filtered.sort((a, b) => {
      if (a.source === 'official' && b.source !== 'official') return -1;
      if (a.source !== 'official' && b.source === 'official') return 1;
      return 0;
    });

    const items = [...CURATED_ITEMS, ...filtered];

    // Save to cache
    await fs.ensureDir(CACHE_DIR);
    await fs.writeJson(CACHE_FILE, {
      items,
      lastUpdated: now
    }, { spaces: 2 });

    return items;
  } catch (error) {
    console.error('Network error fetching registry:', error.message);
    const cached = await getCachedRegistry();
    if (cached) {
      return cached.items;
    }
    throw error;
  }
}

async function getCachedRegistry() {
  try {
    if (!await fs.pathExists(CACHE_FILE)) {
      return null;
    }

    const content = await fs.readJson(CACHE_FILE);
    const { items, lastUpdated } = content;

    // Check if cache is expired
    if (now - lastUpdated > CACHE_EXPIRY_MS) {
      return null;
    }

    return { items, lastUpdated, fromCache: true };
  } catch (error) {
    console.error('Error reading cached registry:', error.message);
    return null;
  }
}

// Get current time for cache expiry check
const now = Date.now;

module.exports = { fetchRegistry, getCachedRegistry };