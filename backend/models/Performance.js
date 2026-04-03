const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  assessmentName: { type: String, required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Performance', performanceSchema);
