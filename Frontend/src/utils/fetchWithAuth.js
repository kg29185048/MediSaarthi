// src/utils/fetchWithAuth.js
export const fetchWithAuth = async (url, options = {}) => {
  let token = localStorage.getItem("accessToken");

  // Attach Authorization header
  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  let res = await fetch(url, { ...options, credentials: "include" });

  // If access token expired, try refreshing
  if (res.status === 401) {
    try {
      const refreshRes = await fetch("http://localhost:8000/api/v1/users/refresh-token", {
        method: "POST",
        credentials: "include",
      });
      const refreshData = await refreshRes.json();

      if (!refreshRes.ok) throw new Error("Refresh failed");

      // Save new access token
      token = refreshData.data.accessToken;
      localStorage.setItem("accessToken", token);

      // Retry original request
      options.headers.Authorization = `Bearer ${token}`;
      res = await fetch(url, { ...options, credentials: "include" });
    } catch (err) {
      console.error("Token refresh failed:", err);
      localStorage.removeItem("accessToken");
      return res;
    }
  }

  return res;
};
