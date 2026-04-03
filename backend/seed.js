const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Teacher = require('./models/Teacher');
const Class = require('./models/Class');
const Student = require('./models/Student');
const User = require('./models/User');
const Admin = require('./models/Admin');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/academizer')
  .then(async () => {
    console.log('Connected to DB, dropping current collections...');
    await mongoose.connection.db.dropDatabase();

    const teacher1 = new Teacher({
      name: 'Dr. Aris Thorne',
      email: 'aris.thorne@academizer.edu',
      password: 'teacher123',
      department: 'Physics',
      classes: []
    });
    await teacher1.save();

    const class1 = new Class({
      className: '10A',
      subject: 'Physics',
      teacherId: teacher1._id,
      courseName: 'Advanced Theoretical Physics',
      courseCode: 'PHYS-401',
      teacher: teacher1._id,
      students: [],
      subjects: ['Physics'],
      schedule: [
        { day: 'Monday', startTime: '08:00', endTime: '09:30', hall: 'Hall C-12' },
        { day: 'Wednesday', startTime: '10:00', endTime: '11:30', hall: 'Lab 4' }
      ]
    });
    await class1.save();
    teacher1.classes.push(class1._id);
    await teacher1.save();

    const pinHash = await bcrypt.hash('123456', 10);
    const student1 = await Student.create({
      name: 'Alex Student',
      rollNumber: 'STU001',
      registrationId: 'STU001',
      classId: class1._id,
      batch: '10A',
      marks: [{ subject: 'Physics', semester: 'Semester 1', score: 88 }],
      attendance: 96,
      loginPinHash: pinHash
    });
    class1.students.push(student1._id);
    await class1.save();

    await User.create({
      email: 'aris.thorne@academizer.edu',
      password: 'teacher123',
      role: 'teacher',
      teacherProfile: teacher1._id
    });

    const admin = await Admin.create({ name: 'Campus Admin' });
    await User.create({
      email: 'admin@academizer.edu',
      password: 'admin123',
      role: 'admin',
      adminProfile: admin._id
    });

    await User.create({
      email: 'alex@academizer.edu',
      password: 'student123',
      role: 'student',
      studentProfile: student1._id
    });

    console.log('Seed completed. Try:');
    console.log('  Teacher: aris.thorne@academizer.edu / teacher123');
    console.log('  Admin:   admin@academizer.edu / admin123');
    console.log('  Student: alex@academizer.edu / student123 (roll STU001 for kiosk PIN 123456)');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });


  