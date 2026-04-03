const mongoose = require('mongoose');

const adminTeacherRemarkSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  body: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('AdminTeacherRemark', adminTeacherRemarkSchema);
