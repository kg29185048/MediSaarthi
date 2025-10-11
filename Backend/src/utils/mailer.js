import nodemailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config();

const { GMAIL_USER , GMAIL_PASS} = process.env;
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    return await transporter.sendMail({
      from: `"MediSaarthi" <${GMAIL_USER}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ""),
      html,
    });
  } catch (err) {
    console.error("Email error:", err);
    throw err;
  }
};

