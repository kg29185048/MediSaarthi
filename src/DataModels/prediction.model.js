import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    predictionDate: { type: Date, required: true },
    missedProbability: { type: Number, min: 0, max: 1, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Prediction =  mongoose.model("Prediction", predictionSchema);
