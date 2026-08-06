import React, { useEffect, useRef } from 'react';

interface CameraPreviewProps {
  stream: MediaStream | null;
  label?: string;
  showPlaceholder?: boolean;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({ stream, label, showPlaceholder = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream && showPlaceholder) {
    return (
      <div className="camera-container flex items-center justify-center bg-black">
        {label && <div className="camera-label">{label}</div>}
        <span className="text-2xl">📹</span>
      </div>
    );
  }

  return (
    <div className="camera-container">
      {label && <div className="camera-label">{label}</div>}
      <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
    </div>
  );
};
