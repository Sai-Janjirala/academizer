const express = require('express');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Assignment = require('../models/Assignment');
const StudentRemark = require('../models/StudentRemark');
const AdminTeacherTask = require('../models/AdminTeacherTask');
const AdminTeacherRemark = require('../models/AdminTeacherRemark');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const avg = (arr) => (arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : 0);
const studentAvg = (student) => avg((student.marks || []).map((m) => Number(m.score || 0)));

async function analyticsForClass(classId) {
  const students = await Student.find({ classId });
  const trend = students.map((s) => ({
    studentId: s._id,
    name: s.name,
    averageScore: studentAvg(s),
    attendance: Number(s.attendance || 0)
  }));
  return {
    studentCount: students.length,
    averageMarks: avg(trend.map((t) => t.averageScore)),
    attendanceRate: avg(trend.map((t) => t.attendance))
  };
}

// ---- Student (authenticated portal) ----

router.get('/my/report-card', authenticate, requireRole('student'), async (req, res) => {
  try {
    const student = await Student.findById(req.auth.studentId).populate('classId');
    if (!student) return res.status(404).json({ error: 'Student profile not found' });
    const cls = student.classId;
    res.json({
      student: {
        name: student.name,
        registrationId: student.registrationId,
        attendanceOverall: student.attendance,
        marks: student.marks || [],
        qualities: student.qualities || {}
      },
      class: cls
        ? {
            className: cls.className,
            courseName: cls.courseName,
            courseCode: cls.courseCode,
            subject: cls.subject
          }
        : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my/remarks', authenticate, requireRole('student'), async (req, res) => {
  try {
    const list = await StudentRemark.find({ studentId: req.auth.studentId })
      .sort({ createdAt: -1 })
      .populate('teacherId', 'name email')
      .populate('classId', 'className courseName');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my/assignments', authenticate, requireRole('student'), async (req, res) => {
  try {
    const student = await Student.findById(req.auth.studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const list = await Assignment.find({ classId: student.classId })
      .sort({ createdAt: -1 })
      .populate('teacherId', 'name')
      .populate('classId', 'courseName className');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my/timetable', authenticate, requireRole('student'), async (req, res) => {
  try {
    const student = await Student.findById(req.auth.studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const cls = await Class.findById(student.classId);
    if (!cls) return res.json({ schedule: [], message: 'No class timetable yet' });
    res.json({
      className: cls.className,
      courseName: cls.courseName,
      schedule: cls.schedule || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Teacher: assignments & remarks ----

router.post('/teacher/assignments', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { classId, title, description, dueDate } = req.body;
    if (!classId || !title) return res.status(400).json({ error: 'classId and title required' });
    const cls = await Class.findOne({ _id: classId, teacherId: req.auth.teacherId });
    if (!cls) return res.status(404).json({ error: 'Class not found or not yours' });
    const a = await Assignment.create({
      classId,
      teacherId: req.auth.teacherId,
      title: String(title).trim(),
      description: description ? String(description) : '',
      dueDate: dueDate ? new Date(dueDate) : undefined
    });
    res.status(201).json(a);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/teacher/assignments', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { classId } = req.query;
    const q = { teacherId: req.auth.teacherId };
    if (classId) q.classId = classId;
    const list = await Assignment.find(q).sort({ createdAt: -1 }).populate('classId', 'className courseName');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/teacher/remarks', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { studentId, classId, body } = req.body;
    if (!studentId || !classId || !body) return res.status(400).json({ error: 'studentId, classId, and body required' });
    const cls = await Class.findOne({ _id: classId, teacherId: req.auth.teacherId });
    if (!cls) return res.status(404).json({ error: 'Class not found or not yours' });
    const st = await Student.findOne({ _id: studentId, classId });
    if (!st) return res.status(404).json({ error: 'Student not in this class' });
    const r = await StudentRemark.create({
      studentId,
      classId,
      teacherId: req.auth.teacherId,
      body: String(body).trim()
    });
    res.status(201).json(r);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/teacher/students-for-remarks', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { classId } = req.query;
    if (!classId) return res.status(400).json({ error: 'classId required' });
    const cls = await Class.findOne({ _id: classId, teacherId: req.auth.teacherId });
    if (!cls) return res.status(404).json({ error: 'Class not found or not yours' });
    const students = await Student.find({ classId }).sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher: tasks & feedback from admin
router.get('/my/teacher-tasks', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const list = await AdminTeacherTask.find({ teacherId: req.auth.teacherId })
      .sort({ createdAt: -1 })
      .populate('adminId', 'name');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/my/teacher-tasks/:id', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const task = await AdminTeacherTask.findById(req.params.id);
    if (!task || task.teacherId.toString() !== req.auth.teacherId) {
      return res.status(404).json({ error: 'Task not found' });
    }
    if (req.body.status === 'done') task.status = 'done';
    if (req.body.status === 'pending') task.status = 'pending';
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my/admin-feedback', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const list = await AdminTeacherRemark.find({ teacherId: req.auth.teacherId })
      .sort({ createdAt: -1 })
      .populate('adminId', 'name');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Admin ----

router.get('/admin/teachers', authenticate, requireRole('admin'), async (_req, res) => {
  try {
    const teachers = await Teacher.find().select('name email department classes').populate('classes', 'className courseName');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/classes-overview', authenticate, requireRole('admin'), async (_req, res) => {
  try {
    const classes = await Class.find().populate('teacherId', 'name email').sort({ className: 1 });
    const out = await Promise.all(classes.map(async (c) => {
      const stats = await analyticsForClass(c._id);
      return {
        _id: c._id,
        className: c.className,
        courseName: c.courseName,
        courseCode: c.courseCode,
        teacher: c.teacherId,
        ...stats
      };
    }));
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/teacher-tasks', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { teacherId, title, description, dueDate } = req.body;
    if (!teacherId || !title) return res.status(400).json({ error: 'teacherId and title required' });
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    const task = await AdminTeacherTask.create({
      adminId: req.auth.adminId,
      teacherId,
      title: String(title).trim(),
      description: description ? String(description) : '',
      dueDate: dueDate ? new Date(dueDate) : undefined
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/teacher-tasks', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { teacherId } = req.query;
    const q = teacherId ? { teacherId } : {};
    const list = await AdminTeacherTask.find(q).sort({ createdAt: -1 }).populate('teacherId', 'name email').populate('adminId', 'name');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/teacher-remarks', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { teacherId, body } = req.body;
    if (!teacherId || !body) return res.status(400).json({ error: 'teacherId and body required' });
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    const r = await AdminTeacherRemark.create({
      adminId: req.auth.adminId,
      teacherId,
      body: String(body).trim()
    });
    res.status(201).json(r);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/teacher-remarks', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { teacherId } = req.query;
    const q = teacherId ? { teacherId } : {};
    const list = await AdminTeacherRemark.find(q).sort({ createdAt: -1 }).populate('teacherId', 'name').populate('adminId', 'name');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/classes/:classId/schedule', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { schedule } = req.body;
    if (!Array.isArray(schedule)) return res.status(400).json({ error: 'schedule array required' });
    const cls = await Class.findByIdAndUpdate(
      req.params.classId,
      { schedule },
      { new: true, runValidators: true }
    );
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    res.json(cls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/analytics/:classId', authenticate, requireRole('admin'), async (req, res) => {
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
    res.json({
      averageMarks: avg(trend.map((t) => t.averageScore)),
      topPerformer: sorted[0] || null,
      lowestPerformer: sorted[sorted.length - 1] || null,
      subjectWiseAverages,
      studentPerformanceTrends: trend,
      attendanceRate: avg(trend.map((t) => t.attendance))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
