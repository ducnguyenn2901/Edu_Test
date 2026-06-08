const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Classroom = require('../models/Classroom');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const pdfParse = require('pdf-parse');

const MIN_QUESTIONS_FOR_PUBLISH = 5;

exports.getExams = async (req, res) => {
  try {
    const user = req.user;

    if (user && user.role === 'student') {
      const studentId = user._id?.toString();

      if (!studentId) {
        return res.status(401).json({ message: 'Không xác định được học sinh' });
      }

      const classrooms = await Classroom.find({
        students: studentId,
      }).select('_id');

      const classroomIds = classrooms.map((c) => c._id);

      const exams = await Exam.find({
        status: 'Published',
        $or: [
          { targetStudents: studentId },
          classroomIds.length ? { targetClasses: { $in: classroomIds } } : null,
          {
            $and: [
              { targetStudents: { $exists: true, $size: 0 } },
              { targetClasses: { $exists: true, $size: 0 } },
            ],
          },
        ].filter(Boolean),
      })
        .populate('questions')
        .sort({ createdAt: -1 });

      return res.json(exams);
    }

    const exams = await Exam.find().populate('questions').sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('questions');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const userRole = req.user?.role;
    const userId = req.user?._id?.toString();
    if (userRole === 'teacher') {
      const createdBy = exam.createdBy ? exam.createdBy.toString() : null;
      if (createdBy && userId && createdBy !== userId) {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập đề thi này.' });
      }
    }

    const mode = req.query.mode || 'default';
    const randomConfig = exam.randomConfig || {};

    if (mode === 'attempt' && randomConfig.enabled) {
      const filter = {};

      const targetSubject = randomConfig.subject || exam.subject;
      const targetGrade = randomConfig.grade || exam.grade;

      if (targetSubject) {
        filter.subject = { $regex: new RegExp(`^${targetSubject}$`, 'i') };
      }
      if (targetGrade) {
        filter.grade = { $regex: new RegExp(`^${targetGrade}$`, 'i') };
      }

      const difficulties =
        Array.isArray(randomConfig.difficulties) && randomConfig.difficulties.length > 0
          ? randomConfig.difficulties
          : null;

      if (difficulties) {
        filter.difficulty = { $in: difficulties };
      }

      if (randomConfig.category) {
        filter.category = randomConfig.category;
      }

      if (Array.isArray(randomConfig.tagFilters) && randomConfig.tagFilters.length > 0) {
        filter.tags = { $in: randomConfig.tagFilters };
      }

      let allCandidates = await Question.find(filter);

      // Fallback 1: If no candidates with specific filter, try relaxing subject/grade if they were provided
      if (allCandidates.length === 0) {
        const relaxedFilter = {};
        if (targetSubject) relaxedFilter.subject = { $regex: new RegExp(targetSubject, 'i') };
        if (targetGrade) relaxedFilter.grade = { $regex: new RegExp(targetGrade, 'i') };
        allCandidates = await Question.find(relaxedFilter);
      }

      const totalAvailable = allCandidates.length;

      if (!totalAvailable) {
        // Fallback 2: If still no candidates and fixed questions exist, use them
        if (exam.questions && exam.questions.length > 0) {
          return res.json(exam);
        }

        return res.status(400).json({
          message:
            'Không tìm thấy câu hỏi phù hợp trong ngân hàng câu hỏi. Vui lòng liên hệ giáo viên để kiểm tra lại cấu hình đề thi.',
        });
      }

      const desiredCount =
        typeof randomConfig.questionCount === 'number' && randomConfig.questionCount > 0
          ? randomConfig.questionCount
          : totalAvailable;

      const count = Math.min(desiredCount, totalAvailable);

      // Shuffle
      for (let i = allCandidates.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCandidates[i], allCandidates[j]] = [allCandidates[j], allCandidates[i]];
      }

      const chosen = allCandidates.slice(0, count);

      const payload = exam.toObject();
      payload.questions = chosen;

      return res.json(payload);
    }

    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyExams = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();

    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được người dùng' });
    }

    const exams = await Exam.find({ createdBy: userId })
      .populate('questions')
      .populate('folder')
      .sort({ createdAt: -1 });

    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createExam = async (req, res) => {
  const userId = req.user?._id?.toString();
  try {
    const payload = {
      ...req.body,
      createdBy: userId || req.body.createdBy,
    };

    if (payload.price !== undefined) {
      const parsedPrice = Number(payload.price);
      payload.price = Number.isFinite(parsedPrice) ? parsedPrice : 0;
    }

    const safeTargetClasses = Array.isArray(payload.targetClasses)
      ? payload.targetClasses.filter(Boolean)
      : [];
    const safeTargetStudents = Array.isArray(payload.targetStudents)
      ? payload.targetStudents.filter(Boolean)
      : [];

    payload.targetClasses = safeTargetClasses;
    payload.targetStudents = safeTargetStudents;

    const questionsArray = Array.isArray(payload.questions) ? payload.questions : [];

    if (questionsArray.length > 0 && !payload.grade) {
      const questions = await Question.find({
        _id: { $in: questionsArray },
      }).select('grade');

      const grades = Array.from(new Set(questions.map((q) => q.grade).filter(Boolean)));

      if (grades.length === 1) {
        payload.grade = grades[0];
      } else if (grades.length > 1) {
        payload.grade = 'Nhiều khối';
      }
    }

    const status = payload.status || 'Published';
    const isRandomEnabled = payload.randomConfig && payload.randomConfig.enabled;
    if (status === 'Published' && !isRandomEnabled) {
      if (questionsArray.length < MIN_QUESTIONS_FOR_PUBLISH) {
        return res.status(400).json({
          message: `Kỳ thi ở trạng thái Published phải có ít nhất ${MIN_QUESTIONS_FOR_PUBLISH} câu hỏi.`,
        });
      }
    }

    const exam = new Exam(payload);
    const newExam = await exam.save();
    res.status(201).json(newExam);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.createExamWithFiles = async (req, res) => {
  const userId = req.user?._id?.toString();
  try {
    // Parse examData from JSON string in FormData
    let examData = {};
    if (req.body.examData) {
      examData = JSON.parse(req.body.examData);
    } else {
      examData = req.body;
    }

    const payload = {
      ...examData,
      createdBy: userId || examData.createdBy,
    };

    if (payload.price !== undefined) {
      const parsedPrice = Number(payload.price);
      payload.price = Number.isFinite(parsedPrice) ? parsedPrice : 0;
    }

    // Process uploaded files
    if (req.files && req.files.length > 0) {
      payload.files = req.files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
      }));
    }

    const safeTargetClasses = Array.isArray(payload.targetClasses)
      ? payload.targetClasses.filter(Boolean)
      : [];
    const safeTargetStudents = Array.isArray(payload.targetStudents)
      ? payload.targetStudents.filter(Boolean)
      : [];

    payload.targetClasses = safeTargetClasses;
    payload.targetStudents = safeTargetStudents;

    const questionsArray = Array.isArray(payload.questions) ? payload.questions : [];

    if (questionsArray.length > 0 && !payload.grade) {
      const questions = await Question.find({
        _id: { $in: questionsArray },
      }).select('grade');

      const grades = Array.from(new Set(questions.map((q) => q.grade).filter(Boolean)));

      if (grades.length === 1) {
        payload.grade = grades[0];
      } else if (grades.length > 1) {
        payload.grade = 'Nhiều khối';
      }
    }

    const status = payload.status || 'Published';
    const isRandomEnabled = payload.randomConfig && payload.randomConfig.enabled;
    if (status === 'Published' && !isRandomEnabled) {
      if (questionsArray.length < MIN_QUESTIONS_FOR_PUBLISH) {
        return res.status(400).json({
          message: `Kỳ thi ở trạng thái Published phải có ít nhất ${MIN_QUESTIONS_FOR_PUBLISH} câu hỏi.`,
        });
      }
    }

    const exam = new Exam(payload);
    const newExam = await exam.save();
    res.status(201).json(newExam);
  } catch (err) {
    console.error('Error creating exam with files:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const nextStatus = req.body.status || exam.status || 'Draft';

    const nextRandomEnabled =
      (req.body.randomConfig && req.body.randomConfig.enabled) ??
      (exam.randomConfig && exam.randomConfig.enabled);

    if (nextStatus === 'Published' && !nextRandomEnabled) {
      const nextQuestions = Array.isArray(req.body.questions)
        ? req.body.questions
        : Array.isArray(exam.questions)
          ? exam.questions
          : [];

      if (nextQuestions.length < MIN_QUESTIONS_FOR_PUBLISH) {
        return res.status(400).json({
          message: `Kỳ thi ở trạng thái Published phải có ít nhất ${MIN_QUESTIONS_FOR_PUBLISH} câu hỏi.`,
        });
      }
    }

    const { targetClasses, targetStudents, ...rest } = req.body || {};

    if (rest.price !== undefined) {
      const parsedPrice = Number(rest.price);
      rest.price = Number.isFinite(parsedPrice) ? parsedPrice : 0;
    }

    Object.assign(exam, rest);

    if (Array.isArray(targetClasses)) {
      exam.targetClasses = targetClasses.filter(Boolean);
    }

    if (Array.isArray(targetStudents)) {
      exam.targetStudents = targetStudents.filter(Boolean);
    }
    const updatedExam = await exam.save();

    res.json(updatedExam);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json({ message: 'Exam deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cloneExam = async (req, res) => {
  try {
    const source = await Exam.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const userId = req.user?._id?.toString();

    const clone = await Exam.create({
      title: `${source.title} (Bản sao)`,
      subject: source.subject,
      duration: source.duration,
      startAt: null,
      endAt: null,
      description: source.description,
      questions: source.questions,
      categories: source.categories,
      status: 'Draft',
      maxAttempts: source.maxAttempts,
      tags: source.tags || [],
      createdBy: userId || source.createdBy,
      randomConfig: source.randomConfig,
      scoringConfig: source.scoringConfig,
      isTemplate: false,
    });

    res.status(201).json(clone);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTemplateFromExam = async (req, res) => {
  try {
    const source = await Exam.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const userId = req.user?._id?.toString();

    const template = await Exam.create({
      title: `${source.title} (Template)`,
      subject: source.subject,
      duration: source.duration,
      startAt: null,
      endAt: null,
      description: source.description,
      questions: source.questions,
      categories: source.categories,
      status: 'Draft',
      maxAttempts: source.maxAttempts,
      tags: source.tags || [],
      createdBy: userId || source.createdBy,
      randomConfig: source.randomConfig,
      scoringConfig: source.scoringConfig,
      isTemplate: true,
    });

    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyAttempts = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();

    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được người dùng' });
    }

    const exams = await Exam.find({ 'attempts.studentId': userId }).select(
      'title subject attempts',
    );

    const attempts = [];

    exams.forEach((exam) => {
      (exam.attempts || []).forEach((attempt) => {
        if (attempt.studentId === userId) {
          attempts.push({
            examId: exam._id,
            attemptId: attempt._id,
            title: exam.title,
            subject: exam.subject,
            score: attempt.score,
            correctCount: attempt.correctCount,
            totalQuestions: attempt.totalQuestions,
            timeSpent: attempt.timeSpent,
            submittedAt: attempt.submittedAt,
          });
        }
      });
    });

    attempts.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const userId = req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được người dùng' });
    }

    const { score, correctCount, totalQuestions, timeSpent, answers } = req.body || {};

    if (typeof score !== 'number' || Number.isNaN(score)) {
      return res.status(400).json({ message: 'Điểm không hợp lệ' });
    }

    const now = new Date();

    if (exam.startAt && now < exam.startAt) {
      return res.status(400).json({ message: 'Bài thi này chưa đến thời gian làm bài' });
    }

    if (exam.endAt && now > exam.endAt) {
      return res.status(400).json({ message: 'Bài thi này đã hết thời gian làm bài' });
    }

    const maxAttempts = exam.maxAttempts;
    if (typeof maxAttempts === 'number' && maxAttempts > 0) {
      const currentAttempts = (exam.attempts || []).filter((a) => a.studentId === userId).length;
      if (currentAttempts >= maxAttempts) {
        return res
          .status(400)
          .json({ message: 'Bạn đã đạt giới hạn số lần làm bài cho đề thi này' });
      }
    }

    const safeAnswers =
      Array.isArray(answers) && answers.length
        ? answers.map((a) => ({
            questionId: a.questionId,
            answerId: a.answerId,
          }))
        : [];

    const attempt = {
      studentId: userId,
      score,
      correctCount,
      totalQuestions,
      timeSpent,
      submittedAt: now,
      answers: safeAnswers,
    };

    exam.attempts = exam.attempts || [];
    exam.attempts.push(attempt);
    await exam.save();

    res.status(201).json(attempt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.flagExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const userId = req.user?._id?.toString();
    const role = req.user?.role || 'unknown';
    const { reason } = req.body || {};

    exam.flags = exam.flags || [];
    exam.flags.push({
      userId,
      role,
      reason: reason || '',
      createdAt: new Date(),
    });
    exam.needsReview = true;

    await exam.save();

    res.json({ message: 'Exam flagged for review' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reviewExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const { resolved } = req.body || {};
    if (resolved === true) {
      exam.needsReview = false;
    }

    await exam.save();

    res.json({ message: 'Exam review status updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getExamStats = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('questions');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const attempts = exam.attempts || [];
    const totalAttempts = attempts.length;

    let totalScore = 0;
    let passCount = 0;
    let totalTime = 0;

    const scoreBuckets = {
      '0-3': 0,
      '3-5': 0,
      '5-7': 0,
      '7-8.5': 0,
      '8.5-10': 0,
    };

    const questionStats = new Map();
    const questionMap = new Map();

    (exam.questions || []).forEach((q, index) => {
      const key = q._id.toString();
      questionMap.set(key, q);
      questionStats.set(key, {
        questionId: q._id,
        index: index + 1,
        content: q.content,
        subject: q.subject,
        grade: q.grade,
        category: q.category,
        difficulty: q.difficulty,
        correct: 0,
        total: 0,
      });
    });

    attempts.forEach((attempt) => {
      const score = typeof attempt.score === 'number' ? attempt.score : 0;
      totalScore += score;

      if (score >= 5) {
        passCount += 1;
      }

      totalTime += attempt.timeSpent || 0;

      if (score < 3) {
        scoreBuckets['0-3'] += 1;
      } else if (score < 5) {
        scoreBuckets['3-5'] += 1;
      } else if (score < 7) {
        scoreBuckets['5-7'] += 1;
      } else if (score < 8.5) {
        scoreBuckets['7-8.5'] += 1;
      } else {
        scoreBuckets['8.5-10'] += 1;
      }

      (attempt.answers || []).forEach((ans) => {
        if (!ans.questionId) {
          return;
        }
        const key = ans.questionId.toString();
        const stat = questionStats.get(key);
        const question = questionMap.get(key);
        if (!stat || !question) {
          return;
        }
        stat.total += 1;

        const answer = (question.answers || []).find((a) => a.id === ans.answerId);

        if (answer && answer.isCorrect) {
          stat.correct += 1;
        }
      });
    });

    const perQuestion = Array.from(questionStats.values()).map((stat) => {
      const correctRate = stat.total > 0 ? stat.correct / stat.total : null;
      const incorrectCount = stat.total > 0 ? Math.max(0, stat.total - stat.correct) : 0;
      const wrongRate = correctRate === null ? null : Math.max(0, 1 - correctRate);

      let difficultyFlag = null;
      if (correctRate !== null) {
        if (correctRate >= 0.9 && stat.total >= 5) {
          difficultyFlag = 'too_easy';
        } else if (correctRate <= 0.2 && stat.total >= 5) {
          difficultyFlag = 'too_hard';
        }
      }

      return {
        ...stat,
        incorrect: incorrectCount,
        correctRate,
        wrongRate,
        difficultyFlag,
      };
    });

    const averageScore = totalAttempts ? Number((totalScore / totalAttempts).toFixed(2)) : 0;

    const passRate = totalAttempts ? Number(((passCount / totalAttempts) * 100).toFixed(1)) : 0;
    const failCount = totalAttempts - passCount;
    const failRate = totalAttempts ? Number(((failCount / totalAttempts) * 100).toFixed(1)) : 0;

    const averageTimeSeconds = totalAttempts ? Math.round(totalTime / totalAttempts) : 0;

    res.json({
      exam: {
        id: exam._id,
        title: exam.title,
        subject: exam.subject,
        grade: exam.grade,
        duration: exam.duration,
        totalQuestions: (exam.questions || []).length,
      },
      stats: {
        totalAttempts,
        averageScore,
        passRate,
        failRate,
        passCount,
        failCount,
        averageTimeSeconds,
        scoreDistribution: Object.entries(scoreBuckets).map(([range, count]) => ({ range, count })),
        perQuestion,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyAttemptDetail = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được người dùng' });
    }

    const examId = req.params.id;
    const attemptId = req.params.attemptId;

    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const attempt = (exam.attempts || []).id(attemptId);

    if (!attempt || attempt.studentId !== userId) {
      return res.status(404).json({ message: 'Không tìm thấy bài làm' });
    }

    const questions =
      exam.questions?.map((q) => ({
        id: q._id,
        content: q.content,
        explanation: q.explanation || '',
        answers: (q.answers || []).map((a, idx) => ({
          id: String.fromCharCode(65 + idx),
          text: a.content,
          isCorrect: a.isCorrect,
        })),
      })) || [];

    res.json({
      exam: {
        id: exam._id,
        title: exam.title,
        subject: exam.subject,
        duration: exam.duration,
        questions,
      },
      attempt: {
        id: attempt._id,
        score: attempt.score,
        correctCount: attempt.correctCount,
        totalQuestions: attempt.totalQuestions,
        timeSpent: attempt.timeSpent,
        submittedAt: attempt.submittedAt,
        answers: attempt.answers || [],
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper function to parse exam file and return data
const parseExamFileHelper = async (file, body = {}) => {
  const fileName = file.originalname.toLowerCase();
  let parsedQuestions = [];
  let examInfo = {
    title: 'Đề thi mới',
    subject: body.subject || 'Chưa xác định',
    grade: body.grade || 'Chưa xác định',
    duration: 45,
  };

  let text = '';

  // Extract text based on file type
  if (fileName.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    text = result.value;
    console.log('DOCX extracted text:', text);
  } else if (fileName.endsWith('.pdf')) {
    try {
      const pdfData = await pdfParse(file.buffer);
      text = pdfData.text;
      console.log('PDF extracted text:', text);
    } catch (pdfErr) {
      console.error('PDF parse error:', pdfErr);
      throw new Error('Không thể đọc file PDF. Vui lòng kiểm tra file và thử lại.');
    }
  } else {
    throw new Error('Chỉ hỗ trợ file PDF và Word (.docx)');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('File không chứa nội dung. Vui lòng kiểm tra file.');
  }

  // First extract exam info from top of file
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i];
    if (/^ĐỀ KIỂM TRA|^ĐỀ THI/i.test(line)) {
      examInfo.title = line;
    } else if (/^Môn:/i.test(line)) {
      examInfo.subject = line.replace(/^Môn:\s*/i, '');
    } else if (/^Thời gian:|^Thời lượng:/i.test(line)) {
      const durationMatch = line.match(/(\d+)/);
      if (durationMatch) {
        examInfo.duration = Number(durationMatch[1]);
      }
    } else if (/^Khối:|^Lớp:/i.test(line)) {
      examInfo.grade = line.replace(/^(?:Khối|Lớp):\s*/i, '');
    } else if (/^(?:Câu\s*\d+|^\d+[\.\):])/i.test(line)) {
      // Stop when we reach first question
      break;
    }
  }

  // Now parse questions
  const questionBlocks = text.split(/(?=(?:Câu\s*\d+|^\d+[\.\):]))/m).filter((b) => b.trim());

  for (let i = 0; i < questionBlocks.length; i++) {
    const block = questionBlocks[i].trim();
    const qLines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (qLines.length < 1) continue;

    // Extract question content: collect all lines until first option (A/B/C/D)
    let questionContent = '';
    const answers = [];
    const answerPattern = /^([A-D])[\.\):]\s*(.*)/i;
    let firstAnswerIndex = -1;

    // Find first answer line
    for (let j = 0; j < qLines.length; j++) {
      if (answerPattern.test(qLines[j])) {
        firstAnswerIndex = j;
        break;
      }
    }

    // Collect question content - preserve line breaks
    for (let j = 0; j < (firstAnswerIndex === -1 ? qLines.length : firstAnswerIndex); j++) {
      let line = qLines[j];
      // Remove question number prefix from first line
      if (j === 0) {
        line = line.replace(/^(Câu\s*\d+[:\.]?|^\d+[\.\):])\s*/i, '').trim();
      }
      if (line) {
        questionContent += (questionContent ? '\n' : '') + line;
      }
    }

    // Collect answers
    for (let j = firstAnswerIndex; j < qLines.length; j++) {
      if (j === -1) break;
      const match = qLines[j].match(answerPattern);
      if (match) {
        const label = match[1].toUpperCase();
        let content = match[2].trim();
        let isCorrect = false;

        // Check if answer has asterisk or (Đúng) suffix
        if (content.endsWith('*') || content.includes('(Đúng)') || content.includes('(đúng)')) {
          isCorrect = true;
          content = content.replace(/\*|\(Đúng\)|\(đúng\)/g, '').trim();
        }

        answers.push({ id: label, content, isCorrect });
      }
    }

    if (questionContent) {
      // Auto-detect question type based on presence of ABCD options
      let questionType = 'Tự luận'; // Default to essay

      // If has 2-4 answers with A-D labels, it's multiple choice
      if (answers.length >= 2 && answers.length <= 4) {
        const answerLabels = answers.map((a) => a.id);
        // Check if answers are labeled A, B, C, D (in order)
        const expectedLabels = ['A', 'B', 'C', 'D'].slice(0, answers.length);
        if (JSON.stringify(answerLabels) === JSON.stringify(expectedLabels)) {
          questionType = 'Trắc nghiệm';
        }
      }

      // Check for True/False (Đúng/Sai) indicators
      const hasTrueFalseIndicators =
        answers.some((a) => ['Đúng', 'Sai', 'True', 'False'].includes(a.id)) ||
        questionContent.includes('Đúng/Sai');
      if (hasTrueFalseIndicators) {
        questionType = 'Đúng/Sai';
      }

      // Check for fill-in-the-blank (Điền từ) indicators
      if (
        questionContent.includes('________') ||
        questionContent.includes('[ ... ]') ||
        questionContent.includes('Điền từ')
      ) {
        questionType = 'Điền từ';
      }

      // If no correct answer marked and it's multiple choice, default first one
      if (questionType === 'Trắc nghiệm' && !answers.some((a) => a.isCorrect)) {
        answers[0].isCorrect = true;
      }

      parsedQuestions.push({
        id: `q-${Date.now()}-${i}`, // Temporary ID for editing
        content: questionContent,
        type: questionType,
        difficulty: 'Trung bình',
        subject: examInfo.subject,
        grade: examInfo.grade,
        answers: questionType === 'Trắc nghiệm' && answers.length >= 2 ? answers : undefined,
      });
    }
  }

  return { examInfo, questions: parsedQuestions };
};

// Endpoint to parse file without saving
exports.parseExamFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng tải lên file PDF hoặc Word (.docx)' });
    }
    const result = await parseExamFileHelper(req.file, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.importExam = async (req, res) => {
  try {
    const parseMaybeJson = (value) => {
      if (typeof value !== 'string') return value;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    };

    if (!req.file && !req.body?.questions) {
      return res.status(400).json({ message: 'Vui lòng tải lên file PDF hoặc Word (.docx)' });
    }

    const userId = req.user?._id?.toString();
    let examInfo;
    let parsedQuestions;

    if (req.file) {
      const result = await parseExamFileHelper(req.file, req.body);
      examInfo = result.examInfo;
      parsedQuestions = result.questions;
    } else {
      examInfo = parseMaybeJson(req.body.examInfo) || {};
      parsedQuestions = parseMaybeJson(req.body.questions) || [];
    }

    const safeExamInfo = {
      title: examInfo?.title || 'Đề thi mới',
      subject: examInfo?.subject || req.body?.subject || 'Chưa xác định',
      grade: examInfo?.grade || req.body?.grade || 'Chưa xác định',
      duration: Number(examInfo?.duration) || 45,
    };

    const questionArray = Array.isArray(parsedQuestions) ? parsedQuestions : [];
    const questionsToSave = questionArray
      .map((q) => {
        const answers = Array.isArray(q?.answers)
          ? q.answers.map((a) => ({
              id: a?.id,
              content: a?.content,
              contentImage: a?.contentImage,
              isCorrect: Boolean(a?.isCorrect),
            }))
          : undefined;

        return {
          content: q?.content,
          contentImage: q?.contentImage,
          type: q?.type,
          difficulty: q?.difficulty,
          subject: q?.subject || safeExamInfo.subject,
          grade: q?.grade || safeExamInfo.grade,
          answers,
          author: req.user?.name || 'Admin',
          authorId: userId,
          isInQuestionBank: false,
        };
      })
      .filter((q) => q && (q.content || q.contentImage));

    if (questionsToSave.length === 0) {
      return res.status(400).json({
        message: 'Không thể tìm thấy câu hỏi trong dữ liệu nhập. Vui lòng kiểm tra định dạng.',
      });
    }

    const savedQuestions = [];
    const errors = [];
    for (const qData of questionsToSave) {
      try {
        const question = new Question(qData);
        const newQuestion = await question.save();
        savedQuestions.push(newQuestion._id);
      } catch (err) {
        errors.push(`Lỗi lưu câu hỏi: ${err.message}`);
      }
    }

    // Now create the exam
    const exam = new Exam({
      title: safeExamInfo.title,
      subject: safeExamInfo.subject,
      grade: safeExamInfo.grade,
      duration: safeExamInfo.duration,
      questions: savedQuestions,
      categories: [],
      createdBy: userId,
      status: 'Published',
    });

    const newExam = await exam.save();

    res.status(201).json({
      message: 'Nhập đề thi thành công!',
      exam: newExam,
      savedQuestionsCount: savedQuestions.length,
      questionsType: {
        multipleChoice: questionsToSave.filter((q) => q.type === 'Trắc nghiệm').length,
        trueFalse: questionsToSave.filter((q) => q.type === 'Đúng/Sai').length,
        fillInTheBlank: questionsToSave.filter((q) => q.type === 'Điền từ').length,
        essay: questionsToSave.filter((q) => q.type === 'Tự luận').length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('Import exam error:', err);
    res.status(500).json({ message: `Lỗi: ${err.message}` });
  }
};

exports.getStudentDashboardStats = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const user = req.user;
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được người dùng' });
    }

    // 1. Get all exams that the student has participated in
    const examsWithAttempts = await Exam.find({ 'attempts.studentId': userId });

    let totalScore = 0;
    let totalAttemptsCount = 0;
    let totalTimeSpent = 0;
    const completedExamIds = new Set();
    const recentResults = [];

    examsWithAttempts.forEach((exam) => {
      const attempts = Array.isArray(exam.attempts) ? exam.attempts : [];
      const studentAttempts = attempts.filter((a) => a && a.studentId === userId);
      studentAttempts.forEach((attempt) => {
        if (!attempt) return;
        totalScore += attempt.score || 0;
        totalAttemptsCount++;
        totalTimeSpent += attempt.timeSpent || 0;
        completedExamIds.add(exam._id.toString());

        recentResults.push({
          id: attempt._id,
          examId: exam._id,
          title: exam.title,
          subject: exam.subject,
          score: attempt.score,
          submittedAt: attempt.submittedAt,
        });
      });
    });

    const averageScore =
      totalAttemptsCount > 0 ? Number((totalScore / totalAttemptsCount).toFixed(1)) : 0;
    const studyHours = Math.round(totalTimeSpent / 3600); // Convert seconds to hours

    // 2. Get upcoming exams (Published, within time range, not completed yet)
    const now = new Date();

    const classrooms = await Classroom.find({ students: userId }).select('_id');
    const classroomIds = classrooms.map((c) => c._id);

    const examFilter = {
      status: 'Published',
      _id: { $nin: Array.from(completedExamIds) },
    };
    const targetConditions = [
      { targetStudents: userId },
      ...(classroomIds.length ? [{ targetClasses: { $in: classroomIds } }] : []),
      {
        $and: [
          { targetStudents: { $exists: true, $size: 0 } },
          { targetClasses: { $exists: true, $size: 0 } },
        ],
      },
    ];
    examFilter.$and = [
      { $or: targetConditions },
      {
        $or: [{ endAt: { $exists: false } }, { endAt: null }, { endAt: { $gt: now } }],
      },
    ];
    const upcomingExams = await Exam.find(examFilter).sort({ startAt: 1 }).limit(3);

    // 3. Calculate Class Rank (simplified for now: rank by average score in the same className)
    let classRank = { rank: '-', total: '-', topPercentage: 0 };
    if (user.className) {
      const User = require('../models/User');
      const classmates = await User.find({
        className: user.className,
        role: 'student',
      }).select('_id');
      const classmateIds = classmates.map((c) => c._id.toString());

      // Get all exams for these classmates
      const classExams = await Exam.find({
        'attempts.studentId': { $in: classmateIds },
      });

      const classmateStats = classmateIds.map((id) => {
        let sum = 0;
        let count = 0;
        classExams.forEach((e) => {
          e.attempts.forEach((a) => {
            if (a.studentId === id) {
              sum += a.score || 0;
              count++;
            }
          });
        });
        return { id, avg: count > 0 ? sum / count : 0 };
      });

      classmateStats.sort((a, b) => b.avg - a.avg);
      const myRankIndex = classmateStats.findIndex((s) => s.id === userId);
      if (myRankIndex !== -1) {
        classRank = {
          rank: myRankIndex + 1,
          total: classmateStats.length,
          topPercentage: Math.round(((myRankIndex + 1) / classmateStats.length) * 100),
        };
      }
    }

    // Sort recent results by date
    recentResults.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.json({
      stats: {
        completedExamsCount: completedExamIds.size,
        averageScore,
        studyHours,
        classRank,
        totalUpcoming: upcomingExams.length,
      },
      upcomingExams,
      recentResults: recentResults.slice(0, 3),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
