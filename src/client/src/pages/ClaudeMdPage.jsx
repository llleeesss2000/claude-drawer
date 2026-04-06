import { useState, useEffect } from 'react';


const ClaudeMdPage = () => {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [exists, setExists] = useState(false);
  const [path, setPath] = useState('~/.claude/CLAUDE.md');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchClaudeMd = async () => {
      try {
        const res = await fetch('/api/claudemd').then(r=>r.json());
        const data = res.data;
        setContent(data.content || '');
        setOriginalContent(data.content || '');
        setExists(!!data.content);
      } catch (error) {
        setContent('');
        setOriginalContent('');
        setExists(false);
      }
    };
    fetchClaudeMd();
  }, []);

  const hasUnsavedChanges = content !== originalContent;

  const handleSave = async () => {
    if (!hasUnsavedChanges) return;

    setSaving(true);
    try {
      await fetch('/api/claudemd/save', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ content }) });
      setOriginalContent(content);
      setSaved(true);
      setSaving(false);
      
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="border-l-4 border-blue-500 bg-gray-800 bg-opacity-50 p-6 rounded-r-lg">
          <h2 className="text-xl font-semibold text-blue-300 mb-3">這是什麼？</h2>
          <p className="text-gray-300 mb-4">
            CLAUDE.md 是 Claude Code 的全域行為設定檔，放在 ~/.claude/CLAUDE.md。你可以在這裡設定 Claude 的個人習慣、語言偏好、常用指令等，對所有專案都會生效。
          </p>
          
          <h2 className="text-xl font-semibold text-blue-300 mb-3">怎麼設定？</h2>
          <p className="text-gray-300">
            直接在下方編輯器中輸入你想讓 Claude 記住的事情，例如：「請永遠用繁體中文回答我」
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-500 font-mono">
          檔案路徑: {path}
        </p>
      </div>

      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-96 bg-[#0f172a] text-gray-100 font-mono p-4 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none resize-y"
          placeholder="在此輸入 CLAUDE.md 內容..."
          spellCheck={false}
        />
        {hasUnsavedChanges && !saved && (
          <div className="absolute top-4 right-4 bg-yellow-600 text-white text-xs font-semibold px-3 py-1 rounded-full animate-pulse">
            有未儲存的變更
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-gray-800 pt-4">
        <div className="flex items-center">
          {saved && (
            <span className="text-green-400 font-medium mr-3 animate-fade-in flex items-center">
              ✅ 已儲存
            </span>
          )}
        </div>
        
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges || saving}
          className={`
            px-6 py-2 rounded-lg font-medium transition-colors duration-200
            ${!hasUnsavedChanges || saving 
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-500 text-white'
            }
          `}
        >
          {saving ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              儲存中...
            </span>
          ) : (
            '儲存'
          )}
        </button>
      </div>
    </div>
  );
};

export default ClaudeMdPage;