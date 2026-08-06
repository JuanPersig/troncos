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

  private getServerUrl(): string {
    // In dev, connect to local server. In production, connect to same origin.
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      return window.location.origin;
    }
    return 'http://localhost:3001';
  }

  connect() {
    if (this.socket && this.socket.connected) return this.socket;

    const url = this.getServerUrl();
    console.log('[Socket] Connecting to:', url);

    this.socket = io(url, {
      transports: ['polling', 'websocket'],  // polling first = more reliable behind proxies
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
