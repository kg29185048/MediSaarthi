import mongoose from "mongoose";

const adherenceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    totalDoses: { type: Number, default: 0 },
    dosesTaken: { type: Number, default: 0 },
    dosesMissed: { type: Number, default: 0 },
    adherenceRate: { type: Number, default: 0.0 },
  },
  { timestamps: true }
);

export default mongoose.model("Adherence", adherenceSchema);
