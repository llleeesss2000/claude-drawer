import React, { useState, useEffect, useRef } from 'react';

export default function ExecutePanel({ changes, onClose, onComplete }) {
  const [phase, setPhase] = useState('confirm');
  const [events, setEvents] = useState([]);
  const [failedItem, setFailedItem] = useState(null);
  const [resumeAction, setResumeAction] = useState(null);
  const eventSourceRef = useRef(null);

  const startExecution = () => {
    setPhase('running');
    
    const eventSource = new EventSource(`/api/skills/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(changes),
    });

    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setEvents(prev => [...prev, data]);

        if (data.type === 'item-done' && !data.success) {
          setFailedItem({ item: data.item, error: data.error });
          eventSource.close();
          setPhase('paused');
        } else if (data.type === 'all-done') {
          eventSource.close();
          setPhase('done');
        }
      } catch (e) {
        console.error('Failed to parse SSE event:', e);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      eventSource.close();
    };
  };

  const handleResume = (action) => {
    setResumeAction(action);
    
    fetch('/api/skills/resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.type === 'all-done') {
          setPhase('done');
          setFailedItem(null);
        } else if (data.type === 'all-rolled-back') {
          onClose();
        } else if (data.type === 'resume-success') {
          setPhase('running');
          // Resume SSE if needed (simplified here)
        }
      })
      .catch(err => {
        console.error('Resume failed:', err);
      });
  };

  const getIcon = (type, success) => {
    if (type === 'install') return success ? '✅' : '❌';
    if (type === 'remove') return success ? '✅' : '❌';
    return '⏳';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        {phase === 'confirm' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">執行變更摘要</h2>
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-2">將安裝：</h3>
              <ul className="list-disc pl-5 mb-3 space-y-1">
                {changes.install.map((item, i) => (
                  <li key={i} className="text-gray-600">{item}</li>
                ))}
              </ul>
              <h3 className="font-medium text-gray-700 mb-2">將移除：</h3>
              <ul className="list-disc pl-5 space-y-1">
                {changes.remove.map((item, i) => (
                  <li key={i} className="text-gray-600">{item}</li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={startExecution}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                確認執行
              </button>
            </div>
          </div>
        )}

        {phase === 'running' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">執行中</h2>
            <div className="mb-4 max-h-80 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-gray-500 text-center py-4">正在準備執行變更...</p>
              ) : (
                <ul className="space-y-3">
                  {events.map((event, i) => (
                    <li key={i} className="flex items-center space-x-3">
                      <span className="text-lg">
                        {event.type === 'install' ? '✅' : event.type === 'remove' ? '✅' : '⏳'}
                      </span>
                      <span className="text-gray-700">
                        {event.type === 'install' ? '安裝' : '移除'} {event.item || event.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="text-gray-500 text-center text-sm animate-pulse">
              正在處理變更，請稍候...
            </div>
          </div>
        )}

        {phase === 'paused' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800">發生錯誤</h2>
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <h3 className="text-red-700 font-medium mb-2">
                ❌ {failedItem?.item || '未知項目'} 失敗
              </h3>
              <p className="text-red-600 text-sm break-words">
                {failedItem?.error || '發生不明錯誤'}
              </p>
            </div>
            <div className="flex justify-center space-x-3">
              <button 
                onClick={() => handleResume('skip')}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
              >
                跳過
              </button>
              <button 
                onClick={() => handleResume('retry')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                重試
              </button>
              <button 
                onClick={() => handleResume('rollback')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                全部回滾
              </button>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800">執行完成</h2>
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-green-600 text-2xl">✅</span>
                <span className="text-gray-700">
                  {changes.install.length} 個項目已安裝
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600 text-2xl">✅</span>
                <span className="text-gray-700">
                  {changes.remove.length} 個項目已移除
                </span>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <p className="text-yellow-700 text-sm">
                ⚠️ 需要重新啟動 Claude Code 才能生效
              </p>
            </div>
            <div className="flex justify-center">
              <button 
                onClick={onComplete}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                完成
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}