import { io, Socket } from 'socket.io-client';
import { PlayerInfo } from '@/core/types';

class SocketService {
  private socket: Socket | null = null;

  getServerUrl(): string {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const port = window.location.port;

      // Local development on Vite port 3000 -> connect to local Node server on 3001
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        if (port === '3000') {
          return `http://${hostname}:3001`;
        }
      }

      // Production / Hosted deployment (Render, Railway, Vercel, Netlify, custom domain)
      // The Socket.IO server is served directly from the host origin
      return window.location.origin;
    }
    return '';
  }

  connect() {
    if (this.socket && this.socket.connected) return this.socket;

    const url = this.getServerUrl();
    console.log('[JumpingFriends] Connecting socket to:', url);

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      path: '/socket.io/',
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('[JumpingFriends] Socket connected, ID:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[JumpingFriends] Socket connection error:', err.message);
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

  leaveRoom(roomCode: string) {
    this.getSocket().emit('leave-room', { roomCode });
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

  selectGame(roomCode: string, gameId: string) {
    this.getSocket().emit('select-game', { roomCode, gameId });
  }

  restartGame(roomCode: string) {
    this.getSocket().emit('restart-game', { roomCode });
  }

  sendJump(roomCode: string, slot: number) {
    this.getSocket().emit('player-jump', { roomCode, slot });
  }

  sendHit(roomCode: string, slot: number, remainingLives: number) {
    this.getSocket().emit('player-hit', { roomCode, slot, remainingLives });
  }

  sendGameEvent(roomCode: string, eventName: string, data: any) {
    this.getSocket().emit('game-event', { roomCode, eventName, data });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
export type { PlayerInfo };
