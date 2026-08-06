import { socketService } from './socket';

export class WebRTCManager {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<number, MediaStream> = new Map(); // slot -> MediaStream
  private onRemoteStreamCallbacks: Set<(slot: number, stream: MediaStream) => void> = new Set();

  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
  ];

  setLocalStream(stream: MediaStream) {
    this.localStream = stream;
  }

  onRemoteStream(cb: (slot: number, stream: MediaStream) => void) {
    this.onRemoteStreamCallbacks.add(cb);
    return () => this.onRemoteStreamCallbacks.delete(cb);
  }

  initSignaling(localSlot: number) {
    const socket = socketService.getSocket();

    socket.off('webrtc-offer');
    socket.off('webrtc-answer');
    socket.off('webrtc-ice-candidate');

    socket.on('webrtc-offer', async ({ fromId, fromSlot, offer }) => {
      console.log(`[WebRTC] Received offer from ${fromId} (slot ${fromSlot})`);
      const pc = this.createPeerConnection(fromId, fromSlot, localSlot);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('webrtc-answer', {
        targetId: fromId,
        answer,
        fromSlot: localSlot
      });
    });

    socket.on('webrtc-answer', async ({ fromId, answer }) => {
      console.log(`[WebRTC] Received answer from ${fromId}`);
      const pc = this.peerConnections.get(fromId);
      if (pc && pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('webrtc-ice-candidate', async ({ fromId, candidate }) => {
      const pc = this.peerConnections.get(fromId);
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[WebRTC] Error adding ICE candidate', e);
        }
      }
    });
  }

  hasConnection(targetId: string): boolean {
    const pc = this.peerConnections.get(targetId);
    if (!pc) return false;
    return ['new', 'connecting', 'connected'].includes(pc.connectionState || 'new');
  }

  async connectToPeer(targetId: string, targetSlot: number, localSlot: number) {
    if (this.hasConnection(targetId)) return; // Already connected or connecting

    console.log(`[WebRTC] Initiating offer to ${targetId} (slot ${targetSlot})`);
    const socket = socketService.getSocket();
    const pc = this.createPeerConnection(targetId, targetSlot, localSlot);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('webrtc-offer', {
      targetId,
      offer,
      fromSlot: localSlot
    });
  }

  private createPeerConnection(targetId: string, targetSlot: number, localSlot: number): RTCPeerConnection {
    if (this.peerConnections.has(targetId)) {
      this.peerConnections.get(targetId)?.close();
    }

    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    this.peerConnections.set(targetId, pc);

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.getSocket().emit('webrtc-ice-candidate', {
          targetId,
          candidate: event.candidate,
          fromSlot: localSlot
        });
      }
    };

    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track from slot ${targetSlot}`);
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      this.remoteStreams.set(targetSlot, remoteStream);
      this.onRemoteStreamCallbacks.forEach(cb => cb(targetSlot, remoteStream));
    };

    return pc;
  }

  cleanup() {
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
    this.remoteStreams.clear();
  }
}

export const webRTCManager = new WebRTCManager();
