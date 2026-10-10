const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      trim: true,
    },
    service: {
      type: String,
      required: [true, "Please select a service"],
    },
    budget: {
      type: String,
      required: [true, "Please select a budget"],
    },
    message: {
      type: String,
      required: [true, "Please add a message"],
    },
    address: {
      type: String,
      required: [true, "Please add an address"],
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Declined"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inquiry", inquirySchema);
