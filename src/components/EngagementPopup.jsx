export default function EngagementPopup({ popup, isVisible, onResponse, onSkip }) {
  if (!isVisible || !popup) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      background: 'linear-gradient(135deg, rgba(79,70,229,0.95), rgba(37,99,235,0.95))',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '12px',
      padding: '20px',
      maxWidth: '350px',
      color: 'white',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      animation: 'slideInRight 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Quick Check</h4>
        <button 
          onClick={onSkip}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'rgba(255,255,255,0.7)', 
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0',
            width: '20px',
            height: '20px'
          }}
        >
          ×
        </button>
      </div>
      
      <p style={{ margin: '0 0 15px 0', fontSize: '14px', lineHeight: '1.4' }}>
        {popup.question}
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {popup.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onResponse(option)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            {option}
          </button>
        ))}
      </div>
      
      <p style={{ 
        margin: '12px 0 0 0', 
        fontSize: '11px', 
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center'
      }}>
        Optional • Auto-closes in 8s
      </p>
    </div>
  );
}