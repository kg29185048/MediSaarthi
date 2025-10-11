import cron from "node-cron";
import DoseLog from "../DataModels/doselog.model.js";
import User from "../DataModels/user.model.js";
import Medication from "../DataModels/medication.model.js";
import sendPushNotification  from "./sendPushNotification.js";
import { sendEmail } from "./mailer.js";

export const startMedicationReminderScheduler = () => {
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const dueDoses = await DoseLog.find({
      time: currentTime,
      status: "pending",
    })
      .populate("user")
      .populate("medicationId");

    for (const dose of dueDoses) {
      const user = dose.user;
      if (!user || !dose.medicationId) continue;

      const message = `💊 It's time to take your ${dose.medicationId.name} (${dose.medicationId.dosage}).`;

      // Browser notification
      if (user.preferences?.pushSubscription) {
        await sendPushNotification(user.preferences.pushSubscription, {
          title: "Medication Reminder",
          body: message,
        });
      }

      // Email notification
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: "Medication Reminder 💊",
          html: `<p>${message}</p><p>Please mark it taken in the app.</p>`,
        });
      }

      dose.status = "notified";
      await dose.save();
    }

    console.log(`[Reminder] Checked doses at ${currentTime}`);
  });
};
