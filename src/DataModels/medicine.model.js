import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true }, // e.g. '2 times/day'
    timing: [{ type: String }], // e.g. ['08:00', '20:00']
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Medicine = mongoose.model("Medicine", medicineSchema);
