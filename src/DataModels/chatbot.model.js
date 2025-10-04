import mongoose from "mongoose";

const chatbotQuerySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    queryText: { type: String, required: true },
    responseText: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Chatbot = mongoose.model("Chatbot", chatbotQuerySchema);
