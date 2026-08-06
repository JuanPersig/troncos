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
  // In production: connect to same origin. In dev: connect to localhost:3001
  private serverUrl: string = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;

  connect() {
    if (this.socket && this.socket.connected) return this.socket;

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000,
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
