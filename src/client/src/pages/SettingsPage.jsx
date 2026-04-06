import React, { useState, useEffect } from 'react';

const SettingsPage = ({ onClose, onShowLog }) => {
  const [settings, setSettings] = useState({
    language: 'zh-TW',
    theme: 'dark',
  });
  const [updateInfo, setUpdateInfo] = useState(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [healthInfo, setHealthInfo] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setSettings(data);
      } catch (e) {}
    };

    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/system/health');
        const data = await res.json();
        setHealthInfo(data);
      } catch (e) {}
    };

    fetchSettings();
    fetchHealth();
  }, []);

  const handleLanguageChange = async (e) => {
    const newLang = e.target.value;
    setSettings(prev => ({ ...prev, language: newLang }));
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLang }),
      });
    } catch (e) {}
  };

  const handleThemeChange = async (theme) => {
    setSettings(prev => ({ ...prev, theme }));
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
    } catch (e) {}
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const res = await fetch('/api/export/check-update');
      const data = await res.json();
      setUpdateInfo(data);
    } catch (e) {
      setUpdateInfo({ message: '檢查失敗' });
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleExport = () => {
    window.open('/api/export/export');
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await fetch('/api/export/import', {
        method: 'POST',
        body: formData,
      });
      // 可以顯示成功訊息
    } catch (err) {}
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e293b] text-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">設定</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-8">
          {/* 1. 語言 */}
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">語言</h3>
            <select
              value={settings.language}
              onChange={handleLanguageChange}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="zh-TW">中文（繁體）</option>
              <option value="zh-CN">中文（简体）</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="es">Español</option>
              <option value="it">Italiano</option>
              <option value="pt">Português</option>
              <option value="ru">Русский</option>
              <option value="ar">العربية</option>
              <option value="tr">Türkçe</option>
              <option value="nl">Nederlands</option>
              <option value="id">Bahasa Indonesia</option>
            </select>
          </section>

          {/* 2. 主題 */}
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">主題</h3>
            <div className="flex gap-2">
              {['dark', 'light', 'system'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  className={`px-4 py-2 rounded-lg capitalize transition-all ${
                    settings.theme === theme
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </section>

          {/* 3. 更新 */}
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">更新</h3>
            <button
              onClick={handleCheckUpdate}
              disabled={checkingUpdate}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {checkingUpdate ? '檢查中...' : '檢查更新'}
            </button>
            {updateInfo && (
              <div
                className={`mt-2 text-sm p-2 rounded ${
                  updateInfo.hasUpdate ? 'bg-yellow-900/30 border border-yellow-600' : 'bg-slate-800'
                }`}
              >
                {updateInfo.message}
              </div>
            )}
          </section>

          {/* 4. 匯出匯入 */}
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">匯出與匯入</h3>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                匯出
              </button>
              <label className="flex-1 flex items-center justify-center bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer">
                匯入
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </section>

          {/* 5. 關於 */}
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">關於</h3>
            <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg">
              <span className="text-slate-300">版本</span>
              <span className="font-mono text-slate-200">
                {healthInfo?.version || 'v1.0.0'}
              </span>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-indigo-400 hover:text-indigo-300 underline transition-colors"
            >
              GitHub
            </a>
          </section>
        </div>
        <div className="px-6 py-4 border-t border-slate-700 flex justify-center">
          <button
            onClick={onShowLog}
            className="text-slate-400 hover:text-white underline transition-colors"
          >
            查看記錄
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;