import { useState, useEffect } from 'react';

export default function PopupQuestion({ question, onResponse, onTimeout }) {
  const [timeLeft, setTimeLeft] = useState(5);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!answered) {
            onTimeout(question.id);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [answered, question.id, onTimeout]);

  const handleAnswer = (answerIndex) => {
    if (answered) return;
    
    if (question.type === "multiple") {
      // Toggle selection for multiple choice
      setSelectedAnswers(prev => {
        const newSelection = prev.includes(answerIndex)
          ? prev.filter(i => i !== answerIndex)
          : [...prev, answerIndex];
        return newSelection;
      });
    } else {
      // Single choice - submit immediately
      setAnswered(true);
      const questionCorrect = Array.isArray(question.correct) ? question.correct[0] : question.correct;
      const isCorrect = answerIndex === questionCorrect;
      onResponse(question.id, [answerIndex], isCorrect);
    }
  };

  const submitMultipleChoice = () => {
    if (answered || selectedAnswers.length === 0) return;
    
    setAnswered(true);
    const questionCorrect = Array.isArray(question.correct) ? question.correct : [question.correct];
    const isCorrect = questionCorrect.some(correctIndex => selectedAnswers.includes(correctIndex)) &&
                     selectedAnswers.every(answer => questionCorrect.includes(answer));
    onResponse(question.id, selectedAnswers, isCorrect);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', maxWidth: '28rem', width: '100%', margin: '0 1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ color: '#f59e0b', fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>Attention Check</h3>
        </div>

        {/* Question */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: '#374151', textAlign: 'center', fontWeight: '500' }}>
            {question.text}
          </p>
          {question.type === "multiple" && (
            <p style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', marginTop: '0.5rem' }}>
              Select all that apply
            </p>
          )}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {question.options.map((option, index) => {
            const isSelected = question.type === "multiple" ? selectedAnswers.includes(index) : false;
            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={answered && question.type === "single"}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem', 
                  backgroundColor: isSelected ? '#dbeafe' : (answered ? '#f3f4f6' : '#f9fafb'),
                  border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: '0.5rem', 
                  fontWeight: '500', 
                  color: isSelected ? '#1e40af' : '#374151', 
                  cursor: (answered && question.type === "single") ? 'not-allowed' : 'pointer',
                  opacity: (answered && question.type === "single") ? 0.5 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => !answered && !isSelected && (e.target.style.backgroundColor = '#eff6ff')}
                onMouseOut={(e) => !answered && !isSelected && (e.target.style.backgroundColor = '#f9fafb')}
              >
                {question.type === "multiple" && (
                  <div style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid #d1d5db', 
                    borderRadius: '3px',
                    backgroundColor: isSelected ? '#3b82f6' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {isSelected && '✓'}
                  </div>
                )}
                {option}
              </button>
            );
          })}
        </div>

        {/* Submit button for multiple choice */}
        {question.type === "multiple" && !answered && selectedAnswers.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={submitMultipleChoice}
              style={{
                width: '100%',
                backgroundColor: '#10b981',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Submit ({selectedAnswers.length} selected)
            </button>
          </div>
        )}

        {/* Timer */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ height: '0.5rem', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  backgroundColor: '#ef4444', 
                  transition: 'width 1s linear',
                  width: `${(timeLeft / 5) * 100}%`
                }}
              />
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            ⏳ {timeLeft} seconds remaining
          </p>
        </div>

        {timeLeft === 0 && !answered && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <p style={{ color: '#dc2626', fontWeight: '500' }}>Time's up!</p>
          </div>
        )}
      </div>
    </div>
  );
}