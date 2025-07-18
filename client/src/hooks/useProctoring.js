import { useState, useEffect, useCallback, useRef } from 'react';

const useProctoring = (onViolation, onDeviceFailure) => {
  const [permissions, setPermissions] = useState({ camera: false, mic: false });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const streamRef = useRef(null); // To hold the media stream

  // Request Camera and Mic Permissions
  const requestPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream; // Store the stream
      setPermissions({ camera: true, mic: true });
      return true;
    } catch (error) {
      console.error("Permission denied:", error);
      setPermissions({ camera: false, mic: false });
      alert("Camera and Microphone access are mandatory to start the test.");
      return false;
    }
  }, []);

  // Request Fullscreen
  const requestFullScreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullScreen(true);
      return true;
    } catch (error) {
      console.error("Fullscreen failed:", error);
      alert("Fullscreen mode is mandatory. Please enable it to start the test.");
      return false;
    }
  }, []);

  // Effect for handling violations (tab switching, fullscreen exit)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        onViolation('visibility');
      }
    };

    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
        onViolation('fullscreen');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullScreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, [onViolation]);

  // ✨ NEW: Effect for monitoring camera/mic status during the test
  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    // Listen for the 'ended' event on each track
    if (videoTrack) {
      videoTrack.onended = () => {
        onDeviceFailure('Camera');
      };
    }
    if (audioTrack) {
      audioTrack.onended = () => {
        onDeviceFailure('Microphone');
      };
    }

    // Cleanup function to stop tracks when the component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onDeviceFailure]);


  return { permissions, isFullScreen, requestPermissions, requestFullScreen };
};

export default useProctoring;
