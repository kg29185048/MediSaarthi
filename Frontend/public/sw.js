/* global self */
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const title = data.title || "Medication Reminder";
  const options = {
    body: data.body || "It's time to take your medicine 💊",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge.png",       
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
