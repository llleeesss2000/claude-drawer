const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const INSTALL_DIR = path.join(os.homedir(), '.local', 'share', 'claude-drawer');
const BIN_PATH = path.join(os.homedir(), '.local', 'bin', 'claude-drawer');

function getDesktopPath() {
  if (process.platform === 'win32') return path.join(os.homedir(), 'Desktop');
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Desktop');

  try {
    const xdgPath = execSync('xdg-user-dir DESKTOP', { encoding: 'utf8' }).trim();
    if (xdgPath && xdgPath !== os.homedir() && fs.existsSync(xdgPath)) return xdgPath;
  } catch (_) {}

  for (const candidate of ['Desktop', '桌面', 'desktop']) {
    const p = path.join(os.homedir(), candidate);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function buildDesktopContent(execPath) {
  return [
    '[Desktop Entry]',
    'Type=Application',
    'Name=Claude 抽屜',
    'Comment=Claude Code 圖形化管理工具',
    `Exec=${execPath}`,
    'Terminal=false',
    'StartupNotify=true',
    'Categories=Utility;',
    ''
  ].join('\n');
}

async function createDesktopShortcut() {
  const platform = process.platform;
  const results = [];

  if (platform === 'win32') {
    const desktopPath = getDesktopPath();
    const shortcutPath = path.join(desktopPath, 'claude-drawer.bat');
    const content = `@echo off\r\nnode "${path.join(INSTALL_DIR, 'bin', 'claude-drawer.js')}"\r\npause\r\n`;
    await fs.ensureDir(desktopPath);
    await fs.outputFile(shortcutPath, content);
    results.push(shortcutPath);

  } else if (platform === 'darwin') {
    const desktopPath = getDesktopPath();
    const shortcutPath = path.join(desktopPath, 'claude-drawer.command');
    const content = `#!/bin/bash\nexec node "${path.join(INSTALL_DIR, 'bin', 'claude-drawer.js')}"\n`;
    await fs.ensureDir(desktopPath);
    await fs.outputFile(shortcutPath, content);
    await fs.chmod(shortcutPath, 0o755);
    results.push(shortcutPath);

  } else {
    // Linux：建立應用程式選單 + 桌面捷徑
    const content = buildDesktopContent(BIN_PATH);

    // 應用程式選單
    const appMenuDir = path.join(os.homedir(), '.local', 'share', 'applications');
    const appMenuPath = path.join(appMenuDir, 'claude-drawer.desktop');
    await fs.ensureDir(appMenuDir);
    await fs.outputFile(appMenuPath, content);
    await fs.chmod(appMenuPath, 0o755);
    results.push(appMenuPath);
    try { execSync(`update-desktop-database "${appMenuDir}"`, { stdio: 'ignore' }); } catch (_) {}

    // 桌面捷徑
    const desktopPath = getDesktopPath();
    if (desktopPath) {
      const desktopFilePath = path.join(desktopPath, 'claude-drawer.desktop');
      await fs.outputFile(desktopFilePath, content);
      await fs.chmod(desktopFilePath, 0o755);
      // GNOME 需標記信任才能雙擊
      try { execSync(`gio set "${desktopFilePath}" metadata::trusted true`, { stdio: 'ignore' }); } catch (_) {}
      results.push(desktopFilePath);
    }
  }

  return { success: true, paths: results };
}

module.exports = { createDesktopShortcut };
