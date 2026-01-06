import { useEffect, useState } from "react";
import QRCode from "qrcode";
import useAuth from "../hooks/useAuth";
import Button from "../components/Button";
import Card from "../components/Card";
import Toast from "../components/Toast";

export default function Organizer() {
  const { user } = useAuth();
  const [sessionName, setSessionName] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [questions, setQuestions] = useState([
    { id: 1, text: "Are you paying attention right now?", options: ["YES", "NO"], type: "single", correct: 0 },
    { id: 2, text: "Is this session helpful?", options: ["Very helpful", "Somewhat helpful", "Not helpful"], type: "single", correct: 0 },
    { id: 3, text: "Are you taking notes?", options: ["YES", "NO"], type: "single", correct: 0 }
  ]);
  const [newQuestion, setNewQuestion] = useState({ text: "", options: ["", ""], type: "single", correct: [0] });
  const [popupSettings, setPopupSettings] = useState({ timing: "fixed", interval: 20, popupDuration: 10 });
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState([]);
  const [participantScores, setParticipantScores] = useState([]);
  const [currentTab, setCurrentTab] = useState("setup");

  const create = async () => {
    if (!meetLink.trim()) {
      setToast({ message: "Please provide a Google Meet link", type: "error" });
      return;
    }
    
    try {
      const sessionId = Date.now().toString();
      const session = {
        sessionId,
        title: sessionName.trim() || `Session ${new Date().toLocaleString()}`,
        meetLink: meetLink.trim(),
        isActive: true
      };
      
      setActiveSession(session);
      localStorage.setItem('currentSession', JSON.stringify(session));
      localStorage.setItem(`questions_${sessionId}`, JSON.stringify(questions));
      localStorage.setItem(`popupSettings_${sessionId}`, JSON.stringify(popupSettings));
      
      const qrData = JSON.stringify({ sessionId, meetLink: meetLink.trim() });
      const url = await QRCode.toDataURL(qrData);
      setQrUrl(url);
      
      setCurrentTab("session");
      setToast({ message: "Session created successfully!", type: "success" });
    } catch (error) {
      setToast({ message: "Failed to create session", type: "error" });
    }
  };
  
  const endSession = () => {
    if (activeSession) {
      localStorage.removeItem('currentSession');
    }
    setActiveSession(null);
    setQrUrl("");
    setCurrentTab("setup");
    setToast({ message: "Session ended", type: "info" });
  };
  
  const askFeedback = () => {
    if (!activeSession) return;
    localStorage.setItem(`askFeedback_${activeSession.sessionId}`, JSON.stringify({ timestamp: Date.now() }));
    setToast({ message: "Feedback request sent to participants!", type: "success" });
  };
  
  const addQuestion = () => {
    const validOptions = newQuestion.options.filter(opt => opt.trim());
    if (newQuestion.text.trim() && validOptions.length >= 2 && newQuestion.correct.length > 0) {
      setQuestions(prev => [...prev, { ...newQuestion, id: Date.now(), options: validOptions }]);
      setNewQuestion({ text: "", options: ["", ""], type: "single", correct: [0] });
      setToast({ message: "Question added!", type: "success" });
    } else if (newQuestion.correct.length === 0) {
      setToast({ message: "Please select at least one correct answer", type: "error" });
    }
  };

  const addOption = () => {
    if (newQuestion.options.length < 6) {
      setNewQuestion(prev => ({ ...prev, options: [...prev.options, ""] }));
    }
  };

  const removeOption = (index) => {
    if (newQuestion.options.length > 2) {
      setNewQuestion(prev => {
        const newOptions = prev.options.filter((_, i) => i !== index);
        let newCorrect = prev.correct.filter(c => c !== index).map(c => c > index ? c - 1 : c);
        if (newCorrect.length === 0) newCorrect = [0];
        return { ...prev, options: newOptions, correct: newCorrect };
      });
    }
  };

  const updateOption = (index, value) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeQuestion = (id) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const askQuestion = (questionIndex) => {
    if (!activeSession) return;
    const questionData = {
      question: questions[questionIndex],
      timestamp: Date.now(),
      sessionId: activeSession.sessionId
    };
    localStorage.setItem(`triggerPopup_${activeSession.sessionId}`, JSON.stringify(questionData));
    setToast({ message: `Question ${questionIndex + 1} sent!`, type: "success" });
  };

  const viewScores = () => {
    if (!activeSession) return;
    
    console.log('=== DEBUG: Checking localStorage for session:', activeSession.sessionId);
    
    const scores = [];
    const sessionId = activeSession.sessionId;
    
    // Check all possible participant data sources
    const participantIds = ['general', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    
    participantIds.forEach(id => {
      const responseKey = id === 'general' ? `responses_${sessionId}` : `responses_${sessionId}_participant_${id}`;
      const livenessKey = id === 'general' ? `liveness_${sessionId}` : `liveness_${sessionId}_participant_${id}`;
      
      const responses = localStorage.getItem(responseKey);
      const liveness = localStorage.getItem(livenessKey);
      
      if (responses || liveness) {
        const responseData = responses ? JSON.parse(responses) : [];
        const livenessData = liveness ? JSON.parse(liveness) : { passed: false };
        
        console.log(`Found data for participant ${id}:`, { responses: responseData, liveness: livenessData });
        
        // Calculate metrics based on actual questions asked
        const totalSent = responseData.length; // Total questions asked (including missed)
        const answered = responseData.filter(r => !r.missed && r.selectedAnswer !== null && r.selectedAnswer !== undefined).length;
        const correct = responseData.filter(r => r.isCorrect === true).length;
        const missed = responseData.filter(r => r.missed === true).length;
        const wrong = totalSent - correct - missed; // Total - correct - missed = wrong
        
        // Engagement score: correct answers out of total questions asked
        const engagementScore = totalSent > 0 ? Math.round((correct / totalSent) * 100) : 0;
        
        // Liveness score
        const livenessScore = livenessData.passed ? 100 : 0;
        
        scores.push({
          participantId: id === 'general' ? 'Participant' : `Participant ${id}`,
          totalSent,
          answered,
          correct,
          wrong,
          missed,
          engagementScore,
          livenessScore,
          livenessVerified: livenessData.passed || false,
          lastActivity: Math.max(
            responseData.length > 0 ? Math.max(...responseData.map(r => r.timestamp)) : 0,
            livenessData.timestamp || 0
          )
        });
      }
    });
    
    console.log('Final calculated scores:', scores);
    
    if (scores.length === 0) {
      setToast({ message: "No participant data found. Participants need to scan QR and answer questions.", type: "info" });
    } else {
      setParticipantScores(scores);
    }
  };

  const viewFeedback = () => {
    if (!activeSession) return;
    const feedbacks = [];
    
    const feedback = localStorage.getItem(`feedback_${activeSession.sessionId}`);
    if (feedback) {
      feedbacks.push(JSON.parse(feedback));
    }
    
    for (let i = 1; i <= 10; i++) {
      const participantFeedback = localStorage.getItem(`feedback_${activeSession.sessionId}_participant_${i}`);
      if (participantFeedback) {
        feedbacks.push({ ...JSON.parse(participantFeedback), participantId: `Participant ${i}` });
      }
    }
    
    if (feedbacks.length === 0) {
      setToast({ message: "No feedback received yet", type: "info" });
    } else {
      setFeedbackData(feedbacks);
    }
    setShowFeedback(true);
  };

  const clearAll = () => {
    setSessionName("");
    setMeetLink("");
    setActiveSession(null);
    setQrUrl("");
    setCurrentTab("setup");
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(30,30,60,0.9) 0%, rgba(20,20,40,0.9) 100%)', 
            backdropFilter: 'blur(20px)', 
            borderRadius: '24px', 
            padding: '3rem',
            border: '1px solid rgba(100,100,200,0.3)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}>
            <h1 style={{ 
              fontSize: '3.5rem', 
              fontWeight: '900', 
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #00d4ff 0%, #5b73ff 50%, #ff6b9d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(91, 115, 255, 0.5)',
              letterSpacing: '-0.02em'
            }}>⚡ Organizer Dashboard</h1>
            <p style={{ color: 'rgba(200,200,255,0.9)', fontSize: '1.3rem', margin: 0, fontWeight: '500' }}>Create and manage your interactive sessions</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
          <div style={{ 
            display: 'flex', 
            background: 'linear-gradient(135deg, rgba(30,30,60,0.8) 0%, rgba(20,20,40,0.8) 100%)', 
            backdropFilter: 'blur(20px)',
            borderRadius: '20px', 
            padding: '8px',
            border: '1px solid rgba(100,100,200,0.3)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <button
              onClick={() => setCurrentTab("setup")}
              style={{
                padding: '16px 32px',
                borderRadius: '16px',
                border: 'none',
                background: currentTab === "setup" ? 'linear-gradient(135deg, #ff6b9d 0%, #ff8a80 100%)' : 'transparent',
                color: currentTab === "setup" ? 'white' : 'rgba(200,200,255,0.8)',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '1.1rem',
                boxShadow: currentTab === "setup" ? '0 8px 25px rgba(255, 107, 157, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
                transform: currentTab === "setup" ? 'translateY(-2px)' : 'translateY(0)'
              }}
              onMouseOver={(e) => !currentTab === "setup" && (e.target.style.background = 'rgba(255,107,157,0.1)')}
              onMouseOut={(e) => !currentTab === "setup" && (e.target.style.background = 'transparent')}
            >
              🛠️ Setup
            </button>
            <button
              onClick={() => setCurrentTab("questions")}
              style={{
                padding: '16px 32px',
                borderRadius: '16px',
                border: 'none',
                background: currentTab === "questions" ? 'linear-gradient(135deg, #5b73ff 0%, #00d4ff 100%)' : 'transparent',
                color: currentTab === "questions" ? 'white' : 'rgba(200,200,255,0.8)',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '1.1rem',
                boxShadow: currentTab === "questions" ? '0 8px 25px rgba(91, 115, 255, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
                transform: currentTab === "questions" ? 'translateY(-2px)' : 'translateY(0)'
              }}
              onMouseOver={(e) => currentTab !== "questions" && (e.target.style.background = 'rgba(91,115,255,0.1)')}
              onMouseOut={(e) => currentTab !== "questions" && (e.target.style.background = 'transparent')}
            >
              ❓ Questions
            </button>
            {activeSession && (
              <button
                onClick={() => setCurrentTab("session")}
                style={{
                  padding: '16px 32px',
                  borderRadius: '16px',
                  border: 'none',
                  background: currentTab === "session" ? 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)' : 'transparent',
                  color: currentTab === "session" ? 'white' : 'rgba(200,200,255,0.8)',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: '1.1rem',
                  boxShadow: currentTab === "session" ? '0 8px 25px rgba(0, 255, 136, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
                  transform: currentTab === "session" ? 'translateY(-2px)' : 'translateY(0)'
                }}
                onMouseOver={(e) => currentTab !== "session" && (e.target.style.background = 'rgba(0,255,136,0.1)')}
                onMouseOut={(e) => currentTab !== "session" && (e.target.style.background = 'transparent')}
              >
                🎯 Live Session
              </button>
            )}
          </div>
        </div>

        {/* Setup Tab */}
        {currentTab === "setup" && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(30,30,60,0.9) 0%, rgba(20,20,40,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '28px',
            padding: '4rem',
            border: '1px solid rgba(100,100,200,0.3)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '3rem', textAlign: 'center', 
              background: 'linear-gradient(135deg, #ff6b9d 0%, #ff8a80 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>🚀 Session Setup</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '4rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '16px', fontWeight: '800', color: '#00d4ff', fontSize: '1.2rem' }}>Session Title</label>
                <input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Enter session title (optional)"
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    borderRadius: '20px',
                    border: '2px solid rgba(100,100,200,0.3)',
                    background: 'rgba(10,10,30,0.8)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    fontSize: '1.2rem',
                    outline: 'none',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#ff6b9d';
                    e.target.style.boxShadow = '0 0 20px rgba(255, 107, 157, 0.3), inset 0 2px 10px rgba(0,0,0,0.3)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(100,100,200,0.3)';
                    e.target.style.boxShadow = 'inset 0 2px 10px rgba(0,0,0,0.3)';
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '16px', fontWeight: '800', color: '#00d4ff', fontSize: '1.2rem' }}>Google Meet Link *</label>
                <input
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    borderRadius: '20px',
                    border: '2px solid rgba(100,100,200,0.3)',
                    background: 'rgba(10,10,30,0.8)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    fontSize: '1.2rem',
                    outline: 'none',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#ff6b9d';
                    e.target.style.boxShadow = '0 0 20px rgba(255, 107, 157, 0.3), inset 0 2px 10px rgba(0,0,0,0.3)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(100,100,200,0.3)';
                    e.target.style.boxShadow = 'inset 0 2px 10px rgba(0,0,0,0.3)';
                  }}
                />
              </div>
            </div>

            {/* Popup Settings */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(10,10,30,0.8) 0%, rgba(20,20,50,0.8) 100%)', 
              backdropFilter: 'blur(10px)',
              padding: '3rem', 
              borderRadius: '24px', 
              marginBottom: '4rem',
              border: '1px solid rgba(100,100,200,0.2)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
            }}>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '2rem', 
                background: 'linear-gradient(135deg, #5b73ff 0%, #00d4ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>⚙️ Popup Settings</h3>
                <div style={{ display: 'flex', gap: '4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', color: 'white', fontSize: '1.2rem', fontWeight: '600' }}>
                  <input
                    type="radio"
                    name="timing"
                    checked={popupSettings.timing === "fixed"}
                    onChange={() => setPopupSettings(prev => ({ ...prev, timing: "fixed" }))}
                    style={{ width: '24px', height: '24px', accentColor: '#ff6b9d' }}
                  />
                  <span>Manual Control</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', color: 'white', fontSize: '1.2rem', fontWeight: '600' }}>
                  <input
                    type="radio"
                    name="timing"
                    checked={popupSettings.timing === "random"}
                    onChange={() => setPopupSettings(prev => ({ ...prev, timing: "random" }))}
                    style={{ width: '24px', height: '24px', accentColor: '#ff6b9d' }}
                  />
                  <span>Auto Random</span>
                </label>
                {popupSettings.timing === "random" && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ color: 'white', fontSize: '1.2rem', fontWeight: '700' }}>Interval:</span>
                    <input
                      type="number"
                      value={popupSettings.interval}
                      onChange={(e) => setPopupSettings(prev => ({ ...prev, interval: parseInt(e.target.value) || 20 }))}
                      min="10"
                      max="120"
                      style={{
                        width: '120px',
                        padding: '16px 20px',
                        borderRadius: '16px',
                        border: '2px solid rgba(100,100,200,0.3)',
                        background: 'rgba(10,10,30,0.8)',
                        backdropFilter: 'blur(10px)',
                        color: 'white',
                        textAlign: 'center',
                        fontSize: '1.2rem',
                        fontWeight: '700',
                        outline: 'none'
                      }}
                    />
                    <span style={{ color: 'white', fontSize: '1.2rem', fontWeight: '600' }}>seconds</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <span style={{ color: 'white', fontSize: '1.2rem', fontWeight: '700' }}>Popup Duration:</span>
                  <input
                    type="number"
                    value={popupSettings.popupDuration}
                    onChange={(e) => setPopupSettings(prev => ({ ...prev, popupDuration: parseInt(e.target.value) || 10 }))}
                    min="5"
                    max="60"
                    style={{
                      width: '120px',
                      padding: '16px 20px',
                      borderRadius: '16px',
                      border: '2px solid rgba(100,100,200,0.3)',
                      background: 'rgba(10,10,30,0.8)',
                      backdropFilter: 'blur(10px)',
                      color: 'white',
                      textAlign: 'center',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      outline: 'none'
                    }}
                  />
                  <span style={{ color: 'white', fontSize: '1.2rem', fontWeight: '600' }}>seconds</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
              <button
                onClick={create}
                disabled={!meetLink.trim()}
                style={{
                  background: meetLink.trim() ? 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)' : 'rgba(60, 60, 80, 0.5)',
                  color: 'white',
                  padding: '20px 40px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '1.3rem',
                  fontWeight: '800',
                  cursor: meetLink.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: meetLink.trim() ? '0 10px 30px rgba(0, 255, 136, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
                  transform: 'translateY(0)'
                }}
                onMouseOver={(e) => meetLink.trim() && (e.target.style.transform = 'translateY(-4px)')}
                onMouseOut={(e) => meetLink.trim() && (e.target.style.transform = 'translateY(0)')}
              >
                🚀 Create Session
              </button>
              <button
                onClick={clearAll}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.2) 0%, rgba(255, 138, 128, 0.2) 100%)',
                  border: '2px solid rgba(255, 107, 157, 0.4)',
                  color: 'white',
                  padding: '20px 40px',
                  borderRadius: '20px',
                  fontSize: '1.3rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'translateY(0)'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(255, 107, 157, 0.4) 0%, rgba(255, 138, 128, 0.4) 100%)';
                  e.target.style.transform = 'translateY(-4px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(255, 107, 157, 0.2) 0%, rgba(255, 138, 128, 0.2) 100%)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🗑️ Clear All
              </button>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {currentTab === "questions" && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '3rem',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '2rem', textAlign: 'center', color: 'white' }}>
              ❓ Manage Questions ({questions.length})
            </h2>
            
            {/* Question List */}
            <div style={{ marginBottom: '3rem' }}>
              {questions.map((q, index) => (
                <div key={q.id} style={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(5px)',
                  padding: '2rem',
                  borderRadius: '20px',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.75rem', color: 'white' }}>
                        Q{index + 1}: {q.text}
                      </h4>
                      <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                        Type: {q.type === "single" ? "Single Choice" : "Multiple Choice"}
                      </div>
                      <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)' }}>
                        Correct: {Array.isArray(q.correct) ? q.correct.map(i => `"${q.options[i]}"`).join(', ') : `"${q.options[q.correct]}"`} | {q.options.length} options
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {activeSession && (
                        <button
                          onClick={() => askQuestion(index)}
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            padding: '12px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '1rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                            transform: 'translateY(0)'
                          }}
                          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                          📢 Ask
                        </button>
                      )}
                      <button
                        onClick={() => removeQuestion(q.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '2px solid rgba(239, 68, 68, 0.3)',
                          color: 'white',
                          padding: '12px 20px',
                          borderRadius: '12px',
                          fontSize: '1rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          transform: 'translateY(0)'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = 'rgba(239, 68, 68, 0.3)';
                          e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Question */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              backdropFilter: 'blur(5px)',
              padding: '3rem',
              borderRadius: '20px',
              border: '2px dashed rgba(59, 130, 246, 0.5)'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem', color: 'white' }}>➕ Add New Question</h3>
              
              <input
                value={newQuestion.text}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Enter your question"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  border: '2px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  fontSize: '1.1rem',
                  marginBottom: '2rem',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(59, 130, 246, 0.6)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
              />
              
              <div style={{ display: 'flex', gap: '3rem', marginBottom: '2rem', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: 'white', fontSize: '1.1rem' }}>Type:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: 'white', fontSize: '1.1rem' }}>
                  <input
                    type="radio"
                    name="questionType"
                    checked={newQuestion.type === "single"}
                    onChange={() => setNewQuestion(prev => ({ ...prev, type: "single" }))}
                    style={{ width: '20px', height: '20px', accentColor: '#3b82f6' }}
                  />
                  <span>Single Choice</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: 'white', fontSize: '1.1rem' }}>
                  <input
                    type="radio"
                    name="questionType"
                    checked={newQuestion.type === "multiple"}
                    onChange={() => setNewQuestion(prev => ({ ...prev, type: "multiple" }))}
                    style={{ width: '20px', height: '20px', accentColor: '#3b82f6' }}
                  />
                  <span>Multiple Choice</span>
                </label>
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: '700', color: 'white', fontSize: '1.1rem' }}>Options ({newQuestion.options.length}):</span>
                  <button
                    onClick={addOption}
                    disabled={newQuestion.options.length >= 6}
                    style={{
                      background: newQuestion.options.length >= 6 ? 'rgba(107, 114, 128, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: newQuestion.options.length >= 6 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    + Add Option
                  </button>
                </div>
                
                {newQuestion.options.map((option, index) => (
                  <div key={index} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                    {newQuestion.type === "single" ? (
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={newQuestion.correct.includes(index)}
                        onChange={() => setNewQuestion(prev => ({ ...prev, correct: [index] }))}
                        style={{ width: '20px', height: '20px', accentColor: '#00ff88' }}
                        title="Mark as correct answer"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={newQuestion.correct.includes(index)}
                        onChange={(e) => {
                          setNewQuestion(prev => ({
                            ...prev,
                            correct: e.target.checked 
                              ? [...prev.correct, index]
                              : prev.correct.filter(c => c !== index)
                          }));
                        }}
                        style={{ width: '20px', height: '20px', accentColor: '#00ff88' }}
                        title="Mark as correct answer"
                      />
                    )}
                    <input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      style={{
                        flex: 1,
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '2px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        color: 'white',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(59, 130, 246, 0.6)'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                    />
                    {newQuestion.options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '2px solid rgba(239, 68, 68, 0.3)',
                          color: 'white',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          fontWeight: '700',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.3)'}
                        onMouseOut={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginTop: '1rem' }}>
                  💡 Select the radio button to mark the correct answer
                </p>
              </div>
              
              <button
                onClick={addQuestion}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '16px 32px',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  transform: 'translateY(0)'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                ✅ Add Question
              </button>
            </div>
          </div>
        )}

        {/* Live Session Tab */}
        {currentTab === "session" && activeSession && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '3rem',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '2.5rem',
              borderRadius: '20px',
              marginBottom: '3rem',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
            }}>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>
                🎯 {activeSession.title}
              </h2>
              <p style={{ opacity: 0.9, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Session ID: {activeSession.sessionId}</p>
              <p style={{ opacity: 0.9, fontSize: '1.1rem' }}>
                Status: LIVE • {questions.length} Questions • {popupSettings.timing} timing
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4rem', alignItems: 'start' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                  <button
                    onClick={askFeedback}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: 'white',
                      padding: '18px 24px',
                      borderRadius: '16px',
                      border: 'none',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                      transform: 'translateY(0)'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    💬 Ask Feedback
                  </button>
                  <button
                    onClick={viewFeedback}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      padding: '18px 24px',
                      borderRadius: '16px',
                      border: 'none',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                      transform: 'translateY(0)'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    📊 View Feedback
                  </button>
                  <button
                    onClick={viewScores}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      padding: '18px 24px',
                      borderRadius: '16px',
                      border: 'none',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                      transform: 'translateY(0)'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    🎯 View Scores
                  </button>
                  <button
                    onClick={() => {
                      // Add test data for debugging
                      const testResponses = [
                        { questionId: 1, question: "Are you paying attention?", selectedAnswer: "YES", isCorrect: true, missed: false, timestamp: Date.now() },
                        { questionId: 2, question: "Is this session helpful?", selectedAnswer: "NO", isCorrect: false, missed: false, timestamp: Date.now() },
                        { questionId: 3, question: "Are you taking notes?", selectedAnswer: null, isCorrect: false, missed: true, timestamp: Date.now() }
                      ];
                      const testLiveness = { passed: true, timestamp: Date.now() };
                      
                      localStorage.setItem(`responses_${activeSession.sessionId}`, JSON.stringify(testResponses));
                      localStorage.setItem(`liveness_${activeSession.sessionId}`, JSON.stringify(testLiveness));
                      
                      setToast({ message: "Test data added! Participant answered 3 questions: 1 correct, 1 wrong, 1 missed. Liveness passed.", type: "success" });
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: 'white',
                      padding: '18px 24px',
                      borderRadius: '16px',
                      border: 'none',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                      transform: 'translateY(0)'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    🧪 Add Test Data
                  </button>
                  <button
                    onClick={endSession}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      padding: '18px 24px',
                      borderRadius: '16px',
                      border: 'none',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                      transform: 'translateY(0)'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    🛑 End Session
                  </button>
                </div>
              </div>
              
              {qrUrl && (
                <div style={{
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(5px)',
                  padding: '2.5rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem', color: 'white' }}>
                    📱 Session QR Code
                  </h3>
                  <div style={{
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '16px',
                    marginBottom: '1.5rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}>
                    <img src={qrUrl} alt="session-qr" style={{ maxWidth: '200px', width: '100%', borderRadius: '12px' }} />
                  </div>
                  <a
                    href={qrUrl}
                    download={`session-${activeSession.sessionId}.png`}
                    style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      fontSize: '1rem',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                      transform: 'translateY(0)'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    💾 Download QR Code
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />

      {/* Feedback Modal */}
      {showFeedback && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '32rem',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>📊 Session Feedback</h3>
              <button
                onClick={() => setShowFeedback(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}
              >
                ×
              </button>
            </div>
            
            {feedbackData.length > 0 ? (
              <div>
                {feedbackData.map((feedback, index) => (
                  <div key={index} style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: '#1f2937' }}>Rating:</span>
                      <div style={{ color: '#fbbf24' }}>
                        {'★'.repeat(feedback.rating)}{'☆'.repeat(5-feedback.rating)}
                      </div>
                      <span style={{ color: '#6b7280' }}>({feedback.rating}/5)</span>
                    </div>
                    {feedback.comment && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: '600', color: '#1f2937' }}>Comment:</span>
                        <p style={{ color: '#374151', marginTop: '0.25rem', fontStyle: 'italic' }}>"{feedback.comment}"</p>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: '#1f2937' }}>Would recommend:</span>
                      <span style={{ color: feedback.wouldRecommend ? '#10b981' : '#ef4444' }}>
                        {feedback.wouldRecommend ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                      Submitted: {new Date(feedback.submittedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💭</div>
                <p>No feedback received yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scores Modal */}
      {participantScores.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '40rem',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>🎯 Participant Scores</h3>
              <button
                onClick={() => setParticipantScores([])}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {participantScores.map((score, index) => (
                <div key={index} style={{
                  backgroundColor: '#f9fafb',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ color: '#1f2937', fontWeight: '600' }}>
                      👤 {score.participantId || `Participant ${index + 1}`}
                    </h4>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: score.engagementScore >= 80 ? '#10b981' : score.engagementScore >= 60 ? '#f59e0b' : '#ef4444'
                    }}>
                      {score.engagementScore}%
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                    <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: 'white', borderRadius: '8px' }}>
                      <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '1.2rem' }}>{score.totalSent}</div>
                      <div style={{ color: '#6b7280' }}>Sent</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: 'white', borderRadius: '8px' }}>
                      <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '1.2rem' }}>{score.answered}</div>
                      <div style={{ color: '#6b7280' }}>Answered</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: 'white', borderRadius: '8px' }}>
                      <div style={{ fontWeight: '600', color: '#10b981', fontSize: '1.2rem' }}>{score.correct}</div>
                      <div style={{ color: '#6b7280' }}>Correct</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: 'white', borderRadius: '8px' }}>
                      <div style={{ fontWeight: '600', color: '#ef4444', fontSize: '1.2rem' }}>{score.wrong}</div>
                      <div style={{ color: '#6b7280' }}>Wrong</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: 'white', borderRadius: '8px' }}>
                      <div style={{ fontWeight: '600', color: '#6b7280', fontSize: '1.2rem' }}>{score.missed}</div>
                      <div style={{ color: '#6b7280' }}>Missed</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>✅ Present • 🔒 Liveness: {score.livenessVerified ? '✅ Verified' : '❌ Not Verified'}</span>
                    <span>🕐 {new Date(score.calculatedAt || Date.now()).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}