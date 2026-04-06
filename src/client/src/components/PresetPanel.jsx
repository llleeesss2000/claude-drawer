import { useState, useEffect } from 'react'

export default function PresetPanel({ onClose, onApply }) {
  const [presets, setPresets] = useState([])
  const [creating, setCreating] = useState(false)
  const [newPreset, setNewPreset] = useState({ name: '', description: '' })
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    fetch('/api/presets').then(r => r.json()).then(setPresets).catch(console.error)
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除此情境組合？')) return
    await fetch(`/api/presets/${id}`, { method: 'DELETE' })
    setPresets(prev => prev.filter(p => p.id !== id))
  }

  const handleCreate = async () => {
    if (!newPreset.name) return
    const res = await fetch('/api/presets', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newPreset, skills: [], mcpServers: [] })
    })
    const created = await res.json()
    setPresets(prev => [...prev, created])
    setCreating(false)
    setNewPreset({ name: '', description: '' })
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      await fetch('/api/presets/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: ev.target.result })
      })
      const updated = await fetch('/api/presets').then(r => r.json())
      setPresets(updated)
    }
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
      <div className="bg-[#1e293b] rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">情境組合</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {presets.map(preset => (
            <div key={preset.id} className="bg-slate-800 rounded-lg p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{preset.name}</span>
                  {preset.isBuiltin && <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">內建</span>}
                </div>
                <p className="text-sm text-gray-400 mt-1">{preset.description}</p>
                <p className="text-xs text-gray-500 mt-1">技能：{preset.skills?.length || 0} 個 ｜ MCP：{preset.mcpServers?.length || 0} 個</p>
              </div>
              <div className="flex gap-2 ml-4 shrink-0">
                <button onClick={() => onApply(preset)} className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded">套用</button>
                <button onClick={() => window.open(`/api/presets/${preset.id}/export`)} className="text-sm bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded">匯出</button>
                {!preset.isBuiltin && (
                  <button onClick={() => handleDelete(preset.id)} className="text-sm bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded">刪除</button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-700 space-y-3">
          {creating ? (
            <div className="space-y-2">
              <input className="w-full bg-slate-700 text-white rounded px-3 py-2 text-sm" placeholder="情境名稱"
                value={newPreset.name} onChange={e => setNewPreset(p => ({...p, name: e.target.value}))} />
              <input className="w-full bg-slate-700 text-white rounded px-3 py-2 text-sm" placeholder="說明（選填）"
                value={newPreset.description} onChange={e => setNewPreset(p => ({...p, description: e.target.value}))} />
              <div className="flex gap-2">
                <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded">建立</button>
                <button onClick={() => setCreating(false)} className="bg-slate-600 hover:bg-slate-500 text-white text-sm px-4 py-2 rounded">取消</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setCreating(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded">+ 建立新情境</button>
              <label className="bg-slate-600 hover:bg-slate-500 text-white text-sm px-4 py-2 rounded cursor-pointer">
                匯入情境 <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
