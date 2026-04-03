const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  className: { type: String, required: true },
  subject: { type: String, default: '' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  courseName: { type: String, required: true },
  courseCode: { type: String, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  subjects: [{ type: String }],
  schedule: [{
    day: String,
    startTime: String,
    endTime: String,
    hall: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
