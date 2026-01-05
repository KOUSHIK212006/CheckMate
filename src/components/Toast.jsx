import { useEffect } from "react";

export default function Toast({ message, type = "info", onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return {
          background: "rgba(16, 185, 129, 0.15)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          color: "#10b981"
        };
      case "error":
        return {
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          color: "#ef4444"
        };
      case "warning":
        return {
          background: "rgba(245, 158, 11, 0.15)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          color: "#f59e0b"
        };
      default:
        return {
          background: "rgba(79, 70, 229, 0.15)",
          border: "1px solid rgba(79, 70, 229, 0.3)",
          color: "#4f46e5"
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div style={{ 
      position: "fixed", 
      right: 20, 
      bottom: 20, 
      zIndex: 9999,
      animation: "slideInRight 0.3s ease-out"
    }}>
      <div
        style={{
          padding: "1rem 1.5rem",
          ...styles,
          borderRadius: 12,
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          minWidth: 280,
          maxWidth: 400,
          fontSize: "14px",
          fontWeight: "500"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>
            {type === "success" ? "✅" : type === "error" ? "❌" : type === "warning" ? "⚠️" : "ℹ️"}
          </span>
          <div>
            <strong style={{ display: "block", marginBottom: "4px" }}>
              {type === "success" ? "Success" : type === "error" ? "Error" : type === "warning" ? "Warning" : "Info"}
            </strong>
            <div style={{ opacity: 0.9 }}>{message}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
