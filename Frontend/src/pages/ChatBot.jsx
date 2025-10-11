import React, { useState, useRef, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext.js";

const ChatBot = () => {
  const { user } = useContext(AuthContext);
  const [email, setEmail] = useState(user?.email || ""); // Auto-fill user email
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  };

  const appendMessage = (sender, text) => {
    setChat((prev) => [...prev, { sender, text }]);
    setTimeout(scrollToBottom, 50);
  };

  const handleSend = async () => {
    if (!email || !message) {
      alert("Enter both email and message!");
      return;
    }

    appendMessage("user", message);
    setMessage("");
    setLoading(true);

    try {
        const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
        credentials: "include",
        });


      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        appendMessage("bot", data.reply);
      } else {
        appendMessage("bot", `Error: ${data.error || "Server error"}`);
      }
    } catch (err) {
      setLoading(false);
      appendMessage("bot", "Network Error: Failed to connect to server.");
      console.error("Chat fetch error:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="container mt-4">
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>
        Your Saarthi Assistant
      </h1>

      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "30px",
          maxWidth: "800px",
          margin: "0 auto",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        {/* Only show email input if user is not logged in */}
        {!user && (
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Your Email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}

        <div
          ref={chatBoxRef}
          style={{
            height: "400px",
            overflowY: "auto",
            border: "2px solid #e8ecef",
            padding: "20px",
            borderRadius: "15px",
            background: "#fafafa",
            marginBottom: "20px",
          }}
        >
          {chat.map((msg, idx) => (
            <div
              key={idx}
              className={msg.sender === "user" ? "text-end mb-2" : "text-start mb-2"}
            >
              <span
                style={{
                  display: "inline-block",
                  maxWidth: "80%",
                  padding: "10px 16px",
                  borderRadius:
                    msg.sender === "user" ? "15px 15px 0 15px" : "15px 15px 15px 0",
                  background:
                    msg.sender === "user"
                      ? "linear-gradient(135deg, #00b894, #00cec9)"
                      : "linear-gradient(135deg, #667eea, #764ba2)",
                  color: "#fff",
                  wordWrap: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.text}
              </span>
            </div>
          ))}
          {loading && (
            <div className="text-start mb-2">
              <span
                style={{
                  display: "inline-block",
                  maxWidth: "80%",
                  padding: "10px 16px",
                  borderRadius: "15px 15px 15px 0",
                  background: "gray",
                  color: "#fff",
                }}
              >
                Bot is thinking...
              </span>
            </div>
          )}
        </div>

        <div className="input-group" style={{ gap: "10px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Ask your question..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="btn btn-primary"
            onClick={handleSend}
            style={{
              padding: "12px 30px",
              borderRadius: "50px",
              fontWeight: "600",
              color: "#fff",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              border: "none",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
