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
    default: "Nir P Esh"
  },
  avatar: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
