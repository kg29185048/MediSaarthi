import cookieParser from 'cookie-parser';
import cors from "cors";
import express, { urlencoded, Router } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import mongoose from "mongoose";

dotenv.config();

import userRoutes from "./routes/user.routes.js";
import doseLogRoutes from "./routes/doselog.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import notificationRoutes from "./routes/notifications.routes.js";
import globalErrorHandler from './middleware/globalErrorHandler.middleware.js';
import Medication from "./DataModels/medication.model.js";
import CalendarToken from "./DataModels/calendarToken.model.js";
import { sendEmail } from './utils/mailer.js';
import User from "./DataModels/user.model.js"
import DoseLog from "./DataModels/doselog.model.js"

const app = express();
const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, GEMINI_API_KEY } = process.env;

app.use(express.json());
app.use(urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

const stateStore = new Set();

app.get('/auth', (req, res) => {
  const state = crypto.randomBytes(20).toString('hex');
  stateStore.add(state);

  const scope = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ].join(' ');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', state);

  res.redirect(authUrl.toString());
});

app.get('/oauth2callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!state || !stateStore.has(state)) return res.status(400).send('Invalid state');
    stateStore.delete(state);

    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('grant_type', 'authorization_code');

    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    await CalendarToken.findOneAndUpdate(
      {},
      {
        accessToken: tokenResponse.data.access_token,
        refreshToken: tokenResponse.data.refresh_token,
        scope: tokenResponse.data.scope,
        tokenType: tokenResponse.data.token_type,
        expiryDate: tokenResponse.data.expiry_date,
      },
      { upsert: true, new: true }
    );

    console.log('Tokens saved to DB successfully.');
    res.redirect('http://localhost:5173/app/schedule');
  } catch (err) {
    console.error('❌ OAuth failed:', err?.response?.data || err.message);
    res.status(500).send('OAuth failed');
  }
});


async function getValidAccessToken() {
  const tokenDoc = await CalendarToken.findOne();
  if (!tokenDoc) throw new Error('Google Calendar not linked.');

  let accessToken = tokenDoc.accessToken;

  try {
    await axios.get("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return accessToken;
  } catch (err) {
    if (err.response?.status === 401) {
      console.log("🔁 Access token expired, refreshing...");

      const params = new URLSearchParams();
      params.append("client_id", CLIENT_ID);
      params.append("client_secret", CLIENT_SECRET);
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

      console.log("Access token refreshed.");
      return tokenDoc.accessToken;
    } else {
      throw err;
    }
  }
}

import medicationRouter from "./routes/medication.routes.js";
app.use("/api/v1/medications", medicationRouter);


app.get("/check-calendar", async (req, res) => {
  try {
    const linked = await CalendarToken.exists({});
    res.json({ linked: !!linked });
  } catch (err) {
    console.error("❌ Calendar check failed:", err.message);
    res.status(500).json({ linked: false });
  }
});

app.post("/unlink-calendar", async (req, res) => {
  try {
    await CalendarToken.deleteMany({});
    console.log("🗑️ Google Calendar unlinked successfully");
    res.json({ success: true, message: "Calendar unlinked" });
  } catch (err) {
    console.error("❌ Unlink failed:", err.message);
    res.status(500).json({ success: false, message: "Failed to unlink calendar" });
  }
});

import { DateTime } from "luxon"; // or use plain JS with offset
cron.schedule("* * * * *", async () => {
  try {
    const now = DateTime.now().setZone("Asia/Kolkata");
    console.log(`[Cron] Checking reminders at ${now.toISO()}`);

    const meds = await Medication.find({ startDate: { $lte: now.toJSDate() } });

    for (const med of meds) {
      const user = await User.findById(med.user);
      if (!user?.email) continue;

      med.times.forEach(async (time) => {
        const medDateTime = DateTime.fromISO(`${now.toISODate()}T${time}`, { zone: "Asia/Kolkata" });
        const diffMinutes = Math.round(medDateTime.diff(now, "minutes").minutes);

        if (diffMinutes >= 0 && diffMinutes <= 5) {
          med.sentReminders = med.sentReminders || [];
          if (!med.sentReminders.includes(time)) {
            await sendEmail({
              to: user.email,
              subject: `💊 Upcoming Medication Reminder: ${med.name}`,
              text: `Your medication "${med.name}" (${med.dosage}) is scheduled in ${diffMinutes} minutes!`,
            });
            console.log(`[Reminder] Sent ${med.name} to ${user.email}`);

            med.sentReminders.push(time);
            await med.save();
          }
        }
      });
    }
  } catch (err) {
    console.error("Error in medication reminder cron:", err);
  }
});


app.post("/chat", async (req, res) => {

  try {
    const { email, message } = req.body;

    // Validate input
    if (!email || !message) {
      console.warn(" Missing email or message");
      return res.status(400).json({ error: "Email and message are required" });
    }

    console.log("Looking up user:", email);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.warn("User not found:", email);
      return res.status(404).json({ error: "User not found" });
    }


    const meds = await Medication.find({ user: user._id });

    const medicineContext = meds.length
      ? meds.map(
          (m) =>
            `${m.name} (${m.dosage}), ${m.frequency}, start: ${m.startDate.toDateString()}, purpose: ${m.description || "N/A"} ,times: ${m.times}`
        ).join("\n")
      : "No medicine data found.";
    
    const doseLogs = await DoseLog.find({ user: user._id })
      .populate("medicationId", "name dosage")
      .sort({ date: -1 })
      .limit(20); // Only latest 20 logs to avoid overloading AI

    const doseLogContext = doseLogs.length
      ? doseLogs
          .map(
            (log) =>
              `${log.medicationId?.name || "Unknown"} (${log.medicationId?.dosage || ""}) - ${log.date.toDateString()} at ${log.time} → ${log.status}`
          )
          .join("\n")
      : "No recent dose logs found.";

    const fullPrompt = `
      You are Alchemist AI, a calm and intelligent virtual health assistant for our medication app.

      User Info:
      - Email: ${email}
      - Name: ${user.name || "User"}

      User Message:
      "${message}"

      Medication Context:
      ${medicineContext}

      Recent Dose Log Context:
      ${doseLogContext}

      Guidelines:
      - Greet the user by name if possible.
      - Reply clearly and conversationally (1–3 sentences).
      - Focus only on medical, health, or medication-related topics.
      - If user asks about unrelated topics (math, politics, etc.), politely decline by saying:
        "Sorry, I can only help with your medicines and health-related questions."
      - Never prescribe new medication; instead, suggest consulting a doctor if necessary.
      `;

    console.log("Full prompt ready for Gemini API");

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "Server misconfiguration: missing API key" });
    }

    let aiResponse;
    try {
      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        { contents: [{ role: "user", parts: [{ text: fullPrompt }] }] },
        { headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY } }
      );

      aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 
        "Sorry, I could not generate a response.";

    } catch (apiErr) {
      console.error("Gemini API error:", apiErr.response?.data || apiErr.message);
      return res.status(500).json({ error: "AI service failed" });
    }

    console.log("AI response generated successfully");

    // Send response
    return res.json({ reply: aiResponse });

  } catch (err) {
    console.error("Unexpected /chat handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


app.use("/api/v1/users", userRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/doselog", doseLogRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

app.use(globalErrorHandler);

export default app;
