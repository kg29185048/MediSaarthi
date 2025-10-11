// src/utils/pushNotifications.js
export async function registerServiceWorkerAndSubscribe() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers not supported in this browser.");
    return;
  }

  try {
    // ✅ Register service worker
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("Service Worker registered:", registration);

    // ✅ Ask permission for notifications
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Push permission not granted.");
      return;
    }

    // ✅ Subscribe to push service
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    // ✅ Save subscription in backend
    const token = localStorage.getItem("accessToken");
    await fetch(`${import.meta.env.VITE_API_URL}/api/v1/notifications/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription }),
    });

    console.log("✅ Push subscription saved!");
  } catch (err) {
    console.error("Push subscription failed:", err);
  }
}

// Helper: convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
