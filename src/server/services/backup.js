const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
const BACKUP_DIR = path.join(os.homedir(), '.claude-drawer', 'backups');
const MAX_BACKUPS = 10;

const ensureBackupDir = async () => {
  await fs.ensureDir(BACKUP_DIR);
};

const getBackupFilename = (timestamp) => {
  return `settings_${timestamp.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-')}.json`;
};

const timestampToISO = (timestamp) => {
  return timestamp.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
};

const getBackupPath = (filename) => {
  return path.join(BACKUP_DIR, filename);
};

const createBackup = async () => {
  await ensureBackupDir();

  if (!(await fs.pathExists(SETTINGS_PATH))) {
    return { success: false, reason: 'no-settings' };
  }

  const timestamp = new Date();
  const filename = getBackupFilename(timestamp);
  const backupPath = getBackupPath(filename);

  await fs.copy(SETTINGS_PATH, backupPath);

  await cleanupOldBackups();

  return {
    success: true,
    path: backupPath,
    timestamp: timestamp.toISOString()
  };
};

const cleanupOldBackups = async () => {
  const files = await fs.readdir(BACKUP_DIR);
  const backupFiles = files
    .filter(file => file.startsWith('settings_') && file.endsWith('.json'))
    .map(file => ({
      name: file,
      mtime: fs.stat(path.join(BACKUP_DIR, file)).then(stat => stat.mtime)
    }));

  const sortedFiles = await Promise.all(
    backupFiles.map(async ({ name, mtime }) => ({
      name,
      mtime: await mtime
    }))
  );

  sortedFiles.sort((a, b) => b.mtime - a.mtime);

  const toDelete = sortedFiles.slice(MAX_BACKUPS);

  for (const file of toDelete) {
    await fs.remove(path.join(BACKUP_DIR, file.name));
  }
};

const listBackups = async () => {
  await ensureBackupDir();

  const files = await fs.readdir(BACKUP_DIR);
  const backups = [];

  for (const file of files) {
    if (file.startsWith('settings_') && file.endsWith('.json')) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filePath);
      const timestampStr = file
        .replace('settings_', '')
        .replace('.json', '')
        .replace(/_/g, 'T')
        .replace(/-/g, ':')
        .slice(0, 19) + 'Z';

      backups.push({
        filename: file,
        path: filePath,
        timestamp: timestampStr,
        size: stats.size
      });
    }
  }

  return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

const restoreBackup = async (filename) => {
  const backupPath = getBackupPath(filename);

  try {
    if (!(await fs.pathExists(backupPath))) {
      return { success: false, error: 'backup-not-found' };
    }

    const timestamp = new Date();
    const backupCurrentFilename = `settings_${timestamp.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-')}.json`;
    const currentBackupPath = getBackupPath(backupCurrentFilename);

    if (await fs.pathExists(SETTINGS_PATH)) {
      await fs.copy(SETTINGS_PATH, currentBackupPath);
    }

    await fs.copy(backupPath, SETTINGS_PATH);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  createBackup,
  listBackups,
  restoreBackup
};