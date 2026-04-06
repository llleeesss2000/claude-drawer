import React, { useState, useEffect } from 'react';

const ERROR_MESSAGES = {
  AUTH_FAILED: '帳號或密碼錯誤',
  DB_CONNECTION_ERROR: '資料庫連線失敗',
  INVALID_INPUT: '輸入格式不正確',
  TIMEOUT: '請求逾時',
  PERMISSION_DENIED: '權限不足',
  FILE_NOT_FOUND: '檔案不存在',
  SERVER_ERROR: '伺服器內部錯誤'
};

const LogViewer = ({ onClose }) => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [expandedDetail, setExpandedDetail] = useState(null);
  const [friendlyErrors, setFriendlyErrors] = useState({});

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/system/logs');
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      }
    };

    fetchLogs();
  }, []);

  useEffect(() => {
    const codes = logs.filter(log => log.level === 'error' && ERROR_MESSAGES[log.message]).map(log => log.message);
    const uniqueCodes = [...new Set(codes)];
    if (uniqueCodes.length > 0) {
      const fetchFriendlyErrors = async () => {
        try {
          const promises = uniqueCodes.map(code => 
            fetch(`/api/system/friendly-error?code=${code}`).then(res => res.json()).then(data => ({ code, friendly: data.friendly }))
          );
          const results = await Promise.all(promises);
          const errorsMap = {};
          results.forEach(({ code, friendly }) => {
            errorsMap[code] = friendly;
          });
          setFriendlyErrors(errorsMap);
        } catch (error) {
          console.error('Failed to fetch friendly errors:', error);
        }
      };
      fetchFriendlyErrors();
    }
  }, [logs]);

  const filteredLogs = logs
    .filter(log => filter === 'all' || log.level === filter)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warn': return 'text-orange-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-600';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  };

  const toggleDetail = (index) => {
    setExpandedDetail(expandedDetail === index ? null : index);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-4/5 max-w-3xl max-h-[85vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">操作記錄</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>
        
        <div className="p-4 border-b bg-gray-50">
          <div className="flex space-x-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-100`}
            >
              全部
            </button>
            <button 
              onClick={() => setFilter('error')}
              className={`px-3 py-1 rounded ${filter === 'error' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-red-100`}
            >
              錯誤
            </button>
            <button 
              onClick={() => setFilter('warn')}
              className={`px-3 py-1 rounded ${filter === 'warn' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-orange-100`}
            >
              警告
            </button>
            <button 
              onClick={() => setFilter('info')}
              className={`px-3 py-1 rounded ${filter === 'info' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-100`}
            >
              資訊
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">目前沒有操作記錄</div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log, index) => (
                <div key={`${log.timestamp}-${index}`} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex items-center space-x-3 text-sm">
                    <span className={`font-bold ${getLevelColor(log.level)} w-12`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-gray-600 w-20">{formatTime(log.timestamp)}</span>
                    <span className="font-medium text-gray-700 w-32">{log.action}</span>
                    <span className="flex-1">
                      {log.level === 'error' && friendlyErrors[log.message]
                        ? friendlyErrors[log.message]
                        : log.message
                      }
                    </span>
                  </div>
                  
                  {log.detail && (
                    <div className="mt-2">
                      <button 
                        onClick={() => toggleDetail(index)}
                        className="text-blue-500 hover:text-blue-700 text-xs flex items-center"
                      >
                        {expandedDetail === index ? '收起詳情' : '展開詳情'}
                        <span className="ml-1">{expandedDetail === index ? '▲' : '▼'}</span>
                      </button>
                      
                      {expandedDetail === index && (
                        <div className="mt-2 bg-gray-100 p-2 rounded text-xs text-gray-700 font-mono overflow-auto max-h-40">
                          {JSON.stringify(log.detail, null, 2)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer;