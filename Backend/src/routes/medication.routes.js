import { Router } from "express";
import Medication from "../DataModels/medication.model.js";
import CalendarToken from "../DataModels/calendarToken.model.js";
import { sendEmail } from "../utils/mailer.js";
import axios from "axios";

const router = Router();

async function getValidAccessToken() {
  const tokenDoc = await CalendarToken.findOne();
  if (!tokenDoc) return null;

  let accessToken = tokenDoc.accessToken;

  try {
    await axios.get("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return accessToken;
  } catch (err) {
    if (err.response?.status === 401) {
      // refresh token
      const params = new URLSearchParams();
      params.append("client_id", process.env.CLIENT_ID);
      params.append("client_secret", process.env.CLIENT_SECRET);
      params.append("refresh_token", tokenDoc.refreshToken);
      params.append("grant_type", "refresh_token");

      const res = await axios.post(
        "https://oauth2.googleapis.com/token",
        params.toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      tokenDoc.accessToken = res.data.access_token;
      tokenDoc.tokenType = res.data.token_type;
      tokenDoc.expiryDate = res.data.expiry_date;
      await tokenDoc.save();

      return tokenDoc.accessToken;
    } else {
      throw err;
    }
  }
}

router.get("/", async (req, res) => {
  try {
    const meds = await Medication.find();
    res.status(200).json({ success: true, data: meds });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch medications" });
  }
});

// ADD medication (creates recurring daily events)
router.post("/", async (req, res) => {
  try {
    const { name, dosage, frequency, times, startDate, endDate, description, user, userEmail } = req.body;

    if (!user) return res.status(400).json({ success: false, message: "User ID required" });
    if (!Array.isArray(times) || times.length === 0) return res.status(400).json({ success: false, message: "Times required" });

    const newMed = await Medication.create({ name, dosage, frequency, times, startDate, endDate, description, user });

    // --- Google Calendar ---
    const accessToken = await getValidAccessToken();
    const createdEvents = [];

    if (accessToken) {
      let currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        const dateString = currentDate.toISOString().split("T")[0];

        for (const time of times) {
          const startDateTime = new Date(`${dateString}T${time}:00+05:30`);
          const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000);

          const event = {
            summary: `💊 ${name} (${dosage})`,
            description: description || "Medicine reminder",
            start: { dateTime: startDateTime.toISOString(), timeZone: "Asia/Kolkata" },
            end: { dateTime: endDateTime.toISOString(), timeZone: "Asia/Kolkata" },
            reminders: { useDefault: true },
          };

          try {
            const response = await axios.post(
              "https://www.googleapis.com/calendar/v3/calendars/primary/events",
              event,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            createdEvents.push(response.data.id);
          } catch (err) {
            console.error("❌ Calendar error:", err?.response?.data || err.message);
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    newMed.googleEventIds = createdEvents;
    await newMed.save();

    res.status(201).json({ success: true, data: newMed });
  } catch (err) {
    console.error("❌ Add medication error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to add medication" });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dosage, frequency, times, startDate, endDate, description, user, userEmail } = req.body;

    const med = await Medication.findById(id);
    if (!med) return res.status(404).json({ success: false, message: "Medication not found" });

    const accessToken = await getValidAccessToken();

    // Delete old Google Calendar events
    if (accessToken && med.googleEventIds?.length) {
      for (const eventId of med.googleEventIds) {
        try {
          await axios.delete(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        } catch (err) {
          console.error("⚠️ Failed to delete old event:", err?.response?.data || err.message);
        }
      }
    }


    Object.assign(med, { name, dosage, frequency, times, startDate, endDate, description, user });

    const newEventIds = [];
    if (accessToken) {
      let currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        const dateString = currentDate.toISOString().split("T")[0];

        for (const time of times) {
          const startDateTime = new Date(`${dateString}T${time}:00+05:30`);
          const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000);

          const event = {
            summary: `💊 ${name} (${dosage})`,
            description: description || "Medicine reminder",
            start: { dateTime: startDateTime.toISOString(), timeZone: "Asia/Kolkata" },
            end: { dateTime: endDateTime.toISOString(), timeZone: "Asia/Kolkata" },
            reminders: { useDefault: true },
          };

          try {
            const response = await axios.post(
              "https://www.googleapis.com/calendar/v3/calendars/primary/events",
              event,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            newEventIds.push(response.data.id);
          } catch (err) {
            console.error("❌ Calendar error:", err?.response?.data || err.message);
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    med.googleEventIds = newEventIds;
    await med.save();

    if (userEmail) {
      await sendEmail({
        to: userEmail,
        subject: `Medication Updated: ${name}`,
        text: `Your medication "${name}" (${dosage}) has been updated. Times: ${times.join(", ")}`,
      });
    }

    res.status(200).json({ success: true, data: med });
  } catch (err) {
    console.error("❌ Error updating medication:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to update medication" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const med = await Medication.findById(req.params.id);
    if (!med) return res.status(404).json({ success: false, message: "Not found" });

    const accessToken = await getValidAccessToken();

    if (accessToken && med.googleEventIds?.length) {
      for (const eventId of med.googleEventIds) {
        try {
          await axios.delete(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        } catch (err) {
          console.error("⚠️ Failed to delete event:", err?.response?.data || err.message);
        }
      }
    }

    await Medication.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete medication error:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete medication" });
  }
});

export default router;
