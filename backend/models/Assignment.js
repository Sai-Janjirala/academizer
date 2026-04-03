const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  dueDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
