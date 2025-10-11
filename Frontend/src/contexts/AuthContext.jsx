import React, { createContext, useState, useEffect } from "react";
import { fetchWithAuth } from "../utils/fetchWithAuth.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetchWithAuth("http://localhost:8000/api/v1/users/me");

        if (!res.ok) {
          setUser(null);
        } else {
          const data = await res.json();
          setUser(data.data?.user || data.user || null);
        }
      } catch (err) {
        console.error("Fetch user error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Logout function
  const logout = async () => {
    try {
      await fetch("http://localhost:8000/api/v1/users/logout", {
        method: "POST",
        credentials: "include", // include cookies
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
