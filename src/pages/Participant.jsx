import { useNavigate } from "react-router-dom";

export default function Participant() {
  const navigate = useNavigate();

  return (
    <div className="page app center">
      <div className="card">
        <h2>Participant Dashboard</h2>
        <p>Scan the session QR to mark attendance</p>

        <button
          className="btn participant"
          onClick={() => navigate("/scan")}
          style={{ marginTop: "1rem" }}
        >
          Scan QR
        </button>
      </div>
    </div>
  );
}
