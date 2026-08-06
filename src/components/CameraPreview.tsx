import React, { useEffect, useRef } from 'react';

interface CameraPreviewProps {
  stream: MediaStream | null;
  label?: string;
  className?: string;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  stream,
  label,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) {
    return (
      <div className={`camera-container flex flex-col items-center justify-center p-2 text-center ${className}`}>
        <span className="text-xl">📹</span>
        <span className="text-xs text-muted mt-1">{label || 'SIN CÁMARA'}</span>
      </div>
    );
  }

  return (
    <div className={`camera-container ${className}`}>
      {label && <div className="camera-label">{label}</div>}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera-video"
      />
    </div>
  );
};
