import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected }) => {
  return (
    <div className="flex items-center justify-center gap-2 p-1.5 bg-bg-darkest border border-sky-dark text-xs">
      <span className={`status-dot ${isConnected ? 'status-dot-online' : 'status-dot-offline'}`} />
      <span className={isConnected ? 'text-celeste' : 'text-error'}>
        {isConnected ? 'CONECTADO' : 'DESCONECTADO'}
      </span>
    </div>
  );
};
