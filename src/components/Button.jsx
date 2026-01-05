export default function Button({ children, onClick, disabled, style, type = "button", onMouseEnter, onMouseLeave }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        padding: "14px 24px",
        borderRadius: 12,
        border: "none",
        background: disabled ? "rgba(148, 163, 184, 0.3)" : "linear-gradient(135deg, #4f46e5, #06b6d4)",
        color: "#fff",
        fontSize: "16px",
        fontWeight: "600",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.3s ease",
        boxShadow: disabled ? "none" : "0 4px 16px rgba(79, 70, 229, 0.3)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
