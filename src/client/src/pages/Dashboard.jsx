import { useState, useEffect } from 'react';
import SkillItem from '../components/SkillItem';
import McpItem from '../components/McpItem';
import ExecutePanel from '../components/ExecutePanel';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const [skills, setSkills] = useState([]);
  const [mcpServers, setMcpServers] = useState([]);
  const [pendingChanges, setPendingChanges] = useState({ install: [], remove: [] });
  const [showExecutePanel, setShowExecutePanel] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const skillsRes = await fetch('/api/skills');
        const skillsData = await skillsRes.json();
        setSkills(skillsData);

        const mcpRes = await fetch('/api/mcp');
        const mcpData = await mcpRes.json();
        setMcpServers(mcpData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
        <h1 className="text-2xl font-bold">🗂️ Claude 抽屜</h1>
        <div className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
          深色模式
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Skills Section */}
        <section className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-200">技能</h2>
          {skills.length === 0 ? (
            <EmptyState message="還沒有任何技能" />
          ) : (
            <div className="space-y-3">
              {skills.map((skill, index) => (
                <SkillItem
                  key={index}
                  skill={skill}
                  pendingChanges={pendingChanges}
                  setPendingChanges={setPendingChanges}
                />
              ))}
            </div>
          )}
        </section>

        {/* MCP Servers Section */}
        <section className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-200">MCP 伺服器</h2>
          {mcpServers.length === 0 ? (
            <EmptyState message="還沒有任何 MCP 伺服器" />
          ) : (
            <div className="space-y-3">
              {mcpServers.map((server, index) => (
                <McpItem
                  key={index}
                  server={server}
                  pendingChanges={pendingChanges}
                  setPendingChanges={setPendingChanges}
                />
              ))}
            </div>
          )}
        </section>

        {/* Plugins Section */}
        <section className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-200">外掛</h2>
          <EmptyState message="即將推出" />
        </section>
      </main>

      {/* Fixed Bottom Action Bar */}
      <footer className="border-t border-slate-800 bg-slate-900 p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <button className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors">
            備份目前設定
          </button>
          <button
            className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
              (pendingChanges.install.length > 0 || pendingChanges.remove.length > 0)
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            disabled={pendingChanges.install.length === 0 && pendingChanges.remove.length === 0}
            onClick={() => setShowExecutePanel(true)}
          >
            執行變更
            <span className="bg-indigo-500 text-xs px-2 py-0.5 rounded-full">
              {pendingChanges.install.length + pendingChanges.remove.length}
            </span>
          </button>
        </div>
      </footer>

      {/* Execute Panel Overlay */}
      {showExecutePanel && (
        <ExecutePanel
          pendingChanges={pendingChanges}
          setPendingChanges={setPendingChanges}
          setShowExecutePanel={setShowExecutePanel}
        />
      )}
    </div>
  );
}