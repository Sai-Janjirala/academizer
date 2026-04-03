const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String, default: 'General' },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }]
});

teacherSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  if (!this.password) return;
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('Teacher', teacherSchema);
