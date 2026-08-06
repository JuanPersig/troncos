import { io, Socket } from 'socket.io-client';

export interface PlayerInfo {
  id: string;
  name: string;
  slot: number;
  ready: boolean;
  lives: number;
  score: number;
  isBot?: boolean;
}

class SocketService {
  private socket: Socket | null = null;
  private customUrl: string | null = null;

  getServerUrl(): string {
    if (this.customUrl) return this.customUrl;
    
    // Check localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('troncos_server_url');
      if (stored) return stored;
      
      // If we are on Netlify or similar static host, default to the Render backend (or let user set it)
      if (window.location.hostname.includes('netlify.app') || window.location.hostname.includes('vercel.app')) {
        // We can check if a default render URL is preferred, but let's fall back to location origin unless set.
        return window.location.origin;
      }
      
      if (window.location.hostname !== 'localhost') {
        return window.location.origin;
      }
    }
    return 'http://localhost:3001';
  }

  setServerUrl(url: string) {
    const trimmed = url.trim();
    if (trimmed) {
      localStorage.setItem('troncos_server_url', trimmed);
      this.customUrl = trimmed;
    } else {
      localStorage.removeItem('troncos_server_url');
      this.customUrl = null;
    }
    this.disconnect();
    this.connect();
  }

  connect() {
    if (this.socket && this.socket.connected) return this.socket;

    const url = this.getServerUrl();
    console.log('[Socket] Connecting to:', url);

    this.socket = io(url, {
      transports: ['websocket', 'polling'],  // WebSocket first = ultra-low latency (<30ms)
      path: '/socket.io/',
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server, ID:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    return this.socket;
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  joinRoom(roomCode: string, name: string) {
    this.getSocket().emit('join-room', { roomCode, name });
  }

  fillBots(roomCode: string) {
    this.getSocket().emit('fill-bots', { roomCode });
  }

  toggleReady(roomCode: string) {
    this.getSocket().emit('toggle-ready', { roomCode });
  }

  startGame(roomCode: string) {
    this.getSocket().emit('start-game', { roomCode });
  }

  sendJump(roomCode: string, slot: number) {
    this.getSocket().emit('player-jump', { roomCode, slot });
  }

  sendObstacleSpawn(roomCode: string, obstacleData: any) {
    this.getSocket().emit('spawn-obstacle', { roomCode, obstacleData });
  }

  sendHit(roomCode: string, slot: number, remainingLives: number) {
    this.getSocket().emit('player-hit', { roomCode, slot, remainingLives });
  }

  restartGame(roomCode: string) {
    this.getSocket().emit('restart-game', { roomCode });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
