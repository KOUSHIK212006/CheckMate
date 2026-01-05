import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function SessionComplete() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [stats, setStats] = useState({
    totalPopups: 0,
    answeredPopups: 0,
    correctAnswers: 0
  });
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({
    rating: 5,
    comment: "",
    wouldRecommend: true
  });

  useEffect(() => {
    // Check if feedback was requested by organizer
    const feedbackRequested = localStorage.getItem(`askFeedback_${sessionId}`);
    if (feedbackRequested) {
      setShowFeedback(true);
      localStorage.removeItem(`askFeedback_${sessionId}`);
    }
    
    // Get actual question count from session
    const sessionData = localStorage.getItem('currentSession');
    let actualQuestionCount = 3; // fallback
    if (sessionData) {
      const session = JSON.parse(sessionData);
      const questions = localStorage.getItem(`questions_${session.sessionId}`);
      if (questions) {
        actualQuestionCount = JSON.parse(questions).length;
      }
    }
    
    // Calculate engagement score from responses
    const responses = JSON.parse(localStorage.getItem(`responses_${sessionId}`) || '[]');
    
    const totalPopups = actualQuestionCount;
    const answeredPopups = responses.filter(r => !r.missed).length;
    const correctAnswers = responses.filter(r => r.isCorrect).length;
    
    const engagementScore = totalPopups > 0 ? Math.round((correctAnswers / totalPopups) * 100) : 0;
    
    setStats({
      totalPopups,
      answeredPopups,
      correctAnswers
    });
    setScore(engagementScore);

    // Save engagement score (would be Firestore in production)
    const participantId = `participant_${Date.now()}`;
    const scoreData = {
      sessionId,
      participantId,
      totalPopups,
      answeredPopups,
      correctAnswers,
      attendancePresent: true,
      engagementScore,
      calculatedAt: Date.now()
    };
    
    localStorage.setItem(`score_${sessionId}`, JSON.stringify(scoreData));
    localStorage.setItem(`score_${sessionId}_${participantId}`, JSON.stringify(scoreData));
  }, [sessionId]);

  const submitFeedback = () => {
    const participantId = `participant_${Date.now()}`;
    const feedbackData = {
      sessionId,
      participantId,
      rating: feedback.rating,
      comment: feedback.comment,
      wouldRecommend: feedback.wouldRecommend,
      submittedAt: Date.now()
    };
    
    // Save with both general and participant-specific keys
    localStorage.setItem(`feedback_${sessionId}`, JSON.stringify(feedbackData));
    localStorage.setItem(`feedback_${sessionId}_${participantId}`, JSON.stringify(feedbackData));
    setShowFeedback(false);
    
    setTimeout(() => {
      alert("Thank you for your feedback! 🙏");
    }, 500);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreEmoji = (score) => {
    if (score >= 80) return '🎉';
    if (score >= 60) return '👍';
    return '📝';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)', maxWidth: '32rem', width: '100%', textAlign: 'center' }}>
        {/* Header */}
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          Session Complete!
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1.1rem' }}>Thank you for your participation</p>

        <p style={{ fontSize: '0.95rem', color: '#9ca3af', marginBottom: '2rem' }}>
          You may now close this tab safely
        </p>

        {/* Feedback Button */}
        {!showFeedback && (
          <button
            onClick={() => setShowFeedback(true)}
            style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s', marginBottom: '0.75rem' }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
          >
            📝 Share Your Feedback
          </button>
        )}

        {/* Feedback Form */}
        {showFeedback && (
          <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '16px', marginBottom: '1.5rem', border: '2px solid #e2e8f0' }}>
            <h4 style={{ color: '#1f2937', marginBottom: '1.5rem', fontSize: '1.3rem', fontWeight: 'bold' }}>💭 Share Your Experience</h4>
            
            {/* Rating */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem', color: '#374151', fontWeight: '600', fontSize: '1rem' }}>How would you rate this session?</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      fontSize: '2rem', 
                      cursor: 'pointer',
                      color: star <= feedback.rating ? '#fbbf24' : '#d1d5db',
                      transition: 'color 0.2s'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.9rem' }}>({feedback.rating}/5 stars)</p>
            </div>

            {/* Comment */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem', color: '#374151', fontWeight: '600', fontSize: '1rem' }}>Any additional thoughts?</label>
              <textarea
                value={feedback.comment}
                onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share what you liked or what could be improved..."
                style={{ 
                  width: '100%', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  border: '2px solid #e2e8f0', 
                  minHeight: '100px', 
                  resize: 'vertical', 
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Recommend */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', justifyContent: 'center' }}>
                <input
                  type="checkbox"
                  checked={feedback.wouldRecommend}
                  onChange={(e) => setFeedback(prev => ({ ...prev, wouldRecommend: e.target.checked }))}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: '#3b82f6' }}
                />
                <span style={{ color: '#374151', fontSize: '1rem' }}>I would recommend this session to others</span>
              </label>
            </div>

            {/* Submit Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={submitFeedback}
                style={{ 
                  backgroundColor: '#10b981', 
                  color: 'white', 
                  padding: '0.875rem 2rem', 
                  borderRadius: '12px', 
                  fontWeight: '600', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
              >
                ✨ Submit Feedback
              </button>
              <button
                onClick={() => setShowFeedback(false)}
                style={{ 
                  backgroundColor: '#6b7280', 
                  color: 'white', 
                  padding: '0.875rem 1.5rem', 
                  borderRadius: '12px', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Exit Button */}
        <button
          onClick={() => navigate('/')}
          style={{ 
            width: '100%', 
            backgroundColor: '#4b5563', 
            color: 'white', 
            padding: '1rem 2rem', 
            borderRadius: '12px', 
            fontWeight: '600', 
            border: 'none', 
            cursor: 'pointer', 
            transition: 'background-color 0.2s',
            fontSize: '1rem'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#374151'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#4b5563'}
        >
          🏠 Return to Home
        </button>
      </div>
    </div>
  );
}