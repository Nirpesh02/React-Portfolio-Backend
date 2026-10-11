const mongoose = require("mongoose");

const homeProfileSchema = new mongoose.Schema(
  {
    largeImage: {
      type: String,
      default: "",
    },
    aboutImage: {
      type: String,
      default: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomeProfile", homeProfileSchema);
