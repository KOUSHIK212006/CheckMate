import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import PopupQuestion from '../components/PopupQuestion';

export default function SessionJoin() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [sessionData, setSessionData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [popupCount, setPopupCount] = useState(0);
  const [responses, setResponses] = useState([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [popupSettings, setPopupSettings] = useState({ timing: "fixed", interval: 20 });

  useEffect(() => {
    // Get session data from QR scan
    const storedSession = localStorage.getItem('currentSession');
    if (storedSession) {
      const session = JSON.parse(storedSession);
      setSessionData(session);
      
      // Load organizer's questions
      const storedQuestions = localStorage.getItem(`questions_${session.sessionId}`);
      const storedSettings = localStorage.getItem(`popupSettings_${session.sessionId}`);
      
      if (storedQuestions) {
        setQuestions(JSON.parse(storedQuestions));
      } else {
        // Fallback questions
        setQuestions([
          { id: 1, text: "Are you paying attention?", options: ["YES", "NO"], type: "single", correct: 0 },
          { id: 2, text: "Is this helpful?", options: ["YES", "NO"], type: "single", correct: 0 }
        ]);
      }
      
      if (storedSettings) {
        setPopupSettings(JSON.parse(storedSettings));
      }
    }
  }, []);

  useEffect(() => {
    // Listen for manual popup triggers from organizer
    const checkForTrigger = setInterval(() => {
      if (sessionData) {
        const trigger = localStorage.getItem(`triggerPopup_${sessionData.sessionId}`);
        if (trigger) {
          const triggerData = JSON.parse(trigger);
          setCurrentQuestion(triggerData.question);
          setShowPopup(true);
          localStorage.removeItem(`triggerPopup_${sessionData.sessionId}`);
        }
        
        // Check for feedback request
        const feedbackRequest = localStorage.getItem(`askFeedback_${sessionData.sessionId}`);
        if (feedbackRequest) {
          localStorage.removeItem(`askFeedback_${sessionData.sessionId}`);
          navigate(`/session/${sessionData.sessionId}/complete`);
        }
      }
    }, 1000);

    return () => clearInterval(checkForTrigger);
  }, [sessionData, navigate]);

  useEffect(() => {
    // Listen for session end from organizer
    const checkSessionEnd = setInterval(() => {
      if (sessionData) {
        const sessionEnded = localStorage.getItem(`sessionEnded_${sessionData.sessionId}`);
        if (sessionEnded) {
          // Session ended by organizer - navigate to complete page for feedback
          navigate(`/session/${sessionData.sessionId}/complete`);
        }
      }
    }, 2000);

    return () => clearInterval(checkSessionEnd);
  }, [sessionData, navigate]);

  const joinSession = () => {
    if (sessionData?.meetLink) {
      window.open(sessionData.meetLink, '_blank');
      setSessionStarted(true);
      startPopupSchedule();
    }
  };

  const startPopupSchedule = () => {
    // Only schedule automatic popups if timing is set to random
    if (popupSettings.timing !== "random") {
      return; // Manual mode - no automatic popups
    }
    
    const totalPopups = questions.length;
    const baseInterval = popupSettings.interval * 1000;
    
    let count = 0;
    const scheduleNext = () => {
      if (count < totalPopups) {
        const randomFactor = 0.5 + Math.random();
        const delay = baseInterval * randomFactor * count;
        
        setTimeout(() => {
          setCurrentQuestion(questions[count]);
          setShowPopup(true);
          count++;
        }, delay);
      } else {
        const finalDelay = baseInterval * (1 + Math.random()) * totalPopups + 2000;
          
        setTimeout(() => {
          navigate(`/session/${sessionId}/complete`);
        }, finalDelay);
      }
    };
    
    scheduleNext();
  };

  const handlePopupResponse = (questionId, answerIndex, isCorrect) => {
    const response = {
      questionId,
      answer: answerIndex,
      isCorrect,
      answeredAt: Date.now()
    };
    
    const newResponses = [...responses, response];
    setResponses(newResponses);
    setPopupCount(newResponses.length);
    setShowPopup(false);
    
    // Save to localStorage
    localStorage.setItem(`responses_${sessionId}`, JSON.stringify(newResponses));
  };

  const handlePopupTimeout = (questionId) => {
    const response = {
      questionId,
      answer: null,
      isCorrect: false,
      answeredAt: Date.now(),
      missed: true
    };
    
    const newResponses = [...responses, response];
    setResponses(newResponses);
    setPopupCount(newResponses.length);
    setShowPopup(false);
    
    localStorage.setItem(`responses_${sessionId}`, JSON.stringify(newResponses));
  };

  if (!sessionData) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>Session Not Found</h2>
          <p style={{ marginTop: '0.5rem' }}>Please scan a valid QR code first.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)', maxWidth: '32rem', width: '100%', textAlign: 'center' }}>
        <div style={{ color: '#10b981', fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>Attendance Verified</h2>
        <h3 style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '0.5rem' }}>{sessionData.title}</h3>
        <div style={{ display: 'inline-block', backgroundColor: '#dcfce7', color: '#166534', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '600', marginBottom: '2rem' }}>
          🔴 Session is Live
        </div>
        
        {!sessionStarted ? (
          <>
            <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem', lineHeight: '1.5' }}>
              Keep this tab open during the session for engagement tracking
            </p>
            <button
              onClick={joinSession}
              style={{ 
                width: '100%', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white', 
                padding: '1rem 2rem', 
                borderRadius: '16px', 
                fontWeight: '700', 
                border: 'none', 
                cursor: 'pointer', 
                transition: 'transform 0.2s, box-shadow 0.2s',
                fontSize: '1.1rem',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              🚀 Join Live Session
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ fontSize: '3rem' }}>🎥</div>
            <p style={{ color: '#6b7280', fontSize: '1.1rem', fontWeight: '500' }}>Meeting opened in new tab</p>
            <p style={{ fontSize: '0.95rem', color: '#9ca3af' }}>Keep this tab open for engagement tracking</p>
            <div style={{ backgroundColor: '#e0f2fe', padding: '1.5rem', borderRadius: '16px', border: '2px solid #0288d1' }}>
              <p style={{ fontSize: '1rem', color: '#01579b', margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                📊 Engagement Tracking Active
              </p>
              <p style={{ fontSize: '0.9rem', color: '#0277bd', margin: 0 }}>
                {popupCount}/{questions.length}
              </p>
            </div>
          </div>
        )}
      </div>

      {showPopup && currentQuestion && (
        <PopupQuestion
          question={currentQuestion}
          onResponse={handlePopupResponse}
          onTimeout={handlePopupTimeout}
        />
      )}
    </div>
  );
}