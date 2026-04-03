const express = require('express');
const router = express.Router();

const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Performance = require('../models/Performance');

// Class Management (Teacher)
router.get('/classes', async (_req, res) => {
  try {
    const classes = await Class.find().populate('teacher').populate('students').sort({ courseName: 1 });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/classes', async (req, res) => {
  try {
    const { courseName, courseCode, teacherId } = req.body;

    let assignedTeacherId = teacherId;
    if (!assignedTeacherId) {
      const firstTeacher = await Teacher.findOne().sort({ createdAt: 1 });
      assignedTeacherId = firstTeacher?._id;
    }

    const newClass = new Class({
      courseName,
      courseCode,
      teacher: assignedTeacherId,
      students: [],
      subjects: [],
      schedule: []
    });

    await newClass.save();
    res.status(201).json({ message: 'Class created successfully', class: newClass });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/classes/:classId/subjects', async (req, res) => {
  try {
    const cls = await Class.findById(req.params.classId);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json(cls.subjects || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/classes/:classId/subjects', async (req, res) => {
  try {
    const { subject } = req.body;
    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    const cls = await Class.findById(req.params.classId);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const trimmed = subject.trim();
    if (!cls.subjects.includes(trimmed)) {
      cls.subjects.push(trimmed);
      await cls.save();
    }

    res.json({ message: 'Subject added successfully', subjects: cls.subjects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/classes/:classId/subjects', async (req, res) => {
  try {
    const { subject } = req.body;
    const cls = await Class.findById(req.params.classId);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    cls.subjects = (cls.subjects || []).filter((s) => s !== subject);
    await cls.save();
    res.json({ message: 'Subject removed successfully', subjects: cls.subjects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/classes/:classId/students', async (req, res) => {
  try {
    const cls = await Class.findById(req.params.classId).populate('students');
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json(cls.students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/classes/:classId/students', async (req, res) => {
  try {
    const cls = await Class.findById(req.params.classId);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const { name, registrationId, batch, qualities } = req.body;
    const student = new Student({
      name,
      registrationId,
      batch,
      qualities: {
        participation: qualities?.participation ?? 5,
        discipline: qualities?.discipline ?? 5,
        teamwork: qualities?.teamwork ?? 5,
        creativity: qualities?.creativity ?? 5
      }
    });

    await student.save();
    cls.students.push(student._id);
    await cls.save();

    res.status(201).json({ message: 'Student added to class successfully', student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Registration ID already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/classes/:classId/students/upload-json', async (req, res) => {
  try {
    const cls = await Class.findById(req.params.classId);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'students array is required' });
    }

    const createdStudents = [];
    for (const entry of students) {
      const student = new Student({
        name: entry.name,
        registrationId: entry.registrationId,
        batch: entry.batch,
        qualities: {
          participation: entry.qualities?.participation ?? 5,
          discipline: entry.qualities?.discipline ?? 5,
          teamwork: entry.qualities?.teamwork ?? 5,
          creativity: entry.qualities?.creativity ?? 5
        }
      });
      await student.save();
      cls.students.push(student._id);
      createdStudents.push(student);
    }

    await cls.save();
    res.status(201).json({ message: 'Students uploaded successfully', count: createdStudents.length });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'One or more registration IDs already exist' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/classes/:classId/students/:studentId', async (req, res) => {
  try {
    const cls = await Class.findById(req.params.classId);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const inClass = cls.students.some((id) => id.toString() === req.params.studentId);
    if (!inClass) {
      return res.status(404).json({ error: 'Student not found in this class' });
    }

    const { name, registrationId, batch, qualities } = req.body;
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.studentId,
      {
        ...(name && { name }),
        ...(registrationId && { registrationId }),
        ...(batch && { batch }),
        ...(qualities && {
          qualities: {
            participation: qualities.participation ?? 5,
            discipline: qualities.discipline ?? 5,
            teamwork: qualities.teamwork ?? 5,
            creativity: qualities.creativity ?? 5
          }
        })
      },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student profile updated successfully', student: updatedStudent });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Registration ID already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Student Management (Teacher CRUD)
router.get('/students', async (_req, res) => {
  try {
    const students = await Student.find().sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/students', async (req, res) => {
  try {
    const { name, registrationId, batch, qualities } = req.body;
    const student = new Student({
      name,
      registrationId,
      batch,
      qualities: {
        participation: qualities?.participation ?? 5,
        discipline: qualities?.discipline ?? 5,
        teamwork: qualities?.teamwork ?? 5,
        creativity: qualities?.creativity ?? 5
      }
    });
    await student.save();
    res.status(201).json({ message: 'Student created successfully', student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Registration ID already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/students/:studentId', async (req, res) => {
  try {
    const { name, registrationId, batch, qualities } = req.body;
    const updatePayload = {
      ...(name && { name }),
      ...(registrationId && { registrationId }),
      ...(batch && { batch }),
      ...(qualities && {
        qualities: {
          participation: qualities.participation ?? 5,
          discipline: qualities.discipline ?? 5,
          teamwork: qualities.teamwork ?? 5,
          creativity: qualities.creativity ?? 5
        }
      })
    };

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.studentId,
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student updated successfully', student: updatedStudent });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Registration ID already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/students', async (_req, res) => {
  try {
    await Student.deleteMany({});
    await Class.updateMany({}, { $set: { students: [] } });
    res.json({ message: 'All student records removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1. Timetable (Per Teacher)
router.get('/timetable/:teacherId', async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.params.teacherId }).populate('teacher');
    let schedule = [];
    classes.forEach(cls => {
      cls.schedule.forEach(slot => {
        schedule.push({
          courseName: cls.courseName,
          courseCode: cls.courseCode,
          ...slot._doc
        });
      });
    });
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Smart Attendance System
router.get('/attendance/:classId', async (req, res) => {
  try {
    const { lectureNumber, date } = req.query;
    const query = { classId: req.params.classId };

    if (lectureNumber) {
      query.lectureNumber = Number(lectureNumber);
    }
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
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
    const subject = req.body.subject || '';
    const selectedDate = req.body.date ? new Date(req.body.date) : new Date();
    const dateStart = new Date(selectedDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(selectedDate);
    dateEnd.setHours(23, 59, 59, 999);

    let attendance = await Attendance.findOne({
      classId: req.params.classId,
      lectureNumber,
      date: { $gte: dateStart, $lte: dateEnd }
    });

    if (attendance) {
      attendance.subject = subject;
      attendance.records = req.body.records;
      await attendance.save();
    } else {
      attendance = new Attendance({
        classId: req.params.classId,
        date: selectedDate,
        lectureNumber,
        subject,
        records: req.body.records
      });
      await attendance.save();
    }

    res.json({ message: 'Attendance saved successfully', attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Student Performance Dashboard
router.get('/students/:studentId/performance', async (req, res) => {
  try {
    const performances = await Performance.find({ studentId: req.params.studentId }).populate('classId');
    res.json(performances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. AI Report Card (Per Student)
router.get('/students/:studentId/report', async (req, res) => {
  try {
    // Collect data to generate mock AI report
    const performances = await Performance.find({ studentId: req.params.studentId });
    const attendanceRecords = await Attendance.find({ 'records.student': req.params.studentId });
    
    // Algorithmic Mock AI Report Logic
    let totalScore = 0; let totalMax = 0;
    performances.forEach(p => { totalScore += p.score; totalMax += p.maxScore; });
    
    const percentage = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(1) : 0;
    let aiSummary = `Student is performing at an average level of ${percentage}%. `;
    
    if (percentage > 85) aiSummary += "Excellent comprehension across subjects.";
    else if (percentage < 60) aiSummary += "Requires immediate academic intervention.";
    else aiSummary += "Consistent progress but has room for improvement.";

    res.json({
      studentId: req.params.studentId,
      overallGrade: percentage + '%',
      aiSummary: aiSummary,
      suggestedActions: ["Schedule 1-on-1 tutoring", "Review recent assignments"]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. AI Smart Insights (Dashboard)
router.get('/insights', async (req, res) => {
  try {
    // Generate static mockup insights for dashboard alerting
    const insights = {
      criticalAlerts: [
        { type: "Overdue", message: "Grade submission for 'Advanced Theoretical Physics' is 48h overdue." },
        { type: "Attendance Drop", message: "Critical drop detected for student Julian VANCE (3 consecutive absences)." }
      ],
      priorityActions: [
        { title: "Review Faculty Memo 102-B", timeline: "TODAY" },
        { title: "Approve Research Grant Apps", timeline: "OCT 26" }
      ]
    };
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
