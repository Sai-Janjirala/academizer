const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model('Class', classSchema);
