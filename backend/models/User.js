const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
  studentProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  teacherProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  adminProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  if (!this.password) return;
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(String(plain), this.password);
};

module.exports = mongoose.model('User', userSchema);
