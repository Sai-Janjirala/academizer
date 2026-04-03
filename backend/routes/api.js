const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'academizer-dev-jwt-change-me';

const optionalTeacherFilter = async (req) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return {};
  try {
    const decoded = jwt.verify(h.slice(7), JWT_SECRET);
    if (decoded.role !== 'teacher') return {};

    if (decoded.teacherId) {
      const teacher = await Teacher.findById(decoded.teacherId).select('_id');
      if (teacher) return { teacherId: teacher._id };
    }

    if (decoded.sub) {
      const user = await User.findById(decoded.sub);
      if (user?.teacherProfile) {
        const teacher = await Teacher.findById(user.teacherProfile).select('_id');
        if (teacher) return { teacherId: teacher._id };
      }

      if (user?.email) {
        const teacherByEmail = await Teacher.findOne({
          email: String(user.email).toLowerCase().trim()
        }).select('_id');

        if (teacherByEmail) {
          if (!user.teacherProfile || user.teacherProfile.toString() !== teacherByEmail._id.toString()) {
            user.teacherProfile = teacherByEmail._id;
            await user.save();
          }
          return { teacherId: teacherByEmail._id };
        }
      }
    }
  } catch {
    /* public access */
  }
  return {};
};
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Performance = require('../models/Performance');
const AttendanceSession = require('../models/AttendanceSession');
const { getClientIp, subnetPrefix24 } = require('../utils/clientNetwork');

const getOrCreateDefaultTeacher = async () => {
  let teacher = await Teacher.findOne().sort({ createdAt: 1 });
  if (!teacher) {
    teacher = await Teacher.create({
      name: 'Default Teacher',
      email: 'teacher@academizer.local',
      password: 'teacher123',
      department: 'General'
    });
  }
  return teacher;
};

const avg = (arr) => (arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : 0);
const studentAvg = (student) => avg((student.marks || []).map((m) => Number(m.score || 0)));

const FACE_MATCH_THRESHOLD = 0.55;

const euclideanFaceDistance = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = Number(a[i]) - Number(b[i]);
    sum += d * d;
  }
  return Math.sqrt(sum);
};

const hashStudentPin = async (plain) => {
  if (!plain || String(plain).length < 4) return null;
  return bcrypt.hash(String(plain), 10);
};

const verifyStudentPin = async (student, pin) => {
  if (!student?.loginPinHash) return { ok: false, error: 'PIN not set for this student. Ask your teacher to set a PIN in Class Data.' };
  const match = await bcrypt.compare(String(pin), student.loginPinHash);
  return match ? { ok: true } : { ok: false, error: 'Invalid PIN' };
};

const normalizeMarks = (marks, fallbackSemester = '') => {
  if (Array.isArray(marks)) {
    return marks
      .filter((mark) => mark && mark.subject)
      .map((mark) => ({
        subject: String(mark.subject).trim(),
        semester: String(mark.semester || fallbackSemester || '').trim(),
        score: Number(mark.score || 0)
      }));
  }

  if (marks && typeof marks === 'object') {
    return Object.entries(marks).map(([subject, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return {
          subject: String(subject).trim(),
          semester: String(value.semester || fallbackSemester || '').trim(),
          score: Number(value.score || 0)
        };
      }

      return {
        subject: String(subject).trim(),
        semester: String(fallbackSemester || '').trim(),
        score: Number(value || 0)
      };
    });
  }

  return [];
};

const syncClassSubjects = async (classId, marks = []) => {
  const subjects = [...new Set(
    (marks || [])
      .map((mark) => String(mark.subject || '').trim())
      .filter(Boolean)
  )];

  if (subjects.length > 0) {
    await Class.findByIdAndUpdate(classId, { $addToSet: { subjects: { $each: subjects } } });
  }
};

