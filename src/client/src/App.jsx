import { useState, useEffect } from 'react'
import { I18nProvider } from './context/i18nContext'
import { ThemeProvider } from './context/themeContext'
import SetupWizard from './pages/SetupWizard'
import SurveyPage from './pages/SurveyPage'
import Dashboard from './pages/Dashboard'
import ExplorePage from './pages/ExplorePage'
import ClaudeMdPage from './pages/ClaudeMdPage'
import SettingsPage from './pages/SettingsPage'
import BackupPanel from './components/BackupPanel'
import LogViewer from './components/LogViewer'
import PresetPanel from './components/PresetPanel'

export default function App() {
  const [page, setPage] = useState('loading')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showSettings, setShowSettings] = useState(false)
  const [showBackup, setShowBackup] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [pendingChanges, setPendingChanges] = useState({ install: [] })
  const [environmentOk, setEnvironmentOk] = useState(false)
  const [firstLaunch, setFirstLaunch] = useState(false)
  const [surveyDone, setSurveyDone] = useState(false)
  const [language, setLanguage] = useState('en')
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const init = async () => {
      try {
        const [settingsRes, envRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/system/env-check')
        ])

        const settings = await settingsRes.json()
        const envData = await envRes.json()

        setFirstLaunch(settings.firstLaunch)
        setSurveyDone(settings.surveyDone)
        setLanguage(settings.language)
        setTheme(settings.theme)
        setEnvironmentOk(envData.allOk)

        if (!envData.allOk) {
          setPage('setup')
        } else if (settings.firstLaunch && !settings.surveyDone) {
          setPage('survey')
        } else {
          setPage('main')
        }
      } catch (e) {
        setPage('setup')
      }
    }

    init()
  }, [])

  const handleAddSkill = (name) => {
    setPendingChanges(prev => ({
      ...prev,
      install: [...prev.install, name]
    }))
  }

  const handleApplyPreset = (changes) => {
    setPendingChanges(prev => ({
      install: [...prev.install, ...changes.install],
      uninstall: [...prev.uninstall, ...changes.uninstall]
    }))
    setShowPresets(false)
  }

  if (page === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    )
  }

  if (page === 'setup') {
    return <SetupWizard />
  }

  if (page === 'survey') {
    return (
      <I18nProvider language={language}>
        <ThemeProvider theme={theme}>
          <SurveyPage 
            onComplete={() => {
              setSurveyDone(true)
              setPage('main')
            }}
          />
        </ThemeProvider>
      </I18nProvider>
    )
  }

  return (
    <I18nProvider language={language}>
      <ThemeProvider theme={theme}>
        <div className="flex flex-col min-h-screen">
          {page === 'main' && (
            <>
              {/* Header */}
              <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                  <div className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                    🗂️ Claude 抽屜
                  </div>
                  
                  <div className="flex space-x-1">
                    {['dashboard', 'explore', 'claudemd'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          activeTab === tab
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        {tab === 'dashboard' ? '我的設定' : 
                         tab === 'explore' ? '探索中心' : '全域指令'}
                      </button>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setShowPresets(true)}
                      className="px-3 py-2 text-sm rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                    >
                      [情境組合]
                    </button>
                    <button 
                      onClick={() => setShowBackup(true)}
                      className="px-3 py-2 text-sm rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      [備份]
                    </button>
                    <button 
                      onClick={() => {
                        const newTheme = theme === 'light' ? 'dark' : 'light'
                        setTheme(newTheme)
                      }}
                      className="px-3 py-2 text-sm rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      {theme === 'light' ? '🌙 深色' : '☀️ 淺色'}
                    </button>
                    <button 
                      onClick={() => setShowSettings(true)}
                      className="px-3 py-2 text-sm rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      ⚙️ 設定
                    </button>
                  </div>
                </div>
              </header>

              {/* Main Content */}
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {activeTab === 'dashboard' && (
                  <Dashboard 
                    pendingChanges={pendingChanges}
                    setPendingChanges={setPendingChanges}
                    onAddPending={(item) => setPendingChanges(prev => ({
                      ...prev,
                      install: [...prev.install, item]
                    }))}
                  />
                )}
                {activeTab === 'explore' && (
                  <ExplorePage 
                    onAddSkill={handleAddSkill}
                    pendingChanges={pendingChanges}
                  />
                )}
                {activeTab === 'claudemd' && <ClaudeMdPage />}
              </main>

              {/* Overlays */}
              {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-end p-2">
                      <button
                        onClick={() => setShowSettings(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-6">
                      <SettingsPage 
                        onClose={() => setShowSettings(false)}
                        onShowLog={() => {
                          setShowSettings(false)
                          setShowLog(true)
                        }}
                        theme={theme}
                        setTheme={setTheme}
                        language={language}
                        setLanguage={setLanguage}
                      />
                    </div>
                  </div>
                </div>
              )}

              {showBackup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-end p-2">
                      <button
                        onClick={() => setShowBackup(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-6">
                      <BackupPanel onClose={() => setShowBackup(false)} />
                    </div>
                  </div>
                </div>
              )}

              {showLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="w-full max-w-4xl bg-gray-900 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-end p-2 border-b border-gray-700">
                      <button
                        onClick={() => setShowLog(false)}
                        className="text-gray-400 hover:text-gray-200"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-6">
                      <LogViewer onClose={() => setShowLog(false)} />
                    </div>
                  </div>
                </div>
              )}

              {showPresets && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-end p-2">
                      <button
                        onClick={() => setShowPresets(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-6">
                      <PresetPanel 
                        onClose={() => setShowPresets(false)}
                        onApply={handleApplyPreset}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ThemeProvider>
    </I18nProvider>
  )
}