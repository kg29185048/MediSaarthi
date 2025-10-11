export const fetchWithAuth = async (url, options = {}) => {
  let accessToken = localStorage.getItem("accessToken");

  options.headers = {
    ...options.headers,
    Authorization: accessToken ? `Bearer ${accessToken}` : "",
    "Content-Type": "application/json",
  };

  // Always include cookies for refresh token
  let res = await fetch(url, { ...options, credentials: "include" });

  // If access token expired, try refreshing
  if (res.status === 401) {
    try {
      const refreshRes = await fetch(
        "http://localhost:8000/api/v1/users/refresh-token",
        {
          method: "POST",
          credentials: "include", 
        }
      );

      const refreshData = await refreshRes.json();

      if (!refreshRes.ok || !refreshData?.data?.accessToken) {
        throw new Error("Refresh failed");
      }

      // Save new access token
      accessToken = refreshData.data.accessToken;
      localStorage.setItem("accessToken", accessToken);

      // Retry original request with new token
      options.headers.Authorization = `Bearer ${accessToken}`;
      res = await fetch(url, { ...options, credentials: "include" });
    } catch (err) {
        if (localStorage.getItem("accessToken")) {
          console.error("Token refresh failed:", err);
        }
        localStorage.removeItem("accessToken");
        return res;
      }

  }

  return res;
};
