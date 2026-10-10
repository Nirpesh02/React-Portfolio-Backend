const mongoose = require("mongoose");

const chatbotSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    messages: [
      {
        sender: { type: String, enum: ["user", "bot", "admin", "system"] },
        text: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chatbot", chatbotSchema);
