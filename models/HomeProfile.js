const mongoose = require("mongoose");

const homeProfileSchema = new mongoose.Schema(
  {
    smallImage: {
      type: String,
      default: "/images/project4.jpg",
    },
    largeImage: {
      type: String,
      default: "https://tse3.mm.bing.net/th/id/OIP.bA_6zy8pfuPWahLUeHiQhAHaJ4?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
    },
    aboutImage: {
      type: String,
      default: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomeProfile", homeProfileSchema);
