const mongoose = require('mongoose');
require('dotenv').config();

const Teacher = require('./models/Teacher');
const Class = require('./models/Class');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/academizer')
  .then(async () => {
    console.log('Connected to DB, dropping current collections...');
    await mongoose.connection.db.dropDatabase();

    // 1. Seed Teacher
    const teacher1 = new Teacher({ name: "Dr. Aris Thorne", email: "aris.thorne@academizer.edu", department: "Physics" });
    await teacher1.save();

    // 2. No student seed data: teachers will add students manually.

    // 3. Seed Class & Timetable Schedule
    const class1 = new Class({
      courseName: "Advanced Theoretical Physics",
      courseCode: "PHYS-401",
      teacher: teacher1._id,
      students: [],
      schedule: [
        { day: "Monday", startTime: "08:00", endTime: "09:30", hall: "Hall C-12" },
        { day: "Wednesday", startTime: "10:00", endTime: "11:30", hall: "Lab 4" }
      ]
    });
    await class1.save();

    console.log('Seed completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error("Seed error:", err);
    process.exit(1);
  });
