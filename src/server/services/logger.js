const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const LOG_DIR = path.join(os.homedir(), '.claude-drawer', 'logs');
const ERROR_MESSAGES = {
  ENOENT: '找不到設定檔，Claude Code 可能尚未初始化',
  EACCES: '權限不足，請以管理員身份執行',
  ECONNREFUSED: 'MCP 伺服器未啟動，請先按啟動按鈕',
  JSON_PARSE: '設定檔格式損壞，建議從備份還原',
  NETWORK_TIMEOUT: '網路連線逾時，請確認網路後再試',
  NPX_NOT_FOUND: 'Node.js 環境可能未正確安裝',
  UNKNOWN: '發生未知錯誤，請查看日誌'
};

function getLogFileName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `app-${year}-${month}-${day}.log`;
}

function getTodayLogPath() {
  return path.join(LOG_DIR, getLogFileName());
}

function cleanupOldLogs() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7);

  fs.readdir(LOG_DIR)
    .then(files => {
      files.forEach(file => {
        if (file.startsWith('app-') && file.endsWith('.log')) {
          const dateStr = file.replace('app-', '').replace('.log', '');
          const [year, month, day] = dateStr.split('-').map(Number);
          const fileDate = new Date(year, month - 1, day);
          
          if (fileDate < cutoffDate) {
            fs.remove(path.join(LOG_DIR, file)).catch(() => {});
          }
        }
      });
    })
    .catch(() => {});
}

async function ensureLogDirectory() {
  try {
    await fs.ensureDir(LOG_DIR);
  } catch (err) {
    // Silently fail as we don't want to crash the app due to logging issues
  }
}

async function writeLogEntry(entry) {
  await ensureLogDirectory();
  const logPath = getTodayLogPath();
  
  try {
    await fs.appendFile(logPath, JSON.stringify(entry) + '\n');
  } catch (err) {
    // Silently fail as we don't want to crash the app due to logging issues
  }

  cleanupOldLogs();
}

function log(level, action, message, detail = null) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: level,
    action: action,
    message: message,
    detail: detail
  };

  writeLogEntry(entry);

  if (level === 'info') {
    console.log(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.error(JSON.stringify(entry));
  }
}

async function getLogs(limit = 100) {
  await ensureLogDirectory();
  const logPath = getTodayLogPath();
  
  try {
    const exists = await fs.pathExists(logPath);
    if (!exists) return [];

    const content = await fs.readFile(logPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    // Parse and reverse to get latest logs first, then slice
    const logs = lines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      })
      .filter(log => log !== null);
    
    return logs.slice(-limit).reverse();
  } catch (err) {
    return [];
  }
}

function info(action, message, detail = null) {
  log('info', action, message, detail);
}

function warn(action, message, detail = null) {
  log('warn', action, message, detail);
}

function error(action, message, detail = null) {
  log('error', action, message, detail);
}

function friendlyError(err) {
  if (!err) return ERROR_MESSAGES.UNKNOWN;
  
  const code = err.code || '';
  
  if (ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }
  
  // Fallback to checking message content
  const message = err.message ? err.message.toLowerCase() : '';
  
  if (message.includes('no such file') || message.includes('cannot find module')) {
    return ERROR_MESSAGES.ENOENT;
  }
  
  if (message.includes('permission denied') || message.includes('access denied')) {
    return ERROR_MESSAGES.EACCES;
  }
  
  if (message.includes('connection refused')) {
    return ERROR_MESSAGES.ECONNREFUSED;
  }
  
  if (message.includes('json') && message.includes('parse') || message.includes('unexpected token')) {
    return ERROR_MESSAGES.JSON_PARSE;
  }
  
  if (message.includes('timeout') || message.includes('timed out')) {
    return ERROR_MESSAGES.NETWORK_TIMEOUT;
  }
  
  if (message.includes('npx') || message.includes('command not found')) {
    return ERROR_MESSAGES.NPX_NOT_FOUND;
  }
  
  return ERROR_MESSAGES.UNKNOWN;
}

module.exports = {
  log,
  getLogs,
  info,
  warn,
  error,
  ERROR_MESSAGES,
  friendlyError
};