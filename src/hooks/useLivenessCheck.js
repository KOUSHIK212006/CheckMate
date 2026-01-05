import { useState, useRef } from 'react';

export default function useLivenessCheck() {
  const [isActive, setIsActive] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startLivenessCheck = async () => {
    try {
      setIsActive(true);
      setError(null);
      setResult(null);

      // Get camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Simple timer-based check (simulating liveness detection)
      // In real implementation, this would use ML for blink/head movement detection
      setTimeout(() => {
        completeLivenessCheck(true);
      }, 3000);

    } catch (err) {
      console.error('Camera access failed:', err);
      setError('Camera access denied. Please allow camera access and try again.');
      setIsActive(false);
    }
  };

  const completeLivenessCheck = (passed) => {
    // Stop camera immediately
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsActive(false);
    setResult(passed ? 'passed' : 'failed');
  };

  const retry = () => {
    if (retryCount < 1) { // Only one retry allowed
      setRetryCount(prev => prev + 1);
      setResult(null);
      setError(null);
      startLivenessCheck();
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setRetryCount(0);
    setIsActive(false);
    
    // Ensure camera is stopped
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  return {
    isActive,
    result,
    error,
    retryCount,
    videoRef,
    startLivenessCheck,
    retry,
    reset
  };
}