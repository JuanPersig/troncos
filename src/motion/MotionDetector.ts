import { eventBus } from '@/core/events';

export class MotionDetector {
  private poseLandmarker: any = null;
  private isRunning: boolean = false;
  
  // Vision state
  private lastVideoTime: number = -1;
  private prevY: number = 0;
  private prevTime: number = 0;
  private smoothedVelocity: number = 0;
  private peakVelocity: number = 0;
  private JUMP_VELOCITY_THRESHOLD: number = 2.2;
  private lastPredictionTime: number = 0;
  private visionAnimationId: number = 0;
  private currentVideoElement: HTMLVideoElement | null = null;
  private isInitializing: boolean = false;

  async initialize(): Promise<boolean> {
    if (this.poseLandmarker) return true;
    if (this.isInitializing) return false;
    
    this.isInitializing = true;
    try {
      // @ts-ignore
      const { PoseLandmarker, FilesetResolver } = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/+esm");

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
      );

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1
      });
      
      this.isInitializing = false;
      return true;
    } catch (err) {
      console.error('[MotionDetector] Initialization error:', err);
      this.isInitializing = false;
      return false;
    }
  }

  start(videoElement: HTMLVideoElement): void {
    if (!this.poseLandmarker) {
      console.warn('[MotionDetector] Not initialized. Call initialize() first.');
      return;
    }
    
    this.currentVideoElement = videoElement;
    this.isRunning = true;
    this.predictWebcam();
  }

  stop(): void {
    this.isRunning = false;
    this.currentVideoElement = null;
    if (this.visionAnimationId) {
      cancelAnimationFrame(this.visionAnimationId);
      this.visionAnimationId = 0;
    }
  }

  isReady(): boolean {
    return this.poseLandmarker !== null;
  }

  setJumpThreshold(threshold: number): void {
    this.JUMP_VELOCITY_THRESHOLD = threshold;
  }

  private predictWebcam = () => {
    if (!this.isRunning || !this.currentVideoElement || !this.poseLandmarker) {
      return;
    }

    const video = this.currentVideoElement;

    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      this.visionAnimationId = requestAnimationFrame(this.predictWebcam);
      return;
    }

    const now = performance.now();
    const timeSinceLast = now - this.lastPredictionTime;
    const VISION_FPS = 30;
    const frameInterval = 1000 / VISION_FPS;

    if (timeSinceLast < frameInterval) {
      this.visionAnimationId = requestAnimationFrame(this.predictWebcam);
      return;
    }
    this.lastPredictionTime = now;

    let didUpdate = false;
    let results: any = undefined;
    
    if (this.lastVideoTime !== video.currentTime) {
      this.lastVideoTime = video.currentTime;
      try {
        results = this.poseLandmarker.detectForVideo(video, now);
        didUpdate = true;
      } catch (err) {
        console.warn('[MediaPipe] Detect error:', err);
      }
    }

    if (results && results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0];
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];

      if (didUpdate) {
        const currentY = (leftShoulder.y + rightShoulder.y) / 2;
        const shoulderDist = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);

        const currentTime = video.currentTime;
        let currentVelocity = 0;

        if (this.prevTime > 0 && currentTime > this.prevTime) {
          const dt = currentTime - this.prevTime;
          const dy = this.prevY - currentY;
          const normalizedDy = dy / shoulderDist;
          currentVelocity = normalizedDy / dt;
        }

        this.smoothedVelocity = this.smoothedVelocity * 0.5 + currentVelocity * 0.5;

        if (this.smoothedVelocity > this.peakVelocity) {
          this.peakVelocity = this.smoothedVelocity;
        } else {
          this.peakVelocity *= 0.95;
        }

        this.prevY = currentY;
        this.prevTime = currentTime;

        if (this.smoothedVelocity > this.JUMP_VELOCITY_THRESHOLD) {
          eventBus.emit('JumpDetected', { timestamp: Date.now(), confidence: this.smoothedVelocity });
          // Reset velocity to prevent multiple triggers
          this.smoothedVelocity = 0; 
        }
      }
    }

    this.visionAnimationId = requestAnimationFrame(this.predictWebcam);
  };
}

export const motionDetector = new MotionDetector();
