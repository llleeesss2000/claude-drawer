const shortcut = require('../src/server/services/shortcut');

(async () => {
  try {
    await shortcut.createDesktopShortcut();
    console.log('✅ Claude 抽屜已準備就緒！桌面捷徑已建立，雙擊即可啟動。');
  } catch (err) {
    console.warn('⚠️  桌面捷徑建立失敗，請手動執行 claude-drawer 啟動。');
  }
})();