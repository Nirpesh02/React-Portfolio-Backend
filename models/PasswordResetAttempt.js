const mongoose = require('mongoose');

const passwordResetAttemptSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Success', 'Failed'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('PasswordResetAttempt', passwordResetAttemptSchema);
