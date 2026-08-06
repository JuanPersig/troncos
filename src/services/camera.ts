class CameraService {
  private stream: MediaStream | null = null;
  private error: string | null = null;

  async requestPermission(): Promise<boolean> {
    try {
      if (!this.stream) {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: false
        });
      }
      this.error = null;
      return true;
    } catch (err) {
      console.error('[CameraService] Permission denied or error:', err);
      this.error = err instanceof Error ? err.message : 'Unknown camera error';
      return false;
    }
  }

  async getStream(constraints?: MediaStreamConstraints): Promise<MediaStream | null> {
    if (this.stream) return this.stream;
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints || {
        video: { width: 320, height: 240 },
        audio: false
      });
      this.error = null;
      return this.stream;
    } catch (err) {
      console.error('[CameraService] Error getting stream:', err);
      this.error = err instanceof Error ? err.message : 'Failed to get camera stream';
      return null;
    }
  }

  stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  getError(): string | null {
    return this.error;
  }

  hasStream(): boolean {
    return this.stream !== null && this.stream.active;
  }

  getCurrentStream(): MediaStream | null {
    return this.stream;
  }
}

export const cameraService = new CameraService();
