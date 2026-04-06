import React, { useState } from 'react';

export default function SurveyPage({ onComplete }) {
  const [step, setStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedPurposes, setSelectedPurposes] = useState([]);
  
  const languages = [
    'zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'es', 'fr', 'de', 'ru', 'pt',
    'it', 'nl', 'pl', 'tr', 'id'
  ];

  const handleLanguageSelect = (lang) => {
    setSelectedLanguage(lang);
    setStep(2);
  };

  const handlePurposeToggle = (purpose) => {
    setSelectedPurposes(prev =>
      prev.includes(purpose)
        ? prev.filter(p => p !== purpose)
        : [...prev, purpose]
    );
  };

  const handleNextStep = async () => {
    if (selectedPurposes.length === 0) return;
    
    setStep(3);
  };

  const saveAndComplete = async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyDone: true, firstLaunch: false, language: selectedLanguage || 'zh-TW' })
      });
    } catch (_) {}
    onComplete();
  };

  const handleApplyPreset = async () => {
    let presetName = '寫作模式';
    if (selectedPurposes.includes('💻 寫程式 / 開發')) presetName = '開發模式';
    else if (selectedPurposes.includes('✍️ 寫作 / 文書')) presetName = '寫作模式';
    else if (selectedPurposes.includes('📊 資料分析')) presetName = '資料分析模式';

    try {
      await fetch('/api/presets/apply-by-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: presetName })
      });
    } catch (_) {}
    await saveAndComplete();
  };

  const handleSkipPreset = async () => {
    await saveAndComplete();
  };

  const getRecommendation = () => {
    if (selectedPurposes.includes('💻 寫程式 / 開發')) {
      return { name: '開發模式', desc: '最佳化程式碼生成、除錯與文件撰寫' };
    }
    if (selectedPurposes.includes('✍️ 寫作 / 文書')) {
      return { name: '寫作模式', desc: '優化語氣風格、潤飾與多種文體支援' };
    }
    if (selectedPurposes.includes('📊 資料分析')) {
      return { name: '資料分析模式', desc: '強化資料處理、視覺化與統計推論能力' };
    }
    return { name: '通用模式', desc: '一般對話與多元任務支援' };
  };

  if (step === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-12 text-center">選擇語言 / Choose Language</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-5xl w-full">
          {languages.map(lang => (
            <button
              key={lang}
              onClick={() => handleLanguageSelect(lang)}
              className="bg-blue-900 hover:bg-blue-800 text-lg py-4 px-6 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              {lang === 'zh-TW' ? '繁體中文' : 
               lang === 'zh-CN' ? '简体中文' : 
               lang === 'ja' ? '日本語' : 
               lang === 'ko' ? '한국어' : 
               lang === 'en' ? 'English' : 
               lang === 'es' ? 'Español' : 
               lang === 'fr' ? 'Français' : 
               lang === 'de' ? 'Deutsch' : 
               lang === 'ru' ? 'Русский' : 
               lang === 'pt' ? 'Português' : 
               lang === 'it' ? 'Italiano' : 
               lang === 'nl' ? 'Nederlands' : 
               lang === 'pl' ? 'Polski' : 
               lang === 'tr' ? 'Türkçe' : 
               lang === 'ar' ? 'العربية' : lang}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-4">
        <h1 className="text-3xl md:text-5xl font-bold mb-12 text-center">你主要用 Claude 做什麼？</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          {[
            { id: '💻 寫程式 / 開發', label: '💻 寫程式 / 開發' },
            { id: '✍️ 寫作 / 文書', label: '✍️ 寫作 / 文書' },
            { id: '📊 資料分析', label: '📊 資料分析' },
            { id: '🔧 其他', label: '🔧 其他' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handlePurposeToggle(item.id)}
              className={`relative p-6 rounded-xl border-2 transition-all duration-200 flex items-center space-x-4 text-lg font-medium
                ${selectedPurposes.includes(item.id) 
                  ? 'border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-900/50' 
                  : 'border-slate-700 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'}`}
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center border-2
                ${selectedPurposes.includes(item.id)
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-slate-500 bg-transparent text-transparent'}`}>
                {selectedPurposes.includes(item.id) && '✓'}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleNextStep}
          disabled={selectedPurposes.length === 0}
          className="mt-12 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xl font-bold shadow-xl transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 flex items-center space-x-2"
        >
          <span>下一步 →</span>
        </button>
      </div>
    );
  }

  const recommendation = getRecommendation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-4">
      <h1 className="text-3xl md:text-5xl font-bold mb-8 text-center">推薦設定</h1>
      
      <div className="max-w-xl w-full bg-slate-800/50 border border-slate-600 rounded-2xl p-8 text-center shadow-2xl">
        <div className="text-5xl mb-6">💡</div>
        <h2 className="text-3xl font-bold mb-4 text-blue-300">{recommendation.name}</h2>
        <p className="text-xl text-slate-300">{recommendation.desc}</p>
      </div>

      <div className="mt-12 space-x-6 flex flex-col sm:flex-row">
        <button
          onClick={handleApplyPreset}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-xl font-bold shadow-xl transition-all duration-200 hover:shadow-2xl hover:-translate-y-1"
        >
          套用推薦情境 →
        </button>
        <button
          onClick={handleSkipPreset}
          className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-xl font-bold shadow-xl transition-all duration-200 hover:shadow-2xl hover:-translate-y-1"
        >
          跳過，自行設定
        </button>
      </div>
    </div>
  );
}