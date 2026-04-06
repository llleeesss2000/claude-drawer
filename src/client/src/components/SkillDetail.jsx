export default function SkillDetail({ item, onClose, onAdd, isAdded }) {
  return (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
  <div className="bg-[#1e293b] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col text-white">
    <div className="flex justify-between items-start p-6 border-b border-slate-700">
      <div>
        <h2 className="text-2xl font-bold">{item.name}</h2>
        <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${
          item.source === 'featured'
            ? 'bg-purple-500/20 text-purple-300'
            : item.source === 'official'
            ? 'bg-blue-500/20 text-blue-300'
            : 'bg-slate-600 text-slate-300'
        }`}>
          {item.source === 'featured' ? '⭐ 精選' : item.source === 'official' ? '官方' : '社群'}
        </span>
      </div>
      <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-400">
        <span>版本：{item.version || 'N/A'}</span>
        <span>作者：{item.author || 'N/A'}</span>
      </div>
      <div>
        <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-500/20 text-blue-300 rounded-full">
          分類：{item.category}
        </span>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-2">說明</h3>
        <p className="text-slate-300 leading-relaxed whitespace-pre-line">{item.description}</p>
      </div>
      {item.npmUrl && (
        <div>
          <a href={item.npmUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium">
            {item.npmUrl.includes('github.com') ? '在 GitHub 查看 →'
              : item.npmUrl.includes('figma.com') ? '在 Figma 查看 →'
              : item.npmUrl.includes('shadcn') ? '在官網查看 →'
              : '在 npm 查看 →'}
          </a>
        </div>
      )}
      {item.source !== 'official' && (
        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
          <p className="text-sm text-orange-300">⚠️ 此為社群維護套件，非官方出品，請自行評估風險</p>
        </div>
      )}
    </div>
    <div className="p-6 border-t border-slate-700">
      <button onClick={onAdd} disabled={isAdded}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
          isAdded ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'
        }`}>
        {isAdded ? '已加入 ✓' : '+ 加入'}
      </button>
    </div>
  </div>
</div>
  );
}
