import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/v1/users/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // ✅ important: sends refresh token cookie
      });

      const data = await res.json();

      if (!res.ok) {
        switch (res.status) {
          case 401:
            throw new Error("Wrong credentials!");
          case 403:
            throw new Error("Please verify your email before logging in!");
          case 404:
            throw new Error("User not found! Please register first.");
          default:
            throw new Error(data.message || "Login failed");
        }
      }

      // Save access token only
      if (data.data?.accessToken) {
        localStorage.setItem("accessToken", data.data.accessToken);
      }

      // Set user in context
      setUser(data.data.user);

      // Redirect to dashboard
      navigate("/app/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    }
  };

  return (
    <div className="auth-form signin-form">
      <form onSubmit={handleSubmit}>
        <h2>Sign in</h2>
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Sign in</button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Signin;