// Class APIs
router.post('/classes', async (req, res) => {
  try {
    const authTeacherFilter = await optionalTeacherFilter(req);
    const teacherId = req.body.teacherId || authTeacherFilter.teacherId;
    const teacher = teacherId ? await Teacher.findById(teacherId) : await getOrCreateDefaultTeacher();
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    const className = req.body.className || req.body.courseName;
    const subject = req.body.subject || '';
    const courseCode = req.body.courseCode || className;

    const created = await Class.create({
      className,
      subject,
      teacherId: teacher._id,
      courseName: className,
      courseCode,
      teacher: teacher._id,
      students: [],
      subjects: subject ? [subject] : [],
      schedule: []
    });
    await Teacher.findByIdAndUpdate(teacher._id, { $addToSet: { classes: created._id } });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/classes', async (req, res) => {
  try {
    let query = { ...(await optionalTeacherFilter(req)) };
    if (req.query.teacherId) query = { teacherId: req.query.teacherId };
    const classes = await Class.find(query).populate('students').sort({ className: 1 });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/classes/:id', async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id).populate('students');
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    res.json(cls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/classes/:id', async (req, res) => {
  try {
    const payload = {
      ...(req.body.className && { className: req.body.className, courseName: req.body.className }),
      ...(req.body.subject !== undefined && { subject: req.body.subject }),
      ...(req.body.courseCode && { courseCode: req.body.courseCode })
    };
    const updated = await Class.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Class not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/classes/:id', async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    await Student.deleteMany({ classId: cls._id });
    await Teacher.updateMany({}, { $pull: { classes: cls._id } });
    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/classes/:id/students', async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    const deleted = await Student.deleteMany({ classId: cls._id });
    cls.students = [];
    await cls.save();

    res.json({
      message: 'Class student data cleared successfully',
      deletedCount: deleted.deletedCount || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Subject options for attendance
router.get('/classes/:classId/subjects', async (req, res) => {
  const cls = await Class.findById(req.params.classId);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  res.json(cls.subjects || []);
});

router.post('/classes/:classId/subjects', async (req, res) => {
  const cls = await Class.findById(req.params.classId);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  const subject = (req.body.subject || '').trim();
  if (!subject) return res.status(400).json({ error: 'Subject is required' });
  if (!cls.subjects.includes(subject)) cls.subjects.push(subject);
  await cls.save();
  res.json({ subjects: cls.subjects });
});

router.delete('/classes/:classId/subjects', async (req, res) => {
  const cls = await Class.findById(req.params.classId);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  cls.subjects = (cls.subjects || []).filter((s) => s !== req.body.subject);
  await cls.save();
  res.json({ subjects: cls.subjects });
});

// Student APIs
router.post('/students', async (req, res) => {
  try {
    const { name, rollNumber, classId, attendance, marks, registrationId, batch, qualities, semester, loginPin } = req.body;
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    const normalizedMarks = normalizeMarks(marks, semester);
    const loginPinHash = loginPin ? await hashStudentPin(loginPin) : '';
    if (loginPin && !loginPinHash) return res.status(400).json({ error: 'PIN must be at least 4 characters' });
    const student = await Student.create({
      name,
      rollNumber: rollNumber || registrationId,
      classId,
      registrationId: registrationId || rollNumber,
      batch: batch || cls.className,
      marks: normalizedMarks,
      attendance: Number(attendance || 0),
      loginPinHash: loginPinHash || '',
      qualities: {
        participation: qualities?.participation ?? 5,
        discipline: qualities?.discipline ?? 5,
        teamwork: qualities?.teamwork ?? 5,
        creativity: qualities?.creativity ?? 5
      }
    });
    await Class.findByIdAndUpdate(classId, { $addToSet: { students: student._id } });
    await syncClassSubjects(classId, normalizedMarks);
    res.status(201).json(student);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Roll/registration must be unique' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/students/:id', async (req, res) => {
  try {
    const normalizedMarks = req.body.marks ? normalizeMarks(req.body.marks, req.body.semester) : undefined;
    let loginPinHashUpd;
    if (req.body.loginPin !== undefined && req.body.loginPin !== '') {
      loginPinHashUpd = await hashStudentPin(req.body.loginPin);
      if (!loginPinHashUpd) return res.status(400).json({ error: 'PIN must be at least 4 characters' });
    }
    const payload = {
      ...(req.body.name && { name: req.body.name }),
      ...(req.body.rollNumber && { rollNumber: req.body.rollNumber, registrationId: req.body.rollNumber }),
      ...(req.body.attendance !== undefined && { attendance: Number(req.body.attendance) }),
      ...(normalizedMarks && { marks: normalizedMarks }),
      ...(req.body.batch && { batch: req.body.batch }),
      ...(req.body.qualities && { qualities: req.body.qualities }),
      ...(loginPinHashUpd && { loginPinHash: loginPinHashUpd })
    };
    const updated = await Student.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Student not found' });
    if (normalizedMarks) await syncClassSubjects(updated.classId, normalizedMarks);
    res.json(updated);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Roll/registration must be unique' });
    res.status(500).json({ error: err.message });
  }
});

router.get('/students', async (req, res) => {
  try {
    const h = req.headers.authorization;
    if (h?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(h.slice(7), JWT_SECRET);
        if (decoded.role === 'teacher' && decoded.teacherId) {
          const classes = await Class.find({ teacherId: decoded.teacherId }).select('_id');
          const classIds = classes.map((c) => c._id);
          const students = await Student.find({ classId: { $in: classIds } }).sort({ name: 1 });
          return res.json(students);
        }
      } catch {
        /* fall through */
      }
    }
    const students = await Student.find().sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/students/:id', async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  await Class.updateMany({}, { $pull: { students: student._id } });
  res.json({ message: 'Student removed successfully' });
});

router.get('/students/class/:classId', async (req, res) => {
  const students = await Student.find({ classId: req.params.classId }).sort({ name: 1 });
  res.json(students);
});

// Compatibility endpoints
router.get('/classes/:classId/students', async (req, res) => {
  const students = await Student.find({ classId: req.params.classId }).sort({ name: 1 });
  res.json(students);
});

router.post('/classes/:classId/students', async (req, res) => {
  req.body.classId = req.params.classId;
  return router.stack.find((r) => r.route?.path === '/students' && r.route?.methods?.post).route.stack[0].handle(req, res);
});

router.put('/classes/:classId/students/:studentId', async (req, res) => {
  const student = await Student.findOne({ _id: req.params.studentId, classId: req.params.classId });
  if (!student) return res.status(404).json({ error: 'Student not found in this class' });
  req.params.id = req.params.studentId;
  req.body.rollNumber = req.body.registrationId || req.body.rollNumber;
  return router.stack.find((r) => r.route?.path === '/students/:id' && r.route?.methods?.put).route.stack[0].handle(req, res);
});

router.post('/classes/:classId/students/upload-json', async (req, res) => {
  try {
    const cls = await Class.findById(req.params.classId);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    const items = req.body.students;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'students array is required' });

    for (const entry of items) {
      const normalizedMarks = normalizeMarks(entry.marks, entry.semester);
      const student = await Student.create({
        name: entry.name,
        rollNumber: entry.rollNumber || entry.registrationId,
        classId: cls._id,
        registrationId: entry.registrationId || entry.rollNumber,
        batch: entry.batch || cls.className,
        marks: normalizedMarks,
        attendance: Number(entry.attendance || 0),
        qualities: {
          participation: entry.qualities?.participation ?? 5,
          discipline: entry.qualities?.discipline ?? 5,
          teamwork: entry.qualities?.teamwork ?? 5,
          creativity: entry.qualities?.creativity ?? 5
        }
      });
      cls.students.push(student._id);
      normalizedMarks.forEach((mark) => {
        if (mark.subject && !cls.subjects.includes(mark.subject)) cls.subjects.push(mark.subject);
      });
    }
    await cls.save();
    res.status(201).json({ message: 'Students uploaded successfully', count: items.length });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'One or more roll/registration IDs already exist' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/students', async (_req, res) => {
  await Student.deleteMany({});
  await Class.updateMany({}, { $set: { students: [] } });
  res.json({ message: 'All student records removed' });
});

// Analytics API
router.get('/analytics/class/:classId', async (req, res) => {
  try {
    const students = await Student.find({ classId: req.params.classId });
    const trend = students.map((s) => ({ studentId: s._id, name: s.name, averageScore: studentAvg(s), attendance: Number(s.attendance || 0) }));
    const sorted = [...trend].sort((a, b) => b.averageScore - a.averageScore);
    const subjectMap = {};
    students.forEach((s) => (s.marks || []).forEach((m) => {
      if (!subjectMap[m.subject]) subjectMap[m.subject] = [];
      subjectMap[m.subject].push(Number(m.score || 0));
    }));

    const subjectWiseAverages = Object.entries(subjectMap).map(([subject, scores]) => ({ subject, average: avg(scores) }));
    const gradeDistribution = [
      { grade: 'A', count: trend.filter((t) => t.averageScore >= 85).length },
      { grade: 'B', count: trend.filter((t) => t.averageScore >= 70 && t.averageScore < 85).length },
      { grade: 'C', count: trend.filter((t) => t.averageScore >= 55 && t.averageScore < 70).length },
      { grade: 'D', count: trend.filter((t) => t.averageScore < 55).length }
    ];

    res.json({
      averageMarks: avg(trend.map((t) => t.averageScore)),
      topPerformer: sorted[0] || null,
      lowestPerformer: sorted[sorted.length - 1] || null,
      subjectWiseAverages,
      studentPerformanceTrends: trend,
      attendanceRate: avg(trend.map((t) => t.attendance)),
      gradeDistribution
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Existing app endpoints
router.get('/timetable/:teacherId', async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.params.teacherId }).populate('teacher');
    const schedule = [];
    classes.forEach((cls) => cls.schedule.forEach((slot) => schedule.push({ courseName: cls.courseName, courseCode: cls.courseCode, ...slot._doc })));
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/attendance/:classId', async (req, res) => {
  try {
    const query = { classId: req.params.classId };
    if (req.query.lectureNumber) query.lectureNumber = Number(req.query.lectureNumber);
    if (req.query.date) {
      const start = new Date(req.query.date);
      const end = new Date(req.query.date);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }
    const attendance = await Attendance.findOne(query).populate('records.student').sort({ date: -1 });
    res.json(attendance || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/attendance/:classId/mark', async (req, res) => {
  try {
    const lectureNumber = Number(req.body.lectureNumber || 1);
    const selectedDate = req.body.date ? new Date(req.body.date) : new Date();
    const dateStart = new Date(selectedDate); dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(selectedDate); dateEnd.setHours(23, 59, 59, 999);
    let attendance = await Attendance.findOne({ classId: req.params.classId, lectureNumber, date: { $gte: dateStart, $lte: dateEnd } });
    if (!attendance) attendance = new Attendance({ classId: req.params.classId, lectureNumber, date: selectedDate });
    attendance.subject = req.body.subject || '';
    attendance.records = req.body.records || [];
    await attendance.save();
    res.json({ message: 'Attendance saved successfully', attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Automated attendance: lecture session + student face + same LAN (server IP /24) ----

router.post('/attendance-sessions/start', async (req, res) => {
  try {
    const { classId, lectureNumber, date, subject } = req.body;
    if (!classId) return res.status(400).json({ error: 'classId required' });
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    const lec = Number(lectureNumber || 1);
    const selectedDate = date ? new Date(date) : new Date();
    const dayStart = new Date(selectedDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate); dayEnd.setHours(23, 59, 59, 999);

    await AttendanceSession.deleteMany({
      classId,
      lectureNumber: lec,
      sessionDate: { $gte: dayStart, $lte: dayEnd }
    });

    const teacherIp = getClientIp(req);
    const teacherSubnet24 = subnetPrefix24(teacherIp);
    const sessionCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

    const session = await AttendanceSession.create({
      classId,
      lectureNumber: lec,
      sessionDate: selectedDate,
      subject: subject || '',
      teacherSubnet24,
      sessionCode,
      expiresAt
    });

    res.status(201).json({
      session,
      teacherSubnet24,
      hint: 'Students are allowed only if their device uses the same classroom Wi‑Fi subnet as yours (we compare LAN IP prefixes, not SSID names).'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/attendance-sessions/active', async (req, res) => {
  try {
    const { classId, lectureNumber, date } = req.query;
    if (!classId) return res.status(400).json({ error: 'classId required' });
    const lec = Number(lectureNumber || 1);
    const selectedDate = date ? new Date(date) : new Date();
    const dayStart = new Date(selectedDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate); dayEnd.setHours(23, 59, 59, 999);

    const session = await AttendanceSession.findOne({
      classId,
      lectureNumber: lec,
      sessionDate: { $gte: dayStart, $lte: dayEnd },
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    res.json(session || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/attendance-sessions/preview/:code', async (req, res) => {
  try {
    const session = await AttendanceSession.findOne({
      sessionCode: req.params.code.toUpperCase(),
      expiresAt: { $gt: new Date() }
    }).populate('classId', 'className courseName subject');
    if (!session) return res.status(404).json({ error: 'Invalid or expired session code' });
    const c = session.classId;
    res.json({
      classLabel: c?.className || c?.courseName || 'Class',
      subject: session.subject,
      lectureNumber: session.lectureNumber
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/student-auth/login', async (req, res) => {
  try {
    const { registrationId, pin, classId } = req.body;
    if (!registrationId || !pin) return res.status(400).json({ error: 'registrationId and pin required' });
    const query = { registrationId: String(registrationId).trim() };
    if (classId) query.classId = classId;
    const student = await Student.findOne(query);
    if (!student) return res.status(401).json({ error: 'Student not found' });
    const pinOk = await verifyStudentPin(student, pin);
    if (!pinOk.ok) return res.status(401).json({ error: pinOk.error });
    res.json({
      studentId: student._id,
      name: student.name,
      classId: student.classId,
      hasFaceProfile: Array.isArray(student.faceDescriptor) && student.faceDescriptor.length > 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/student-auth/register-face', async (req, res) => {
  try {
    const { studentId, registrationId, pin, faceDescriptor } = req.body;
    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length < 64) {
      return res.status(400).json({ error: 'Valid faceDescriptor array required' });
    }
    let student;
    if (studentId) {
      student = await Student.findById(studentId);
    } else if (registrationId && pin) {
      student = await Student.findOne({ registrationId: String(registrationId).trim() });
    }
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const pinOk = await verifyStudentPin(student, pin);
    if (!pinOk.ok) return res.status(401).json({ error: pinOk.error });
    student.faceDescriptor = faceDescriptor.map((n) => Number(n));
    await student.save();
    res.json({ message: 'Face profile saved. You can now mark attendance with face check.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/attendance/self-check', async (req, res) => {
  try {
    const { sessionCode, registrationId, pin, faceDescriptor } = req.body;
    if (!sessionCode || !registrationId || !pin || !faceDescriptor) {
      return res.status(400).json({ error: 'sessionCode, registrationId, pin, and faceDescriptor required' });
    }

    const session = await AttendanceSession.findOne({
      sessionCode: String(sessionCode).trim().toUpperCase(),
      expiresAt: { $gt: new Date() }
    });
    if (!session) return res.status(404).json({ error: 'Invalid or expired session code' });

    const studentSubnet = subnetPrefix24(getClientIp(req));
    if (studentSubnet !== session.teacherSubnet24) {
      return res.status(403).json({
        error: 'Network mismatch. Connect to the same classroom Wi‑Fi as your teacher and try again.',
        detail: { yourLanPrefix: studentSubnet, requiredPrefix: session.teacherSubnet24 }
      });
    }

    const registrationIdTrimmed = String(registrationId).trim();

    const student = await Student.findOne({
      registrationId: registrationIdTrimmed,
      classId: session.classId
    });

    if (!student) return res.status(404).json({ error: 'You are not enrolled in this class session' });

    const pinOk = await verifyStudentPin(student, pin);
    if (!pinOk.ok) return res.status(401).json({ error: pinOk.error });

    if (!student.faceDescriptor?.length) {
      return res.status(400).json({ error: 'Register your face once in the student portal before checking in.' });
    }

    const dist = euclideanFaceDistance(student.faceDescriptor, faceDescriptor);
    if (dist > FACE_MATCH_THRESHOLD) {
      return res.status(403).json({ error: 'Face did not match saved profile. Try again with better lighting.' });
    }

    const selectedDate = session.sessionDate;
    const dateStart = new Date(selectedDate); dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(selectedDate); dateEnd.setHours(23, 59, 59, 999);
    let attendance = await Attendance.findOne({
      classId: session.classId,
      lectureNumber: session.lectureNumber,
      date: { $gte: dateStart, $lte: dateEnd }
    });

    if (!attendance) {
      const allStudents = await Student.find({ classId: session.classId }).select('_id');
      attendance = new Attendance({
        classId: session.classId,
        lectureNumber: session.lectureNumber,
        date: selectedDate,
        subject: session.subject,
        records: allStudents.map((s) => ({ student: s._id, status: 'Absent' }))
      });
    }

    const sid = student._id.toString();
    const records = (attendance.records || []).map((r) => {
      const id = r.student?.toString?.() || String(r.student);
      if (id === sid) return { student: student._id, status: 'Present' };
      return { student: r.student, status: r.status };
    });

    const hasStudent = records.some((r) => (r.student?.toString?.() || String(r.student)) === sid);
    if (!hasStudent) records.push({ student: student._id, status: 'Present' });

    attendance.records = records;
    attendance.subject = session.subject || attendance.subject;
    await attendance.save();

    res.json({ message: 'Marked present for this lecture', attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/students/:studentId/performance', async (req, res) => {
  try {
    const performances = await Performance.find({ studentId: req.params.studentId }).populate('classId');
    res.json(performances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/students/:studentId/report', async (req, res) => {
  try {
    const performances = await Performance.find({ studentId: req.params.studentId });
    let totalScore = 0; let totalMax = 0;
    performances.forEach((p) => { totalScore += p.score; totalMax += p.maxScore; });
    const percentage = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(1) : 0;
    let aiSummary = `Student is performing at an average level of ${percentage}%. `;
    if (percentage > 85) aiSummary += 'Excellent comprehension across subjects.';
    else if (percentage < 60) aiSummary += 'Requires immediate academic intervention.';
    else aiSummary += 'Consistent progress but has room for improvement.';
    res.json({ studentId: req.params.studentId, overallGrade: `${percentage}%`, aiSummary, suggestedActions: ['Schedule 1-on-1 tutoring', 'Review recent assignments'] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/insights', async (_req, res) => {
  res.json({
    criticalAlerts: [
      { type: 'Overdue', message: "Grade submission for 'Advanced Theoretical Physics' is 48h overdue." },
      { type: 'Attendance Drop', message: 'Critical drop detected for a student (3 consecutive absences).' }
    ],
    priorityActions: [
      { title: 'Review Faculty Memo 102-B', timeline: 'TODAY' },
      { title: 'Approve Research Grant Apps', timeline: 'OCT 26' }
    ]
  });
});

module.exports = router;
