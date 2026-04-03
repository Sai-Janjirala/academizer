const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, default: Date.now },
  lectureNumber: { type: Number, default: 1 },
  subject: { type: String, default: '' },
  records: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    status: { type: String, enum: ['Present', 'Absent', 'Leave'], default: 'Present' }
  }]
});

module.exports = mongoose.model('Attendance', attendanceSchema);
