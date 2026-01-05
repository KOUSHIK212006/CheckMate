export default function Card({ children, style }) {
  return (
    <div
      className="card"
      style={{
        padding: "2rem",
        borderRadius: 20,
        backdropFilter: "blur(20px)",
        background: "rgba(2, 6, 23, 0.75)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        boxShadow: "0 40px 120px rgba(0, 0, 0, 0.9), inset 0 0 0 1px rgba(255,255,255,0.03)",
        color: "#fff",
        position: "relative",
        zIndex: 1,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
