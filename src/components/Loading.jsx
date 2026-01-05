import "../App.css";

export default function Loading() {
  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="loading-logo gradient-text shimmer">
          CHECKMATE
        </div>
        <p className="loading-text">
          Verifying presence…
        </p>
      </div>
    </div>
  );
}
