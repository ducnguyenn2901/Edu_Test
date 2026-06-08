const Question = require('../models/Question');
const Exam = require('../models/Exam');
const Classroom = require('../models/Classroom');

exports.getDashboardStats = async (req, res) => {
  try {
    const teacherName = req.user.name;
    const teacherId = req.user._id.toString();

    const [totalQuestions, approvedQuestions, totalExams, recentQuestions, classrooms, teacher] =
      await Promise.all([
        Question.countDocuments({ author: teacherName }),
        Question.countDocuments({ author: teacherName, needsReview: { $ne: true } }),
        Exam.countDocuments({ createdBy: teacherId }),
        Question.find({ author: teacherName })
          .sort({ updatedAt: -1 })
          .limit(5)
          .populate('category'),
        Classroom.find({
          $or: [{ homeroomTeacher: teacherId }, { teachers: teacherId }],
        }),
        require('../models/User')
          .findById(teacherId)
          .select('students teachingGrades teachingClasses'),
      ]);

    // Count unique students across all classrooms and direct assignments
    const studentIds = new Set();
    classrooms.forEach((cls) => {
      if (cls && Array.isArray(cls.students)) {
        cls.students.forEach((id) => {
          if (id) studentIds.add(id.toString());
        });
      }
    });

    if (teacher && Array.isArray(teacher.students)) {
      teacher.students.forEach((id) => studentIds.add(id.toString()));
    }

    // Also include students that match teachingGrades/Classes
    if (teacher && (teacher.teachingGrades?.length || teacher.teachingClasses?.length)) {
      const scopeConditions = [];
      if (teacher.teachingGrades?.length)
        scopeConditions.push({ grade: { $in: teacher.teachingGrades } });
      if (teacher.teachingClasses?.length)
        scopeConditions.push({ className: { $in: teacher.teachingClasses } });

      const scopeStudents = await require('../models/User')
        .find({
          role: 'student',
          $or: scopeConditions,
        })
        .select('_id');

      scopeStudents.forEach((s) => studentIds.add(s._id.toString()));
    }

    // Monthly data for chart (last 6 months)
    const monthlyStats = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const [qCount, eCount] = await Promise.all([
        Question.countDocuments({
          author: teacherName,
          createdAt: { $gte: d, $lt: nextD },
        }),
        Exam.countDocuments({
          createdBy: teacherId,
          createdAt: { $gte: d, $lt: nextD },
        }),
      ]);

      monthlyStats.push({
        name: d.toLocaleString('vi-VN', { month: 'short' }),
        questions: qCount,
        exams: eCount,
      });
    }

    res.json({
      stats: {
        totalQuestions,
        approvedQuestions,
        sharedQuestions: 0,
        totalExams,
        totalClassrooms: classrooms.length,
        totalStudents: studentIds.size,
      },
      recentQuestions,
      monthlyStats,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
