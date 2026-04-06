import React from 'react';

const ConflictWarning = ({ conflicts }) => {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div>
      {conflicts.map((conflict, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg mb-3 ${
            conflict.level === 'error'
              ? 'bg-red-100 border border-red-300 text-red-700'
              : 'bg-yellow-100 border border-yellow-300 text-yellow-700'
          }`}
        >
          <div className="flex items-center mb-2">
            {conflict.level === 'error' ? (
              <span className="text-2xl mr-2">🚫</span>
            ) : (
              <span className="text-2xl mr-2">⚠️</span>
            )}
            <span className="font-medium">{conflict.message}</span>
          </div>
          {conflict.items && conflict.items.length > 0 && (
            <div className="ml-6">
              <span className="text-sm">Affected items: </span>
              <span className="text-sm font-semibold">{conflict.items.join(', ')}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConflictWarning;