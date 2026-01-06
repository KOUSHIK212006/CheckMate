import { useState, useEffect, useRef } from 'react';

const ENGAGEMENT_QUESTIONS = [
  {
    type: 'mcq',
    question: 'How are you finding the session so far?',
    options: ['Excellent', 'Good', 'Average', 'Poor'],
    correct: [0] // Excellent is considered correct
  },
  {
    type: 'boolean',
    question: 'Are you able to follow the content clearly?',
    options: ['Yes', 'No'],
    correct: [0] // Yes is correct
  },
  {
    type: 'tap',
    question: 'Tap to confirm you are actively participating',
    options: ['Confirm'],
    correct: [0] // Confirm is correct
  },
  {
    type: 'mcq',
    question: 'What would help improve your learning experience?',
    options: ['Slower pace', 'More examples', 'Interactive activities', 'Q&A time'],
    correct: [2, 3] // Interactive activities and Q&A time are good answers
  },
  {
    type: 'boolean',
    question: 'Would you recommend this session to others?',
    options: ['Yes', 'No'],
    correct: [0] // Yes is correct
  }
];

export default function useEngagementPopups(sessionId, isActive = false) {
  const [currentPopup, setCurrentPopup] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const checkTriggerRef = useRef(null);
  const [popupSettings, setPopupSettings] = useState({ timing: "fixed", interval: 20, popupDuration: 10 });

  // Load popup settings from localStorage
  useEffect(() => {
    if (sessionId) {
      const settings = localStorage.getItem(`popupSettings_${sessionId}`);
      if (settings) {
        setPopupSettings(JSON.parse(settings));
      }
    }
  }, [sessionId]);

  useEffect(() => {
    if (!isActive || !sessionId) {
      // Clear any existing timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (checkTriggerRef.current) clearInterval(checkTriggerRef.current);
      setIsVisible(false);
      setCurrentPopup(null);
      return;
    }

    // Check for organizer-triggered questions every 2 seconds
    checkTriggerRef.current = setInterval(() => {
      const triggerData = localStorage.getItem(`triggerPopup_${sessionId}`);
      if (triggerData) {
        const { question, timestamp } = JSON.parse(triggerData);
        
        // Only show if it's a recent trigger (within last 30 seconds)
        if (Date.now() - timestamp < 30000) {
          setCurrentPopup({
            ...question,
            isOrganizerTriggered: true,
            triggerId: timestamp
          });
          setIsVisible(true);
          
          // Remove the trigger so it doesn't show again
          localStorage.removeItem(`triggerPopup_${sessionId}`);
          
          // Auto-hide after organizer-set duration
          timeoutRef.current = setTimeout(() => {
            handleMissed();
          }, popupSettings.popupDuration * 1000);
        }
      }
    }, 2000);

    // Only start automatic popups if timing is set to random
    if (popupSettings.timing === "random") {
      const startEngagement = () => {
        const showPopup = () => {
          const randomQuestion = ENGAGEMENT_QUESTIONS[Math.floor(Math.random() * ENGAGEMENT_QUESTIONS.length)];
          setCurrentPopup(randomQuestion);
          setIsVisible(true);

          // Auto-hide after organizer-set duration
          timeoutRef.current = setTimeout(() => {
            handleMissed();
          }, popupSettings.popupDuration * 1000);
        };

        // First popup after 2 minutes for random mode
        timeoutRef.current = setTimeout(() => {
          showPopup();
          
          // Then at organizer-set intervals
          intervalRef.current = setInterval(() => {
            showPopup();
          }, popupSettings.interval * 1000);
          
        }, 2 * 60 * 1000);
      };

      startEngagement();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (checkTriggerRef.current) clearInterval(checkTriggerRef.current);
    };
  }, [sessionId, isActive, popupSettings]);

  const saveResponse = (response, isCorrect, missed = false) => {
    const responses = JSON.parse(localStorage.getItem(`responses_${sessionId}`) || '[]');
    
    const responseData = {
      questionId: currentPopup?.id || Date.now(),
      question: currentPopup?.question || currentPopup?.text,
      selectedAnswer: response,
      isCorrect,
      missed,
      timestamp: Date.now(),
      isOrganizerTriggered: currentPopup?.isOrganizerTriggered || false
    };
    
    responses.push(responseData);
    localStorage.setItem(`responses_${sessionId}`, JSON.stringify(responses));
    
    console.log('Response saved:', responseData);
  };

  const handleResponse = (response) => {
    console.log('Engagement response:', { sessionId, question: currentPopup?.question || currentPopup?.text, response });
    
    // Determine if answer is correct
    let isCorrect = false;
    if (currentPopup?.correct) {
      const selectedIndex = currentPopup.options.indexOf(response);
      isCorrect = currentPopup.correct.includes(selectedIndex);
    } else if (currentPopup?.options) {
      // For organizer questions, check against the correct answer index
      const selectedIndex = currentPopup.options.indexOf(response);
      isCorrect = selectedIndex === currentPopup.correct;
    }
    
    // Save the response
    saveResponse(response, isCorrect, false);
    
    // Hide popup immediately
    setIsVisible(false);
    setCurrentPopup(null);
    
    // Clear auto-hide timer
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleMissed = () => {
    // Save as missed response
    saveResponse(null, false, true);
    
    setIsVisible(false);
    setCurrentPopup(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const skipPopup = () => {
    handleMissed();
  };

  return {
    currentPopup,
    isVisible,
    handleResponse,
    skipPopup,
    duration: popupSettings.popupDuration
  };
}