// src/utils/sendPushNotification.js
import webpush from "./webPush.js";

const sendPushNotification = async (subscription, payload) => {
  try {
    if (!subscription || !subscription.endpoint) {
      console.error("Invalid subscription object:", subscription);
      return;
    }

    const notificationPayload = {
      title: payload.title || "Medication Reminder",
      body: payload.body || "It's time to take your medicine 💊",
    };

    console.log("Sending push payload:", notificationPayload);

    await webpush.sendNotification(subscription, JSON.stringify(notificationPayload));
    console.log("Push notification sent successfully to:", subscription.endpoint);
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};


export default sendPushNotification;
