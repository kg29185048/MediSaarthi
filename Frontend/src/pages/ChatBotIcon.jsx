// ChatBotIcon.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const ChatBotIcon = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/app/chatbot");
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: "28px",
        cursor: "pointer",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        zIndex: 9999,
      }}
      title="Open ChatBot"
    >
      💬
    </div>
  );
};

export default ChatBotIcon;
