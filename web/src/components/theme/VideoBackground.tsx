import { useRef, useEffect, useState, useCallback } from 'react';
import { useTheme, isVideoUrl } from '../../context/ThemeContext';

export default function VideoBackground() {
  const { theme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);

  const bgType = theme.backgroundType;
  const bgValue = theme.backgroundImage;

  const handleVideoError = useCallback(() => setVideoError(true), []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [bgValue]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || bgType !== 'video' || !bgValue) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => { if (!mq.matches) video.play().catch(() => {}); else video.pause(); };
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [bgType, bgValue]);

  const showVideo = bgType === 'video' && bgValue && !videoError && isVideoUrl(bgValue);
  const showImage = (bgType === 'image' || (bgType === 'video' && videoError)) && bgValue;

  if (!showVideo && !showImage) return null;

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden' }}>
      {showVideo && (
        <video ref={videoRef} autoPlay loop muted playsInline onError={handleVideoError}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
          <source src={bgValue} />
        </video>
      )}
      {showImage && !showVideo && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${bgValue}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
    </div>
  );
}
