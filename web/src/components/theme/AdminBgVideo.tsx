import { useRef, useEffect, useState, useCallback } from 'react';
import { useAdminTheme, isVideoUrl } from '../../context/AdminThemeContext';
import type { AdminBg } from '../../context/AdminThemeContext';

export default function AdminBgVideo() {
  const { theme } = useAdminTheme();
  const bg = theme.bg;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);

  const handleVideoError = useCallback(() => setVideoError(true), []);

  const showVideo = theme.mode === 'dark' && bg.type === 'video' && bg.value && !videoError && isVideoUrl(bg.value);
  const showImage = theme.mode === 'dark' && (bg.type === 'image' || (bg.type === 'video' && videoError)) && bg.value;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    return () => { video.pause(); video.removeAttribute('src'); video.load(); };
  }, [bg.value]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !showVideo) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => { if (!mq.matches) video.play().catch(() => {}); else video.pause(); };
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [showVideo]);

  if (!showVideo && !showImage) return null;

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      {showVideo && (
        <video ref={videoRef} autoPlay loop muted playsInline onError={handleVideoError}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
          <source src={bg.value} />
        </video>
      )}
      {showImage && !showVideo && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${bg.value}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
    </div>
  );
}
