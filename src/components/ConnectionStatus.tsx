import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected }) => {
  return (
    <div className="flex items-center gap-2">
      <span className={`status-dot ${isConnected ? 'status-dot-online' : 'status-dot-offline'}`} />
      <span className={`text-xs ${isConnected ? 'text-cyan' : 'text-error'}`}>
        {isConnected ? 'ONLINE' : 'OFFLINE'}
      </span>
    </div>
  );
};
