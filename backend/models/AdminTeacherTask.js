const mongoose = require('mongoose');

const adminTeacherTaskSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  dueDate: { type: Date },
  status: { type: String, enum: ['pending', 'done'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('AdminTeacherTask', adminTeacherTaskSchema);
