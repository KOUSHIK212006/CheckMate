import { useState, useEffect, useRef } from 'react';

const ENGAGEMENT_QUESTIONS = [
  {
    type: 'mcq',
    question: 'How are you finding the session so far?',
    options: ['Excellent', 'Good', 'Average', 'Poor']
  },
  {
    type: 'boolean',
    question: 'Are you able to follow the content clearly?',
    options: ['Yes', 'No']
  },
  {
    type: 'tap',
    question: 'Tap to confirm you are actively participating',
    options: ['Confirm']
  },
  {
    type: 'mcq',
    question: 'What would help improve your learning experience?',
    options: ['Slower pace', 'More examples', 'Interactive activities', 'Q&A time']
  },
  {
    type: 'boolean',
    question: 'Would you recommend this session to others?',
    options: ['Yes', 'No']
  }
];

export default function useEngagementPopups(sessionId, isActive = false) {
  const [currentPopup, setCurrentPopup] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isActive || !sessionId) {
      // Clear any existing timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsVisible(false);
      setCurrentPopup(null);
      return;
    }

    // Start engagement pop-ups after 10 minutes, then every 10-15 minutes
    const startEngagement = () => {
      const showPopup = () => {
        const randomQuestion = ENGAGEMENT_QUESTIONS[Math.floor(Math.random() * ENGAGEMENT_QUESTIONS.length)];
        setCurrentPopup(randomQuestion);
        setIsVisible(true);

        // Auto-hide after 8 seconds
        timeoutRef.current = setTimeout(() => {
          setIsVisible(false);
          setCurrentPopup(null);
        }, 8000);
      };

      // First popup after 10 minutes
      timeoutRef.current = setTimeout(() => {
        showPopup();
        
        // Then every 10-15 minutes
        intervalRef.current = setInterval(() => {
          showPopup();
        }, Math.random() * 5 * 60 * 1000 + 10 * 60 * 1000); // 10-15 minutes
        
      }, 10 * 60 * 1000); // 10 minutes
    };

    startEngagement();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionId, isActive]);

  const handleResponse = (response) => {
    console.log('Engagement response:', { sessionId, question: currentPopup?.question, response });
    
    // Hide popup immediately
    setIsVisible(false);
    setCurrentPopup(null);
    
    // Clear auto-hide timer
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const skipPopup = () => {
    setIsVisible(false);
    setCurrentPopup(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return {
    currentPopup,
    isVisible,
    handleResponse,
    skipPopup
  };
}