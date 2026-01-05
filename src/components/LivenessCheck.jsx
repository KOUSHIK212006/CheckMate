import { useRef, useEffect, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export default function LivenessCheck({ onResult, onError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentChallenge, setCurrentChallenge] = useState('');
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [timer, setTimer] = useState(12);
  const [cameraPermission, setCameraPermission] = useState('requesting');
  const [retryCount, setRetryCount] = useState(0);
  
  // Motion detection state
  const previousLandmarks = useRef(null);
  const motionStartTime = useRef(null);
  const blinkCount = useRef(0);
  const lastEyeState = useRef('open');
  
  // Random challenges pool - enhanced with more features
  const challenges = [
    'Blink naturally',
    'Turn your head left',
    'Turn your head right',
    'Nod your head up and down',
    'Smile naturally',
    'Open your mouth slightly'
  ];

  useEffect(() => {
    // Select random challenge
    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    setCurrentChallenge(randomChallenge);
    
    let timerInterval;
    let faceMesh;
    let camera;
    
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          } 
        });
        
        setCameraPermission('granted');
        
        // Initialize MediaPipe Face Mesh
        faceMesh = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5
        });

        faceMesh.onResults(onFaceMeshResults);

        if (videoRef.current) {
          camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (faceMesh) {
                await faceMesh.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });
          
          camera.start();
        }
        
        // Start countdown
        timerInterval = setInterval(() => {
          setTimer(prev => {
            if (prev <= 1) {
              clearInterval(timerInterval);
              stopCamera();
              onResult(challengeCompleted);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

      } catch (error) {
        console.error('Camera access failed:', error);
        setCameraPermission('denied');
        onError('Camera access denied. Please allow camera access.');
      }
    };

    const onFaceMeshResults = (results) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length === 1) {
        setFaceDetected(true);
        
        const landmarks = results.multiFaceLandmarks[0];
        
        // Draw face landmarks
        ctx.fillStyle = '#00ff00';
        landmarks.forEach((landmark) => {
          ctx.fillRect(landmark.x * canvas.width - 1, landmark.y * canvas.height - 1, 2, 2);
        });
        
        // Detect challenge-specific motion
        detectChallengeMotion(landmarks, randomChallenge);
        
        previousLandmarks.current = landmarks;
      } else {
        setFaceDetected(false);
        previousLandmarks.current = null;
      }
    };

    const detectChallengeMotion = (landmarks, challenge) => {
      if (!previousLandmarks.current || challengeCompleted) return;

      const prev = previousLandmarks.current;
      const curr = landmarks;

      switch (challenge.toLowerCase()) {
        case 'blink naturally':
          detectBlink(curr);
          break;
          
        case 'turn your head left':
          detectHeadTurn(prev, curr, 'left');
          break;
          
        case 'turn your head right':
          detectHeadTurn(prev, curr, 'right');
          break;
          
        case 'nod your head up and down':
          detectHeadNod(prev, curr);
          break;
          
        case 'smile naturally':
          detectSmile(curr);
          break;
          
        case 'open your mouth slightly':
          detectMouthOpen(curr);
          break;
      }
    };

    const detectBlink = (landmarks) => {
      // Eye landmarks for blink detection
      const leftEyeTop = landmarks[159];
      const leftEyeBottom = landmarks[145];
      const rightEyeTop = landmarks[386];
      const rightEyeBottom = landmarks[374];
      
      const leftEyeHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
      const rightEyeHeight = Math.abs(rightEyeTop.y - rightEyeBottom.y);
      const avgEyeHeight = (leftEyeHeight + rightEyeHeight) / 2;
      
      // More lenient threshold for blink detection
      const eyesClosed = avgEyeHeight < 0.012;
      
      if (eyesClosed && lastEyeState.current === 'open') {
        lastEyeState.current = 'closed';
      } else if (!eyesClosed && lastEyeState.current === 'closed') {
        lastEyeState.current = 'open';
        blinkCount.current++;
        
        // More lenient - accept 1 or 2 blinks
        if (blinkCount.current >= 1) {
          setChallengeCompleted(true);
        }
      }
    };

    const detectHeadTurn = (prev, curr, direction) => {
      const noseTip = 1;
      const leftEar = 234;
      const rightEar = 454;
      
      const noseX = curr[noseTip].x;
      const leftEarX = curr[leftEar].x;
      const rightEarX = curr[rightEar].x;
      
      const faceCenter = (leftEarX + rightEarX) / 2;
      const headTurnAmount = noseX - faceCenter;
      
      if (direction === 'left' && headTurnAmount < -0.05) {
        setChallengeCompleted(true);
      } else if (direction === 'right' && headTurnAmount > 0.05) {
        setChallengeCompleted(true);
      }
    };

    const detectHeadNod = (prev, curr) => {
      const noseTip = 1;
      const prevNoseY = prev[noseTip].y;
      const currNoseY = curr[noseTip].y;
      
      const verticalMovement = Math.abs(currNoseY - prevNoseY);
      
      if (verticalMovement > 0.02) {
        setChallengeCompleted(true);
      }
    };

    const detectSmile = (landmarks) => {
      const leftMouth = landmarks[61];
      const rightMouth = landmarks[291];
      const topLip = landmarks[13];
      const bottomLip = landmarks[14];
      
      const mouthWidth = Math.abs(rightMouth.x - leftMouth.x);
      const mouthHeight = Math.abs(topLip.y - bottomLip.y);
      const mouthRatio = mouthWidth / mouthHeight;
      
      if (mouthRatio > 3.5) {
        setChallengeCompleted(true);
      }
    };

    const detectMouthOpen = (landmarks) => {
      const topLip = landmarks[13];
      const bottomLip = landmarks[14];
      
      const mouthHeight = Math.abs(topLip.y - bottomLip.y);
      
      if (mouthHeight > 0.02) {
        setChallengeCompleted(true);
      }
    };

    const stopCamera = () => {
      if (camera) {
        camera.stop();
      }
    };

    initializeCamera();

    return () => {
      if (timerInterval) clearInterval(timerInterval);
      stopCamera();
    };
  }, [challengeCompleted, onResult, onError]);

  const handleRetry = () => {
    if (retryCount < 1) {
      setRetryCount(prev => prev + 1);
      setChallengeCompleted(false);
      setTimer(12);
      blinkCount.current = 0;
      lastEyeState.current = 'open';
      motionStartTime.current = null;
      
      // New random challenge
      const newChallenge = challenges[Math.floor(Math.random() * challenges.length)];
      setCurrentChallenge(newChallenge);
      
      window.location.reload(); // Restart camera
    }
  };

  if (cameraPermission === 'requesting') {
    return (
      <div style={{ textAlign: 'center', padding: '30px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📷</div>
        <h3>Camera Permission Required</h3>
        <p>Please click "Allow" to enable camera for liveness verification</p>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#e3f2fd', 
          border: '2px solid #2196f3',
          borderRadius: '12px',
          marginTop: '20px'
        }}>
          <strong>🔒 Allow Camera Access</strong>
          <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
            Camera is used only for motion detection, no images are stored
          </p>
        </div>
      </div>
    );
  }

  if (cameraPermission === 'denied') {
    return (
      <div style={{ textAlign: 'center', padding: '30px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
        <h3 style={{ color: '#d32f2f' }}>Camera Access Denied</h3>
        <p>Camera access is required for liveness verification</p>
        <button onClick={() => window.location.reload()} className="btn organizer">
          Refresh & Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Video with Canvas Overlay */}
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
        <video ref={videoRef} style={{ display: 'none' }} autoPlay muted />
        
        <canvas
          ref={canvasRef}
          style={{ 
            width: '400px', 
            height: '300px', 
            borderRadius: '12px',
            border: faceDetected ? '4px solid #4caf50' : '4px solid #f44336',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
        />
        
        {/* Timer */}
        <div style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          background: timer <= 3 ? 'rgba(244,67,54,0.9)' : 'rgba(76,175,80,0.9)',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '25px',
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          {timer}s
        </div>
        
        {/* Status */}
        <div style={{
          position: 'absolute',
          bottom: '15px',
          left: '15px',
          background: challengeCompleted ? 'rgba(76,175,80,0.9)' : 
                     faceDetected ? 'rgba(255,193,7,0.9)' : 'rgba(244,67,54,0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {challengeCompleted ? '✓ Challenge Complete' : 
           faceDetected ? '👁️ Face Detected' : '✗ No Face'}
        </div>
      </div>
      
      {/* Challenge Instructions */}
      <div style={{
        padding: '20px',
        backgroundColor: challengeCompleted ? '#e8f5e8' : '#fff3e0',
        border: `3px solid ${challengeCompleted ? '#4caf50' : '#ff9800'}`,
        borderRadius: '12px',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          margin: '0 0 10px 0',
          color: challengeCompleted ? '#2e7d32' : '#e65100',
          fontSize: '24px'
        }}>
          {challengeCompleted ? '✅ Challenge Completed!' : '🎯 Your Challenge:'}
        </h3>
        
        <p style={{ 
          margin: 0, 
          fontSize: '20px', 
          fontWeight: 'bold',
          color: challengeCompleted ? '#2e7d32' : '#e65100'
        }}>
          {currentChallenge}
        </p>
        
        {!challengeCompleted && (
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
            Perform this action clearly within the time limit
          </p>
        )}
      </div>
      
      {/* Retry Option */}
      {!challengeCompleted && timer === 0 && retryCount === 0 && (
        <button onClick={handleRetry} className="btn organizer" style={{ marginTop: '10px' }}>
          Retry Challenge (1 attempt remaining)
        </button>
      )}
      
      <p style={{ fontSize: '12px', color: '#666', marginTop: '15px' }}>
        🔒 Privacy: Only motion is detected, no images are stored
      </p>
    </div>
  );
}