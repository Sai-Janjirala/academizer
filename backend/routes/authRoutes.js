const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { signToken, authenticate } = require('../middleware/auth');

const router = express.Router();

const ADMIN_SIGNUP_SECRET = process.env.ADMIN_SIGNUP_SECRET || 'academizer-dev-admin-secret';

const buildTokenPayload = (user) => ({
  sub: user._id.toString(),
  role: user.role,
  studentId: user.studentProfile ? user.studentProfile.toString() : undefined,
  teacherId: user.teacherProfile ? user.teacherProfile.toString() : undefined,
  adminId: user.adminProfile ? user.adminProfile.toString() : undefined
});

const ensureTeacherProfile = async (userDoc, plainPassword = '') => {
  if (!userDoc || userDoc.role !== 'teacher') return null;

  let teacher = userDoc.teacherProfile ? await Teacher.findById(userDoc.teacherProfile) : null;

  if (!teacher) {
    teacher = await Teacher.findOne({ email: String(userDoc.email).toLowerCase().trim() });
  }

  if (!teacher) {
    teacher = await Teacher.create({
      name: String(userDoc.email).split('@')[0],
      email: String(userDoc.email).toLowerCase().trim(),
      password: plainPassword || crypto.randomBytes(16).toString('hex'),
      department: 'General'
    });
  }

  if (!userDoc.teacherProfile || userDoc.teacherProfile.toString() !== teacher._id.toString()) {
    userDoc.teacherProfile = teacher._id;
    await userDoc.save();
  }

  return teacher;
};

const publicUserShape = async (userDoc) => {
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  let displayName = user.email;
  if (user.role === 'student' && user.studentProfile) {
    const s = await Student.findById(user.studentProfile).select('name registrationId classId');
    if (s) displayName = s.name;
    user.profile = s;
  } else if (user.role === 'teacher' && user.teacherProfile) {
    const t = await Teacher.findById(user.teacherProfile).select('name email department');
    if (t) displayName = t.name;
    user.profile = t;
  } else if (user.role === 'admin' && user.adminProfile) {
    const a = await Admin.findById(user.adminProfile).select('name');
    if (a) displayName = a.name;
    user.profile = a;
  }
  user.displayName = displayName;
  return user;
};

router.post('/register', async (req, res) => {
  try {
    const { role, email, password, name, department, registrationId, adminSecret } = req.body;
    if (!email || !password || !role) return res.status(400).json({ error: 'email, password, and role are required' });
    const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    if (role === 'teacher') {
      if (!name) return res.status(400).json({ error: 'name is required' });
      const teacher = await Teacher.create({
        name: String(name).trim(),
        email: String(email).toLowerCase().trim(),
        password: String(password),
        department: department ? String(department).trim() : 'General'
      });
      const user = await User.create({
        email: String(email).toLowerCase().trim(),
        password: String(password),
        role: 'teacher',
        teacherProfile: teacher._id
      });
      const token = signToken(buildTokenPayload(user));
      return res.status(201).json({ token, user: await publicUserShape(user) });
    }

    if (role === 'student') {
      if (!registrationId) return res.status(400).json({ error: 'registrationId (roll ID) is required' });
      const student = await Student.findOne({ registrationId: String(registrationId).trim() });
      if (!student) {
        return res.status(400).json({
          error: 'We could not find that roll number. Ask your teacher to add you to Class Data first, then sign up.'
        });
      }
      const linked = await User.findOne({ studentProfile: student._id });
      if (linked) return res.status(400).json({ error: 'An account already exists for this student record' });
      const user = await User.create({
        email: String(email).toLowerCase().trim(),
        password: String(password),
        role: 'student',
        studentProfile: student._id
      });
      const token = signToken(buildTokenPayload(user));
      return res.status(201).json({ token, user: await publicUserShape(user) });
    }

    if (role === 'admin') {
      if (adminSecret !== ADMIN_SIGNUP_SECRET) {
        return res.status(403).json({ error: 'Invalid admin enrollment key. Ask your institution for the signup key.' });
      }
      if (!name) return res.status(400).json({ error: 'name is required' });
      const admin = await Admin.create({ name: String(name).trim() });
      const user = await User.create({
        email: String(email).toLowerCase().trim(),
        password: String(password),
        role: 'admin',
        adminProfile: admin._id
      });
      const token = signToken(buildTokenPayload(user));
      return res.status(201).json({ token, user: await publicUserShape(user) });
    }

    return res.status(400).json({ error: 'Invalid role' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
    await ensureTeacherProfile(user, password);
    const token = signToken(buildTokenPayload(user));
    const lean = user.toObject();
    delete lean.password;
    res.json({ token, user: await publicUserShape(lean) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.auth.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await ensureTeacherProfile(user);
    res.json({ user: await publicUserShape(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
