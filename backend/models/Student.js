const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registrationId: { type: String, required: true, unique: true },
  batch: { type: String, required: true },
  qualities: {
    participation: { type: Number, min: 1, max: 10, default: 5 },
    discipline: { type: Number, min: 1, max: 10, default: 5 },
    teamwork: { type: Number, min: 1, max: 10, default: 5 },
    creativity: { type: Number, min: 1, max: 10, default: 5 }
  }
});

module.exports = mongoose.model('Student', studentSchema);
