import React, { useState, useEffect } from 'react';

const BackupPanel = ({ onClose }) => {
  const [backups, setBackups] = useState([]);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(null);

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backup/list');
      const data = await res.json();
      setBackups(data || []);
    } catch (error) {
      console.error('Failed to fetch backups:', error);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/backup/create', { method: 'POST' });
      if (res.ok) {
        await fetchBackups();
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreBackup = async (filename) => {
    if (!window.confirm(`確定還原備份「${filename}」？這將覆蓋目前資料。`)) {
      return;
    }
    setRestoring(filename);
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      if (res.ok) {
        await fetchBackups();
        alert('還原完成');
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
      alert('還原失敗');
    } finally {
      setRestoring(null);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return 'N/A';
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>備份管理</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={creating}
          style={{
            backgroundColor: creating ? '#ccc' : '#1890ff',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: creating ? 'not-allowed' : 'pointer',
            marginRight: '12px',
            marginBottom: '20px'
          }}
        >
          {creating ? '備份中...' : '立即備份'}
        </button>

        <div style={{
          marginTop: '20px'
        }}>
          {backups.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999' }}>尚無備份記錄</p>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>時間戳記</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>檔案大小</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup, idx) => (
                  <tr key={backup.filename} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 8px' }}>
                      {formatTimestamp(backup.timestamp)}
                      {idx === 0 && (
                        <span style={{
                          marginLeft: '8px',
                          backgroundColor: '#52c41a',
                          color: '#fff',
                          fontSize: '12px',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          最新
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>{formatSize(backup.size)}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleRestoreBackup(backup.filename)}
                        disabled={!!restoring}
                        style={{
                          backgroundColor: restoring === backup.filename ? '#ccc' : '#faad14',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: restoring === backup.filename ? 'not-allowed' : 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        {restoring === backup.filename ? '還原中...' : '還原'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupPanel;