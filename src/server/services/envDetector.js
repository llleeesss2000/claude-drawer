const which = require('which');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

async function detectEnv() {
  const nodeVersion = process.version;
  const nodeOk = parseInt(nodeVersion.slice(1).split('.')[0], 10) >= 18;
  
  let claudeInstalled = false;
  let npxAvailable = false;
  
  try {
    await which('claude');
    claudeInstalled = true;
  } catch (e) {
    claudeInstalled = false;
  }
  
  try {
    await which('npx');
    npxAvailable = true;
  } catch (e) {
    npxAvailable = false;
  }
  
  const claudeDirPath = path.join(os.homedir(), '.claude');
  let claudeDirExists = false;
  
  try {
    const stats = await fs.stat(claudeDirPath);
    claudeDirExists = stats.isDirectory();
  } catch (e) {
    claudeDirExists = false;
  }
  
  const allOk = nodeOk && claudeInstalled && npxAvailable && claudeDirExists;
  
  return {
    nodeVersion,
    nodeOk,
    claudeInstalled,
    npxAvailable,
    claudeDirExists,
    claudeDirPath,
    allOk
  };
}

module.exports = { detectEnv };