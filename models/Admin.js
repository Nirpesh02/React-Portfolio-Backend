const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: "NIRPESH"
  },
  avatar: {
    type: String,
    default: ""
  },
  title: {
    type: String,
    default: "Full Stack Developer"
  },
  bio: {
    type: String,
    default: "Passionate full-stack developer dedicated to building responsive, scalable, and user-friendly digital experiences."
  },
  location: {
    type: String,
    default: "Remote / Nepal"
  },
  availability: {
    type: String,
    default: "Available for new projects"
  },
  github: {
    type: String,
    default: ""
  },
  linkedin: {
    type: String,
    default: ""
  },
  twitter: {
    type: String,
    default: ""
  },
  website: {
    type: String,
    default: ""
  },
  phone: {
    type: String,
    default: ""
  },
  interests: {
    type: [String],
    default: ["🎮 Gaming", "🎤 Singing", "🎬 Entertainment", "💻 Coding"]
  }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
