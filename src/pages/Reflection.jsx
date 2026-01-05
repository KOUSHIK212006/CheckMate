import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";

export default function Reflection() {
  const navigate = useNavigate();
  const [reflection, setReflection] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = () => {
    // Store reflection locally (no backend required for demo)
    if (reflection.trim()) {
      localStorage.setItem("last_reflection", reflection);
    }
    navigate("/thank-you");
  };

  const handleSkip = () => {
    navigate("/thank-you");
  };

  const handlePaste = (e) => {
    e.preventDefault(); // Prevent copy-paste as specified
  };

  return (
    <div className="page app center">
      <Card style={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
        <h2 style={{ margin: 0, marginBottom: 16 }}>
          In 1–2 lines, what is one thing you learned today?
        </h2>
        
        <div style={{ 
          fontSize: 14, 
          color: "#94a3b8", 
          marginBottom: 16 
        }}>
          You have {timeLeft} seconds
        </div>
        
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          onPaste={handlePaste}
          placeholder="Share your learning..."
          style={{
            width: "100%",
            height: 80,
            padding: 12,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.05)",
            color: "#fff",
            resize: "none",
            marginBottom: 16,
            fontFamily: "inherit"
          }}
          maxLength={200}
        />
        
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Button onClick={handleSubmit}>Submit</Button>
          <Button 
            onClick={handleSkip}
            style={{ 
              background: "transparent", 
              border: "1px solid rgba(255,255,255,0.3)" 
            }}
          >
            Skip
          </Button>
        </div>
      </Card>
    </div>
  );
}