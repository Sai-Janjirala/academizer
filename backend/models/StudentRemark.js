const mongoose = require('mongoose');

const studentRemarkSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  body: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('StudentRemark', studentRemarkSchema);
