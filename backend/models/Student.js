const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  registrationId: { type: String, required: true, unique: true },
  batch: { type: String, required: true },
  marks: [{
    subject: { type: String, required: true },
    semester: { type: String, default: '' },
    score: { type: Number, min: 0, max: 100, required: true }
  }],
  attendance: { type: Number, min: 0, max: 100, default: 0 },
  qualities: {
    participation: { type: Number, min: 1, max: 10, default: 5 },
    discipline: { type: Number, min: 1, max: 10, default: 5 },
    teamwork: { type: Number, min: 1, max: 10, default: 5 },
    creativity: { type: Number, min: 1, max: 10, default: 5 }
  },
  /** Hashed PIN for student portal login (optional until set). */
  loginPinHash: { type: String, default: '' },
  /** 128-d face recognition descriptor from face-api.js */
  faceDescriptor: { type: [Number], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
