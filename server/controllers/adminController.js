const User = require('../models/User');
const Question = require('../models/Question');
const Exam = require('../models/Exam');

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getStats = async (req, res) => {
  try {
    const { from, to } = req.query;
    let fromDate = null;
    let toDate = null;

    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) {
        fromDate = d;
      }
    }

    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        toDate = d;
      }
    }

    const rangeEnd = toDate || new Date();
    const rangeStart = fromDate || new Date(rangeEnd.getTime() - 29 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalTeachers, totalStudents, totalAdmins] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'admin' }),
    ]);

    const [totalQuestions, totalExams, examsWithAttempts] = await Promise.all([
      Question.countDocuments(),
      Exam.countDocuments(),
      Exam.find({ attempts: { $exists: true, $ne: [] } })
        .select('title subject grade createdBy attempts')
        .lean(),
    ]);

    const [questionsByDay, examsByDay, usersByDay] = await Promise.all([
      Question.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay(rangeStart), $lte: rangeEnd },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Exam.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay(rangeStart), $lte: rangeEnd },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay(rangeStart), $lte: rangeEnd },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const attempts = [];
    examsWithAttempts.forEach((exam) => {
      (exam.attempts || []).forEach((attempt) => {
        if (!attempt.submittedAt) {
          return;
        }
        const submittedAt = new Date(attempt.submittedAt);
        if (submittedAt < rangeStart || submittedAt > rangeEnd) {
          return;
        }
        attempts.push({
          examId: exam._id,
          examTitle: exam.title,
          subject: exam.subject,
          grade: exam.grade,
          teacherId: exam.createdBy,
          studentId: attempt.studentId, // Add this line
          score: attempt.score,
          submittedAt,
        });
      });
    });

    const studentIdSet = new Set(
      attempts.map((item) => item.studentId?.toString()).filter((id) => id),
    );

    const studentIds = Array.from(studentIdSet);

    const studentDocs = studentIds.length
      ? await User.find({ _id: { $in: studentIds } })
          .select('school grade className')
          .lean()
      : [];

    const studentMap = new Map(studentDocs.map((u) => [u._id.toString(), u]));

    const attemptsBySubject = attempts.reduce((acc, curr) => {
      const key = curr.subject || 'Khác';
      if (!acc[key]) {
        acc[key] = { count: 0, totalScore: 0 };
      }
      acc[key].count += 1;
      acc[key].totalScore += curr.score || 0;
      return acc;
    }, {});

    const attemptsByTeacher = attempts.reduce((acc, curr) => {
      const key = curr.teacherId || 'Khác';
      if (!acc[key]) {
        acc[key] = { count: 0, totalScore: 0 };
      }
      acc[key].count += 1;
      acc[key].totalScore += curr.score || 0;
      return acc;
    }, {});

    const attemptsByGrade = attempts.reduce((acc, curr) => {
      const student = studentMap.get(curr.studentId?.toString());
      const key = (student && student.grade) || 'Khác';
      if (!acc[key]) {
        acc[key] = { count: 0, totalScore: 0 };
      }
      acc[key].count += 1;
      acc[key].totalScore += curr.score || 0;
      return acc;
    }, {});

    const attemptsBySchool = attempts.reduce((acc, curr) => {
      const student = studentMap.get(curr.studentId?.toString());
      const key = (student && student.school) || 'Khác';
      if (!acc[key]) {
        acc[key] = { count: 0, totalScore: 0 };
      }
      acc[key].count += 1;
      acc[key].totalScore += curr.score || 0;
      return acc;
    }, {});

    const attemptsByClassName = attempts.reduce((acc, curr) => {
      const student = studentMap.get(curr.studentId?.toString());
      const key = (student && student.className) || 'Khác';
      if (!acc[key]) {
        acc[key] = { count: 0, totalScore: 0 };
      }
      acc[key].count += 1;
      acc[key].totalScore += curr.score || 0;
      return acc;
    }, {});

    const attemptsByDay = attempts.reduce((acc, curr) => {
      const d = curr.submittedAt;
      const key = d.toISOString().slice(0, 10);
      if (!acc[key]) {
        acc[key] = { date: key, count: 0, totalScore: 0 };
      }
      acc[key].count += 1;
      acc[key].totalScore += curr.score || 0;
      return acc;
    }, {});

    const attemptsByDayArray = Object.values(attemptsByDay).sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    const attemptsByWeek = attempts.reduce((acc, curr) => {
      const d = curr.submittedAt;
      const year = d.getFullYear();
      const firstDayOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = Math.floor((d - firstDayOfYear) / (24 * 60 * 60 * 1000));
      const week = Math.floor(pastDaysOfYear / 7) + 1;
      const key = `${year}-W${week}`;

      if (!acc[key]) {
        acc[key] = { week: key, count: 0, totalScore: 0 };
      }
      acc[key].count += 1;
      acc[key].totalScore += curr.score || 0;
      return acc;
    }, {});

    const attemptsByWeekArray = Object.values(attemptsByWeek).sort((a, b) =>
      a.week.localeCompare(b.week),
    );

    const examsAggregated = attempts.reduce((acc, curr) => {
      const key = curr.examId.toString();
      if (!acc[key]) {
        acc[key] = {
          examId: curr.examId,
          title: curr.examTitle,
          subject: curr.subject,
          attempts: 0,
          totalScore: 0,
        };
      }
      acc[key].attempts += 1;
      acc[key].totalScore += curr.score || 0;
      return acc;
    }, {});

    const topExams = Object.values(examsAggregated)
      .map((item) => ({
        examId: item.examId,
        title: item.title,
        subject: item.subject,
        attempts: item.attempts,
        avgScore: item.attempts > 0 ? Number((item.totalScore / item.attempts).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 5);

    const heatmapBuckets = {};
    attempts.forEach((curr) => {
      const d = curr.submittedAt;
      const dayOfWeek = d.getDay();
      const hour = d.getHours();
      const key = `${dayOfWeek}-${hour}`;
      if (!heatmapBuckets[key]) {
        heatmapBuckets[key] = {
          dayOfWeek,
          hour,
          count: 0,
        };
      }
      heatmapBuckets[key].count += 1;
    });

    const attemptsHeatmap = Object.values(heatmapBuckets);

    res.json({
      users: {
        total: totalUsers,
        teachers: totalTeachers,
        students: totalStudents,
        admins: totalAdmins,
        last30Days: usersByDay,
      },
      questions: {
        total: totalQuestions,
        last30Days: questionsByDay,
      },
      exams: {
        total: totalExams,
        last30Days: examsByDay,
      },
      attempts: {
        total: attempts.length,
        bySubject: attemptsBySubject,
        byGrade: attemptsByGrade,
        bySchool: attemptsBySchool,
        byClassName: attemptsByClassName,
        byTeacher: attemptsByTeacher,
        byDay: attemptsByDayArray,
        byWeek: attemptsByWeekArray,
        topExams,
        heatmap: attemptsHeatmap,
        range: {
          from: rangeStart.toISOString(),
          to: rangeEnd.toISOString(),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportAttempts = async (req, res) => {
  try {
    const { from, to, subject } = req.query;

    let fromDate = null;
    let toDate = null;

    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) {
        fromDate = d;
      }
    }

    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        toDate = d;
      }
    }

    const exams = await Exam.find({
      attempts: { $exists: true, $ne: [] },
      ...(subject ? { subject } : {}),
    })
      .select('title subject grade attempts')
      .lean();

    const rows = [];

    exams.forEach((exam) => {
      (exam.attempts || []).forEach((attempt) => {
        if (!attempt.submittedAt) {
          return;
        }
        const submittedAt = new Date(attempt.submittedAt);
        if (fromDate && submittedAt < fromDate) {
          return;
        }
        if (toDate && submittedAt > toDate) {
          return;
        }
        rows.push({
          examTitle: exam.title,
          subject: exam.subject,
          grade: exam.grade || '',
          studentId: attempt.studentId,
          score: typeof attempt.score === 'number' ? attempt.score : '',
          correctCount: typeof attempt.correctCount === 'number' ? attempt.correctCount : '',
          totalQuestions: typeof attempt.totalQuestions === 'number' ? attempt.totalQuestions : '',
          timeSpentSeconds: typeof attempt.timeSpent === 'number' ? attempt.timeSpent : '',
          submittedAt: submittedAt.toISOString(),
        });
      });
    });

    rows.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

    const header = [
      'Exam Title',
      'Subject',
      'Grade',
      'Student ID',
      'Score',
      'Correct Count',
      'Total Questions',
      'Time Spent (seconds)',
      'Submitted At',
    ];

    const escapeCsv = (value) => {
      if (value === null || value === undefined) {
        return '';
      }
      const str = String(value);
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvLines = [
      header.join(','),
      ...rows.map((row) =>
        [
          row.examTitle,
          row.subject,
          row.grade,
          row.studentId,
          row.score,
          row.correctCount,
          row.totalQuestions,
          row.timeSpentSeconds,
          row.submittedAt,
        ]
          .map(escapeCsv)
          .join(','),
      ),
    ];

    const csvContent = csvLines.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="attempts_export.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStats, exportAttempts };
