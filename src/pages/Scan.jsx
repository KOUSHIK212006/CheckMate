import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LivenessCheck from "../components/LivenessCheck";
import Card from "../components/Card";
import Toast from "../components/Toast";

export default function Scan() {
  const navigate = useNavigate();
  const [step, setStep] = useState('scanning');
  const [scannedData, setScannedData] = useState('');
  const [livenessAction, setLivenessAction] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [toast, setToast] = useState({ message: "", type: "info" });
  const scannerRef = useRef(null);
  const scannerInitialized = useRef(false);

  const actions = ['Blink twice', 'Nod your head', 'Turn head left', 'Turn head right', 'Smile'];

  useEffect(() => {
    if (step !== 'scanning' || scannerInitialized.current) return;

    console.log('Initializing QR Scanner...');
    scannerInitialized.current = true;

    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
      // Clear any existing scanner content
      const qrReaderElement = document.getElementById("qr-reader");
      if (qrReaderElement) {
        console.log('QR Reader element found, clearing content...');
        qrReaderElement.innerHTML = '';
        // Reset any custom styles that might interfere
        qrReaderElement.style.width = '100%';
        qrReaderElement.style.maxWidth = '500px';
        qrReaderElement.style.margin = '0 auto';
      } else {
        console.error('QR Reader element not found!');
        setToast({ message: "QR Reader element not found. Please refresh the page.", type: "error" });
        return;
      }

      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
          rememberLastUsedCamera: true,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA, Html5QrcodeScanType.SCAN_TYPE_FILE],
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true
        },
        false
      );

      const onScanSuccess = (decodedText, decodedResult) => {
        console.log('QR Code scanned:', decodedText);
        
        try {
          // Try to parse as JSON first (new format with embedded meet link)
          const sessionData = JSON.parse(decodedText);
          
          if (sessionData.sessionId && sessionData.meetLink) {
            setScannedData(sessionData.sessionId);
            setMeetLink(sessionData.meetLink);
            
            // Stop scanner and proceed
            scanner.clear().then(() => {
              setStep('liveness-start');
              setToast({ message: "Valid session QR detected! Prepare for liveness check.", type: "success" });
            }).catch(() => {
              setStep('liveness-start');
              setToast({ message: "Valid session QR detected! Prepare for liveness check.", type: "success" });
            });
            return;
          }
        } catch (e) {
          // Fallback: treat as session ID only (legacy format)
          const sessionIdPattern = /^[0-9]{13}$/; // Timestamp format
          
          if (decodedText && sessionIdPattern.test(decodedText)) {
            setScannedData(decodedText);
            
            // Get session data from localStorage as fallback
            const storedSession = localStorage.getItem('currentSession');
            if (storedSession) {
              const session = JSON.parse(storedSession);
              setMeetLink(session.meetLink || 'https://meet.google.com');
            } else {
              setMeetLink('https://meet.google.com');
            }
            
            scanner.clear().then(() => {
              setStep('liveness-start');
              setToast({ message: "Valid session QR detected! Prepare for liveness check.", type: "success" });
            }).catch(() => {
              setStep('liveness-start');
              setToast({ message: "Valid session QR detected! Prepare for liveness check.", type: "success" });
            });
            return;
          }
        }
        
        // Invalid QR format
        setToast({ message: "Invalid session QR code. Please scan a valid session QR.", type: "error" });
      };

      const onScanFailure = (error) => {
        // Ignore scan failures - they happen frequently during scanning
      };

      try {
        console.log('Rendering QR Scanner...');
        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;
        console.log('QR Scanner initialized successfully');
        
        // Add a timeout to check if scanner initialized properly
        setTimeout(() => {
          const scannerElement = document.querySelector('#qr-reader video');
          if (!scannerElement) {
            console.warn('QR Scanner video element not found after 3 seconds');
            setToast({ message: "QR scanner is loading... Please wait or refresh if it doesn't appear.", type: "warning" });
          } else {
            console.log('QR Scanner video element found and working');
          }
        }, 3000);
        
      } catch (error) {
        console.error("Scanner initialization failed:", error);
        setToast({ message: "Failed to initialize QR scanner. Please refresh the page.", type: "error" });
        scannerInitialized.current = false; // Allow retry
      }
    }, 100);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [step]);

  const startLivenessCheck = () => {
    setStep('liveness-active');
  };

  const handleLivenessResult = (passed) => {
    if (passed) {
      setStep('meet-ready');
      setToast({ message: "All tasks completed! Attendance marked successfully.", type: "success" });
    } else {
      setStep('liveness-failed');
      setToast({ message: "Face verification incomplete. Please try again.", type: "error" });
    }
  };

  const handleLivenessError = (error) => {
    setStep('liveness-failed');
    setToast({ message: error, type: "error" });
  };

  const resetToScanning = () => {
    scannerInitialized.current = false;
    setStep('scanning');
    setScannedData('');
    setLivenessAction('');
    setToast({ message: "", type: "info" });
  };

  if (step === 'liveness-start') {
    return (
      <div className="app" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', minHeight: '100vh' }}>
        <div className="glow"></div>
        
        <Card style={{ maxWidth: '600px', margin: '0 auto', padding: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '2.2rem', 
            fontWeight: '700', 
            color: '#f1f5f9', 
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🔐 Liveness Check Required
          </h2>
          
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}>
            <p style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>QR Code Detected:</p>
            <code style={{ 
              color: '#4f46e5', 
              fontSize: '14px',
              background: 'rgba(79, 70, 229, 0.1)',
              padding: '8px 12px',
              borderRadius: '8px',
              display: 'inline-block'
            }}>
              {scannedData.substring(0, 20)}...
            </code>
          </div>
          
          <p style={{ color: '#f1f5f9', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Complete face verification to mark your attendance.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={startLivenessCheck}
              style={{
                padding: '16px 32px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(79, 70, 229, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 24px rgba(79, 70, 229, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(79, 70, 229, 0.3)';
              }}
            >
              🚀 Start Liveness Check
            </button>
            
            <button 
              onClick={resetToScanning}
              style={{
                padding: '16px 32px',
                borderRadius: '12px',
                border: '2px solid rgba(148, 163, 184, 0.3)',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#4f46e5';
                e.target.style.color = '#4f46e5';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                e.target.style.color = '#94a3b8';
              }}
            >
              ← Back to Scan
            </button>
          </div>
        </Card>
        
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
      </div>
    );
  }

  if (step === 'meet-ready') {
    return (
      <div className="app" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', minHeight: '100vh' }}>
        <div className="glow"></div>
        
        {/* Animated Success Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
          animation: 'pulse 3s ease-in-out infinite'
        }}></div>
        
        <Card style={{ 
          maxWidth: '700px', 
          margin: '0 auto', 
          padding: '3rem', 
          textAlign: 'center',
          background: 'rgba(2, 6, 23, 0.85)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 0 50px rgba(16, 185, 129, 0.2), 0 40px 120px rgba(0, 0, 0, 0.9)'
        }}>
          {/* Success Animation */}
          <div style={{ 
            fontSize: '6rem', 
            marginBottom: '1.5rem',
            animation: 'bounce 2s ease-in-out infinite'
          }}>
            🎉
          </div>
          
          {/* Main Title */}
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '900', 
            color: '#f1f5f9', 
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '1px'
          }}>
            Attendance Verified!
          </h1>
          
          {/* Subtitle */}
          <p style={{ 
            color: '#94a3b8', 
            fontSize: '1.3rem', 
            marginBottom: '2rem',
            fontWeight: '300',
            lineHeight: '1.6'
          }}>
            Face verification completed successfully
          </p>
          
          {/* Success Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
              <div style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: '600' }}>Verified</div>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Identity Confirmed</div>
            </div>
            
            <div style={{
              background: 'rgba(79, 70, 229, 0.1)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(79, 70, 229, 0.3)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
              <div style={{ color: '#4f46e5', fontSize: '1.1rem', fontWeight: '600' }}>Recorded</div>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Attendance Marked</div>
            </div>
            
            <div style={{
              background: 'rgba(6, 182, 212, 0.1)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
              <div style={{ color: '#06b6d4', fontSize: '1.1rem', fontWeight: '600' }}>Secure</div>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Data Protected</div>
            </div>
          </div>
          
          {/* Session Info */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            borderRadius: '20px',
            padding: '2rem',
            marginBottom: '3rem',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}>
            <h3 style={{ 
              color: '#f1f5f9', 
              fontSize: '1.4rem', 
              fontWeight: '600', 
              marginBottom: '1rem'
            }}>
              🎯 Session Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'left' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Session ID:</span>
                <div style={{ color: '#f1f5f9', fontWeight: '600', fontFamily: 'monospace' }}>
                  {scannedData.substring(0, 8)}...
                </div>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Verified At:</span>
                <div style={{ color: '#f1f5f9', fontWeight: '600' }}>
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '1.5rem', 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            marginBottom: '2rem'
          }}>
            <button
              onClick={() => navigate(`/session/${scannedData}/join`)}
              style={{
                padding: '18px 36px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)',
                minWidth: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px) scale(1.02)';
                e.target.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.4)';
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>🚀</span>
              Continue to Session
            </button>
            
            <button
              onClick={resetToScanning}
              style={{
                padding: '18px 36px',
                borderRadius: '16px',
                border: '2px solid rgba(148, 163, 184, 0.3)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#94a3b8',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#4f46e5';
                e.target.style.color = '#4f46e5';
                e.target.style.background = 'rgba(79, 70, 229, 0.1)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                e.target.style.color = '#94a3b8';
                e.target.style.background = 'rgba(15, 23, 42, 0.8)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>📱</span>
              Scan Another QR
            </button>
          </div>
          
          {/* Footer Info */}
          <div style={{
            padding: '1.5rem',
            background: 'rgba(79, 70, 229, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(79, 70, 229, 0.2)'
          }}>
            <p style={{ 
              color: '#94a3b8', 
              fontSize: '0.9rem', 
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <span>🔒</span>
              Your attendance has been securely recorded and verified
            </p>
          </div>
        </Card>
        
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
      </div>
    );
  }

  if (step === 'liveness-active') {
    return (
      <div className="app" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', minHeight: '100vh' }}>
        <div className="glow"></div>
        
        <Card style={{ maxWidth: '700px', margin: '0 auto', padding: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '2.2rem', 
            fontWeight: '700', 
            color: '#f1f5f9', 
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🔍 Multi-Task Face Verification
          </h2>
          
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Complete all verification tasks to mark attendance
          </p>
          
          <LivenessCheck 
            onResult={handleLivenessResult}
            onError={handleLivenessError}
          />
        </Card>
        
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="page app center">
        <div className="card">
          <h2>✅ Attendance Confirmed</h2>
          <p>Your attendance has been successfully marked!</p>
          <p>Redirecting to Google Meet in 2 seconds...</p>
          
          <button 
            className="btn organizer"
            onClick={() => window.open(meetLink || 'https://meet.google.com', '_blank')}
            style={{ marginTop: '15px' }}
          >
            Join Meeting Now
          </button>
          
          <button 
            className="btn participant"
            onClick={resetToScanning}
            style={{ marginLeft: '10px', marginTop: '15px' }}
          >
            Scan Another QR
          </button>
        </div>
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
      </div>
    );
  }

  if (step === 'liveness-failed') {
    return (
      <div className="app" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', minHeight: '100vh' }}>
        <div className="glow"></div>
        
        <Card style={{ maxWidth: '600px', margin: '0 auto', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          
          <h2 style={{ 
            fontSize: '2.2rem', 
            fontWeight: '700', 
            color: '#f1f5f9', 
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Verification Failed
          </h2>
          
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '1rem' }}>
            Face verification was unsuccessful.
          </p>
          
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <p style={{ color: '#ef4444', fontSize: '1rem', margin: 0 }}>
              Please ensure your face is clearly visible and try again.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={startLivenessCheck}
              style={{
                padding: '16px 32px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(79, 70, 229, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 24px rgba(79, 70, 229, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(79, 70, 229, 0.3)';
              }}
            >
              🔄 Retry Verification
            </button>
            
            <button
              onClick={resetToScanning}
              style={{
                padding: '16px 32px',
                borderRadius: '12px',
                border: '2px solid rgba(148, 163, 184, 0.3)',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#4f46e5';
                e.target.style.color = '#4f46e5';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                e.target.style.color = '#94a3b8';
              }}
            >
              ← Back to Scan
            </button>
          </div>
        </Card>
        
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
      </div>
    );
  }

  // Default: QR Scanning
  return (
    <div className="app" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', minHeight: '100vh' }}>
      <div className="glow"></div>
      
      <Card style={{ maxWidth: '600px', margin: '0 auto', padding: '2.5rem', textAlign: 'center' }}>
        <h2 style={{ 
          fontSize: '2.2rem', 
          fontWeight: '700', 
          color: '#f1f5f9', 
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          📱 Scan Session QR Code
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Point your camera at the QR code to begin attendance verification
        </p>

        <div 
          id="qr-reader" 
          style={{ 
            width: "100%", 
            maxWidth: "500px",
            margin: "1.5rem auto 0 auto",
            borderRadius: '16px',
            overflow: 'hidden',
            border: '2px solid rgba(148, 163, 184, 0.2)',
            backgroundColor: 'rgba(15, 23, 42, 0.8)'
          }}
        ></div>
        
        <p style={{ 
          fontSize: '14px', 
          color: '#64748b', 
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '12px',
          border: '1px solid rgba(148, 163, 184, 0.2)'
        }}>
          💡 After scanning, you'll complete a face verification step to confirm your attendance
        </p>
        
        <div style={{ marginTop: '1.5rem' }}>
          <button
            onClick={() => {
              scannerInitialized.current = false;
              setStep('scanning');
              window.location.reload();
            }}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              border: '2px solid rgba(148, 163, 184, 0.3)',
              backgroundColor: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#4f46e5';
              e.target.style.color = '#4f46e5';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)';
              e.target.style.color = '#94a3b8';
            }}
          >
            🔄 Refresh Scanner
          </button>
        </div>
      </Card>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </div>
  );
}