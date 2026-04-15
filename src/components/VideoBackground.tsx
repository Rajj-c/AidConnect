"use client";

import React, { useEffect, useRef, useState } from 'react';

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animationFrameId: number;
    const fadeDuration = 0.5; // seconds

    const updateOpacity = () => {
      if (!video) return;

      const { currentTime, duration } = video;
      
      if (!isNaN(duration)) {
        if (currentTime < fadeDuration) {
          // Fade in
          setOpacity(currentTime / fadeDuration);
        } else if (duration - currentTime < fadeDuration) {
          // Fade out
          setOpacity((duration - currentTime) / fadeDuration);
        } else {
          // Fully visible
          setOpacity(1);
        }
      }

      animationFrameId = requestAnimationFrame(updateOpacity);
    };

    const handlePlay = () => {
      animationFrameId = requestAnimationFrame(updateOpacity);
    };

    const handlePause = () => {
      cancelAnimationFrame(animationFrameId);
    };

    const handleEnded = () => {
      setOpacity(0);
      setTimeout(() => {
        if (video) {
          video.currentTime = 0;
          video.play().catch(console.error);
        }
      }, 100);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    // Initial play
    video.play().catch(console.error);
    
    // Start RAF loop just in case play event is missed
    animationFrameId = requestAnimationFrame(updateOpacity);

    return () => {
      cancelAnimationFrame(animationFrameId);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div className="absolute inset-x-0 bottom-0 z-0 overflow-hidden" style={{ top: '300px' }}>
      <video
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4"
        playsInline
        muted
        style={{ opacity, transition: 'opacity 0.1s linear' }}
        className="w-full h-full object-cover object-top"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white pointer-events-none" />
    </div>
  );
}
