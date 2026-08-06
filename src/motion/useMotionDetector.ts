import { useState, useEffect, useRef } from 'react';
import { motionDetector } from './MotionDetector';

export function useMotionDetector(videoStream: MediaStream | null) {
  const [isReady, setIsReady] = useState(motionDetector.isReady());
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initDetector = async () => {
      try {
        if (!motionDetector.isReady()) {
          const success = await motionDetector.initialize();
          if (isMounted) {
            setIsReady(success);
            if (!success) {
              setError("No se pudo inicializar el detector de movimiento.");
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error desconocido al inicializar.");
          setIsReady(false);
        }
      }
    };

    initDetector();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !videoStream) {
      if (isDetecting) {
        motionDetector.stop();
        setIsDetecting(false);
      }
      return;
    }

    // Create a hidden video element if we don't have one
    if (!videoRef.current) {
      const video = document.createElement('video');
      video.style.display = 'none';
      video.playsInline = true;
      video.muted = true;
      document.body.appendChild(video);
      videoRef.current = video;
    }

    const video = videoRef.current;
    
    // Only attach stream and start if not already playing this stream
    if (video.srcObject !== videoStream) {
      video.srcObject = videoStream;
      
      video.onloadeddata = () => {
        video.play().then(() => {
          motionDetector.start(video);
          setIsDetecting(true);
          setError(null);
        }).catch(err => {
          console.error('[useMotionDetector] Error playing video:', err);
          setError("Error al reproducir el video para la detección.");
        });
      };
    }

    return () => {
      motionDetector.stop();
      setIsDetecting(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isReady, videoStream]);

  // Cleanup video element on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.parentNode) {
        videoRef.current.parentNode.removeChild(videoRef.current);
        videoRef.current = null;
      }
    };
  }, []);

  return { isReady, isDetecting, error };
}
