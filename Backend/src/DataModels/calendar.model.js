import mongoose from "mongoose";

const calendarEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    googleEventId: { type: String, required: true },
    eventTime: { type: Date, required: true },
    status: { type: String, enum: ["Synced", "Updated", "Deleted"], default: "Synced" },
  },
  { timestamps: true }
);

export const Calendar = mongoose.model("Calendar", calendarEventSchema);
