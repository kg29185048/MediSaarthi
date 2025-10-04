import mongoose from "mongoose";

const doseLogSchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    scheduledTime: { type: Date, required: true },
    actualTime: { type: Date },
    status: { type: String, enum: ["Taken", "Missed", "Pending"], required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const DoseLog = mongoose.model("DoseLog", doseLogSchema);
