import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import useAuth from "./hooks/useAuth";
import useEngagementPopups from "./hooks/useEngagementPopups";
import Loading from "./components/Loading";
import EngagementPopup from "./components/EngagementPopup";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Organizer from "./pages/Organizer";
import Participant from "./pages/Participant";
import Scan from "./pages/Scan";
import SessionJoin from "./pages/SessionJoin";
import SessionComplete from "./pages/SessionComplete";
import NotFound from "./pages/NotFound";

import "./App.css";

function App() {
  const { user, loading: authLoading } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  // Check if user has an active session (for engagement popups)
  useEffect(() => {
    const sessionId = localStorage.getItem('activeSessionId');
    if (sessionId) {
      setActiveSessionId(sessionId);
    }
  }, []);
  
  const {
    currentPopup,
    isVisible: popupVisible,
    handleResponse,
    skipPopup
  } = useEngagementPopups(activeSessionId, !!activeSessionId);
  
  /* ---------------------------
     SHOW LOADING (ONLY ON / AND ONLY ONCE PER SESSION)
  ---------------------------- */
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    // ensure the CHECKMATE animation only runs once per browser session
    const shown = sessionStorage.getItem("checkmate_shown") === "1";
    shownRef.current = shown;

    if (location.pathname === "/" && !shownRef.current) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
        shownRef.current = true;
        sessionStorage.setItem("checkmate_shown", "1");
      }, 2200); // splash duration

      return () => clearTimeout(timer);
    }
    // if we are not on / or already shown, don't show loading
    setLoading(false);
  }, [location.pathname]);

  if (loading || authLoading) return <Loading />;

  /* ---------------------------
     ROUTES
  ---------------------------- */
  return (
    <>
      <Routes>
        <Route path="/" element={user ? <Home /> : <Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/organizer" element={<Organizer />} />
        <Route path="/participant" element={<Participant />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/session/:sessionId/join" element={<SessionJoin />} />
        <Route path="/session/:sessionId/complete" element={<SessionComplete />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Engagement Popups */}
      <EngagementPopup 
        popup={currentPopup}
        isVisible={popupVisible}
        onResponse={handleResponse}
        onSkip={skipPopup}
      />
    </>
  );
}

export default App;
