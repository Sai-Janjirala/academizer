const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  lectureNumber: { type: Number, required: true, default: 1 },
  sessionDate: { type: Date, required: true },
  subject: { type: String, default: '' },
  teacherSubnet24: { type: String, required: true },
  sessionCode: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
