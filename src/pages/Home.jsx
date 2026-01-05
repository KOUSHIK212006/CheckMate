import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Home() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="page app center">
      <div className="glow"></div>

      <div className="card">
        {user && (
          <button 
            onClick={handleSignOut}
            className="btn participant"
            style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              padding: '8px 16px', 
              fontSize: '12px',
              minWidth: 'auto'
            }}
          >
            Sign Out
          </button>
        )}
        
        <div className="logo gradient-text">CheckMate</div>
        <div className="subtitle">Presence • Engagement • Trust</div>

        <p className="description">
          Choose your role to continue
        </p>

        <div className="actions">
          <button
            className="btn organizer"
            onClick={() => navigate("/organizer")}
          >
            Organizer
          </button>

          <button
            className="btn participant"
            onClick={() => navigate("/participant")}
          >
            Participant
          </button>
        </div>
      </div>
    </div>
  );
}
