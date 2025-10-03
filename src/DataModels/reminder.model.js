import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    scheduledTime: { type: Date, required: true },
    sentTime: { type: Date },
    status: { type: String, enum: ["Sent", "Pending", "Failed"], default: "Pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Reminder", reminderSchema);
