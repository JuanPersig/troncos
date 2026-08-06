/**
 * Jumping Friends — Typed Event Bus
 * Decoupled communication between motion detection, minigames, and UI.
 * 
 * Usage:
 *   eventBus.on('JumpDetected', (event) => { ... });
 *   eventBus.emit('JumpDetected', { timestamp: Date.now(), confidence: 0.95 });
 */

type EventMap = {
  JumpDetected: { timestamp: number; confidence: number };
  GameEnd: { gameId: string };
  PlayerReady: { slot: number };
};

type EventKey = keyof EventMap;
type EventCallback<K extends EventKey> = (payload: EventMap[K]) => void;

class EventBus {
  private listeners: { [K in EventKey]?: Set<EventCallback<K>> } = {};

  on<K extends EventKey>(event: K, callback: EventCallback<K>): () => void {
    if (!this.listeners[event]) {
      (this.listeners as any)[event] = new Set();
    }
    (this.listeners[event] as Set<EventCallback<K>>).add(callback);

    // Return unsubscribe function
    return () => {
      (this.listeners[event] as Set<EventCallback<K>>)?.delete(callback);
    };
  }

  emit<K extends EventKey>(event: K, payload: EventMap[K]): void {
    const callbacks = this.listeners[event] as Set<EventCallback<K>> | undefined;
    if (callbacks) {
      callbacks.forEach(cb => cb(payload));
    }
  }

  off<K extends EventKey>(event: K, callback: EventCallback<K>): void {
    (this.listeners[event] as Set<EventCallback<K>>)?.delete(callback);
  }

  removeAllListeners(event?: EventKey): void {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

export const eventBus = new EventBus();
