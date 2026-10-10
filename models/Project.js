const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a project title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    image: {
      type: String,
      required: [true, "Please add an image URL"],
    },
    technologies: {
      type: [String],
      required: [true, "Please add at least one technology"],
    },
    role: {
      type: String,
      default: "Developer",
    },
    dateRange: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },
    liveLink: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", projectSchema);
