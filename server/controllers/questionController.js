const Question = require('../models/Question');
const XLSX = require('xlsx');
const mammoth = require('mammoth');

exports.getQuestions = async (req, res) => {
  try {
    const { search, type, difficulty, subject, grade, category, needsReview } = req.query;
    const filter = {};

    if (search) {
      filter.content = { $regex: search, $options: 'i' };
    }
    if (type) {
      filter.type = type;
    }
    if (difficulty) {
      filter.difficulty = difficulty;
    }
    if (subject) {
      filter.subject = subject;
    }
    if (grade) {
      filter.grade = grade;
    }
    if (category) {
      filter.category = category;
    }
    if (needsReview === 'true') {
      filter.needsReview = true;
    }

    if (req.user?.role === 'teacher') {
      filter.author = req.user.name;
    }

    const questions = await Question.find(filter)
      .populate('category')
      .sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate('category');
    if (!question) return res.status(404).json({ message: 'Question not found' });
    if (req.user?.role === 'teacher' && question.author !== req.user.name) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập câu hỏi này' });
    }
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const authorName = req.user?.name || 'Unknown';
    const payload = req.body;

    const validateAndNormalize = (q) => {
      const content = (q.content || '').trim();
      const subject = q.subject;
      const grade = q.grade;
      if (!content) {
        return { error: 'Nội dung câu hỏi không được để trống' };
      }
      if (!subject || !grade) {
        return { error: 'Môn học và khối lớp là bắt buộc' };
      }
      const answers = Array.isArray(q.answers) ? q.answers.map((a, idx) => ({
        id: a.id || String.fromCharCode(65 + idx),
        content: a.content,
        isCorrect: !!a.isCorrect,
      })) : undefined;
      if (answers && answers.length > 0 && !answers.some(a => a.isCorrect)) {
        answers[0].isCorrect = true;
      }
      return {
        data: {
          ...q,
          content,
          author: authorName,
          answers,
        },
      };
    };

    if (Array.isArray(payload)) {
      if (payload.length === 0) {
        return res.status(400).json({ message: 'Mảng câu hỏi trống' });
      }
      const valid = [];
      const errors = [];

      for (let i = 0; i < payload.length; i++) {
        const { data, error } = validateAndNormalize(payload[i] || {});
        if (error) {
          errors.push(`Dòng ${i + 1}: ${error}`);
          continue;
        }
        const dup = await Question.findOne({ content: data.content, subject: data.subject, grade: data.grade });
        if (dup) {
          errors.push(`Dòng ${i + 1}: Câu hỏi đã tồn tại`);
          continue;
        }
        valid.push(data);
      }

      if (valid.length === 0) {
        return res.status(400).json({ message: 'Không có câu hỏi hợp lệ để tạo', errors });
      }

      const inserted = await Question.insertMany(valid);
      return res.status(201).json({
        message: `Đã tạo ${inserted.length} câu hỏi`,
        skipped: payload.length - inserted.length,
        errors: errors.length ? errors : undefined,
        items: inserted,
      });
    } else {
      const { data, error } = validateAndNormalize(payload || {});
      if (error) {
        return res.status(400).json({ message: error });
      }
      const duplicate = await Question.findOne({ content: data.content, subject: data.subject, grade: data.grade });
      if (duplicate) {
        return res.status(400).json({ message: 'Câu hỏi này đã tồn tại trong hệ thống' });
      }
      const created = await Question.create(data);
      return res.status(201).json(created);
    }
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { content } = req.body;
    if (content && !content.trim()) {
      return res.status(400).json({ message: 'Nội dung câu hỏi không được để trống' });
    }

    const existing = await Question.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Question not found' });
    if (req.user?.role === 'teacher' && existing.author !== req.user.name) {
      return res.status(403).json({ message: 'Bạn chỉ được sửa câu hỏi của mình' });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updatedQuestion) return res.status(404).json({ message: 'Question not found' });
    res.json(updatedQuestion);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const existing = await Question.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Question not found' });
    if (req.user?.role === 'teacher' && existing.author !== req.user.name) {
      return res.status(403).json({ message: 'Bạn chỉ được xóa câu hỏi của mình' });
    }
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.exportQuestions = async (req, res) => {
  try {
    const filter = {};
    if (req.user?.role === 'teacher') {
      filter.author = req.user.name;
    }
    const questions = await Question.find(filter).populate('category').lean();
    
    const data = questions.map(q => {
      const answers = Array.isArray(q.answers) ? q.answers : [];
      const answerMap = {};
      answers.forEach((a, idx) => {
        const id = a.id || String.fromCharCode(65 + idx);
        answerMap[id] = a.content || '';
      });
      const correctIds = answers.filter(a => a.isCorrect).map(a => a.id).filter(Boolean);
      return {
        'Nội dung': q.content,
        'Loại': q.type,
        'Độ khó': q.difficulty,
        'Môn học': q.subject,
        'Khối': q.grade,
        'Danh mục': q.category ? q.category.name : '',
        'A': answerMap['A'] || '',
        'B': answerMap['B'] || '',
        'C': answerMap['C'] || '',
        'D': answerMap['D'] || '',
        'Đúng': correctIds.join(','),
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename="Questions.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.importQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng tải lên file Excel/CSV hoặc Word (.docx)' });
    }

    const fileName = req.file.originalname.toLowerCase();
    let questionsToSave = [];
    const errors = [];

    if (fileName.endsWith('.docx')) {
      // Logic for Word file
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      const text = result.value;
      
      const questionBlocks = text.split(/(?=Câu\s*\d+|^\d+[\.\):]\s+)/m).filter(b => b.trim());
      
      for (let i = 0; i < questionBlocks.length; i++) {
        const block = questionBlocks[i].trim();
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        
        if (lines.length < 2) continue;

        // Extract question content 
        let questionContent = lines[0].replace(/^(Câu\s*\d+[:\.]?|^\d+[\.\):])\s*/i, '').trim();
        
        const answers = [];
        const answerPattern = /^([A-D])[\.\):]\s*(.*)/i;
        
        for (let j = 1; j < lines.length; j++) {
          const match = lines[j].match(answerPattern);
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

        if (questionContent && answers.length >= 2) {
          // If no correct answer marked, default first one
          if (!answers.some(a => a.isCorrect)) {
            answers[0].isCorrect = true;
          }

          questionsToSave.push({
            content: questionContent,
            type: 'Trắc nghiệm',
            difficulty: 'Trung bình',
            subject: req.body.subject || 'Chưa xác định',
            grade: req.body.grade || 'Chưa xác định',
            answers,
            author: req.user?.name || 'Admin',
          });
        }
      }
    } else {
      // Logic for Excel/CSV/CSV-like file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const lineNum = i + 2;

        if (!row['Nội dung'] || !row['Nội dung'].trim()) {
          errors.push(`Dòng ${lineNum}: Nội dung không được để trống`);
          continue;
        }

        const content = row['Nội dung'].trim();
        const subject = req.body.subject || row['Môn học'] || 'Chưa xác định';
        const grade = req.body.grade || row['Khối'] || 'Chưa xác định';
        const exists = await Question.findOne({ content, subject, grade });
        if (exists) {
          errors.push(`Dòng ${lineNum}: Câu hỏi đã tồn tại trong hệ thống`);
          continue;
        }

        // Parse answers in two supported formats:
        // 1) Columns A,B,C,D and column 'Đúng' as letters (e.g., "A" or "A,C")
        // 2) Single cell 'Đáp án' with lines like "A. ... (Đúng)"
        let answers = [];

        const hasABCD =
          typeof row['A'] !== 'undefined' ||
          typeof row['B'] !== 'undefined' ||
          typeof row['C'] !== 'undefined' ||
          typeof row['D'] !== 'undefined';

        if (hasABCD) {
          const labels = ['A', 'B', 'C', 'D'];
          const correctRaw = (row['Đúng'] || row['Dung'] || '').toString().trim();
          const correctSet = new Set(
            correctRaw
              ? correctRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
              : [],
          );
          labels.forEach((lab) => {
            const txt = (row[lab] || '').toString().trim();
            if (txt) {
              answers.push({
                id: lab,
                content: txt,
                isCorrect: correctSet.has(lab),
              });
            }
          });
        } else if (row['Đáp án']) {
          const lines = row['Đáp án'].toString().split('\n').map(l => l.trim()).filter(Boolean);
          const answerPattern = /^([A-D])[\.\):]\s*(.*)/i;
          lines.forEach((ln) => {
            const m = ln.match(answerPattern);
            if (m) {
              const label = m[1].toUpperCase();
              let txt = m[2].trim();
              let isCorrect = false;
              if (txt.endsWith('*') || txt.includes('(Đúng)') || txt.includes('(đúng)')) {
                isCorrect = true;
                txt = txt.replace(/\*|\(Đúng\)|\(đúng\)/g, '').trim();
              }
              answers.push({ id: label, content: txt, isCorrect });
            }
          });
        }

        if (answers.length >= 2 && !answers.some(a => a.isCorrect)) {
          answers[0].isCorrect = true;
        }

        questionsToSave.push({
          content,
          type: row['Loại'] || 'Trắc nghiệm',
          difficulty: row['Độ khó'] || 'Trung bình',
          subject,
          grade,
          answers: answers.length ? answers : undefined,
          author: req.user?.name || 'Admin',
        });
      }
    }

    if (questionsToSave.length === 0 && errors.length > 0) {
      return res.status(400).json({ message: 'Lỗi định dạng dữ liệu hoặc không tìm thấy câu hỏi hợp lệ', errors });
    }

    // Filter out duplicates in DB before saving
    const uniqueQuestions = [];
    for (const q of questionsToSave) {
      const exists = await Question.findOne({ content: q.content, subject: q.subject, grade: q.grade });
      if (!exists) {
        uniqueQuestions.push(q);
      }
    }

    if (uniqueQuestions.length > 0) {
      await Question.insertMany(uniqueQuestions);
    }

    res.status(201).json({ 
      message: `Đã nhập thành công ${uniqueQuestions.length} câu hỏi`,
      skipped: questionsToSave.length - uniqueQuestions.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.flagQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const userId = req.user?._id?.toString();
    const role = req.user?.role || 'unknown';
    const { reason } = req.body || {};

    question.flags = question.flags || [];
    question.flags.push({
      userId,
      role,
      reason: reason || '',
      createdAt: new Date(),
    });
    question.needsReview = true;

    await question.save();

    res.json({ message: 'Question flagged for review' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reviewQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const { resolved } = req.body || {};
    if (resolved === true) {
      question.needsReview = false;
    }

    await question.save();

    res.json({ message: 'Question review status updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
