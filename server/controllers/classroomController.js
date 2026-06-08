const Classroom = require('../models/Classroom');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const parseCsvBuffer = (buffer) => {
  const text = buffer.toString('utf8');
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) {
    return [];
  }

  const headerLine = lines[0];
  const rawHeaders = headerLine
    .split(',')
    .map((h) => h.trim())
    .filter((h) => h.length > 0);

  const headers = rawHeaders.map((h) => h.toLowerCase());

  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    const values = line.split(',').map((v) => v.trim());
    const row = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    rows.push(row);
  }

  return rows;
};

const getClassrooms = async (req, res) => {
  try {
    const { grade, school, teacherId, studentId } = req.query;

    const filter = {};

    if (grade) {
      filter.grade = grade;
    }
    if (school) {
      filter.school = school;
    }
    if (teacherId) {
      filter.$or = [{ homeroomTeacher: teacherId }, { teachers: teacherId }];
    }
    if (studentId) {
      filter.students = studentId;
    }

    if (req.user && req.user.role === 'teacher') {
      const id = req.user._id;
      if (!teacherId) {
        filter.$or = filter.$or || [];
        filter.$or.push({ homeroomTeacher: id }, { teachers: id });
      }
    }

    const classrooms = await Classroom.find(filter)
      .populate('homeroomTeacher', 'name email')
      .populate('teachers', 'name email')
      .populate('students', 'name email grade className')
      .populate('pendingStudents', 'name email grade className');

    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClassroomById = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('homeroomTeacher', 'name email')
      .populate('teachers', 'name email')
      .populate('students', 'name email grade className')
      .populate('pendingStudents', 'name email grade className');

    if (!classroom) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    res.json(classroom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const joinClassroom = async (req, res) => {
  try {
    const { code } = req.body;
    const studentId = req.user._id;

    if (!code) {
      return res.status(400).json({ message: 'Vui lòng nhập mã lớp học' });
    }

    const classroom = await Classroom.findOne({ code: code.toUpperCase() });

    if (!classroom) {
      return res.status(404).json({ message: 'Mã lớp học không chính xác' });
    }

    // Check if already a student
    if (classroom.students.includes(studentId)) {
      return res.status(400).json({ message: 'Bạn đã là thành viên của lớp học này' });
    }

    // Check if already pending
    if (classroom.pendingStudents.includes(studentId)) {
      return res.status(400).json({ message: 'Yêu cầu tham gia của bạn đang chờ duyệt' });
    }

    classroom.pendingStudents.push(studentId);
    await classroom.save();

    // Notify teacher
    if (classroom.homeroomTeacher) {
      await createNotification({
        recipient: classroom.homeroomTeacher,
        sender: studentId,
        type: 'student_request',
        title: 'Yêu cầu tham gia lớp học mới',
        message: `Học sinh ${req.user.name} yêu cầu tham gia lớp ${classroom.name}`,
        link: '/teacher/classrooms',
      });
    }

    res.json({ message: 'Đã gửi yêu cầu tham gia lớp học thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveStudent = async (req, res) => {
  try {
    const { classroomId, studentId, action } = req.body; // action: 'approve' or 'reject'
    const teacherId = req.user._id;

    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    // Verify teacher has permission
    const isTeacher =
      classroom.homeroomTeacher.toString() === teacherId.toString() ||
      classroom.teachers.map((t) => t.toString()).includes(teacherId.toString());

    if (!isTeacher && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
    }

    // Remove from pending
    classroom.pendingStudents = classroom.pendingStudents.filter(
      (id) => id.toString() !== studentId,
    );

    if (action === 'approve') {
      if (!classroom.students.includes(studentId)) {
        classroom.students.push(studentId);
      }
    }

    await classroom.save();

    // Notify student
    await createNotification({
      recipient: studentId,
      sender: teacherId,
      type: action === 'approve' ? 'class_approved' : 'warning',
      title: action === 'approve' ? 'Đã được duyệt vào lớp' : 'Yêu cầu vào lớp bị từ chối',
      message:
        action === 'approve'
          ? `Bạn đã được giáo viên duyệt vào lớp ${classroom.name}`
          : `Yêu cầu tham gia lớp ${classroom.name} của bạn đã bị từ chối`,
      link: action === 'approve' ? '/student/dashboard' : null,
    });

    res.json({
      message: action === 'approve' ? 'Đã duyệt học sinh vào lớp' : 'Đã từ chối yêu cầu tham gia',
      classroom,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeStudent = async (req, res) => {
  try {
    const { classroomId, studentId } = req.body;
    const teacherId = req.user._id;

    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    // Verify teacher has permission
    const isTeacher =
      classroom.homeroomTeacher.toString() === teacherId.toString() ||
      classroom.teachers.map((t) => t.toString()).includes(teacherId.toString());

    if (!isTeacher && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
    }

    // Remove from students
    classroom.students = classroom.students.filter((id) => id.toString() !== studentId);

    await classroom.save();

    res.json({
      message: 'Đã xóa học sinh khỏi lớp học thành công',
      classroom,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const importStudentsToClassroom = async (req, res) => {
  try {
    const { id } = req.params; // classroomId
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Vui lòng tải lên file CSV hợp lệ' });
    }

    const classroom = await Classroom.findById(id);
    if (!classroom) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    const rows = parseCsvBuffer(req.file.buffer);
    if (!rows.length) {
      return res.status(400).json({ message: 'File không có dữ liệu' });
    }

    // Look for 'email' or 'studentemail' header
    const emailHeader = Object.keys(rows[0]).find((h) => h === 'email' || h === 'studentemail');

    if (!emailHeader) {
      return res.status(400).json({
        message: "File CSV phải có cột 'email' hoặc 'studentemail'",
      });
    }

    const emails = rows.map((row) => (row[emailHeader] || '').trim().toLowerCase()).filter(Boolean);

    if (!emails.length) {
      return res.status(400).json({ message: 'Không tìm thấy email nào trong file' });
    }

    const students = await User.find({
      email: { $in: emails },
      role: 'student',
    });

    const studentIds = students.map((s) => s._id.toString());
    const existingStudentIds = new Set(classroom.students.map((id) => id.toString()));

    let addedCount = 0;
    studentIds.forEach((sid) => {
      if (!existingStudentIds.has(sid)) {
        classroom.students.push(sid);
        addedCount++;
      }
    });

    await classroom.save();

    res.json({
      message: `Đã thêm thành công ${addedCount} học sinh vào lớp`,
      addedCount,
      totalFound: students.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClassroomByCode = async (req, res) => {
  try {
    const classroom = await Classroom.findOne({ code: req.params.code.toUpperCase() }).populate(
      'homeroomTeacher',
      'name',
    );

    if (!classroom) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    res.json(classroom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createClassroom = async (req, res) => {
  try {
    const { name, grade, school, subject, teachers, students } = req.body;
    const homeroomTeacher = req.user._id;

    if (!name) {
      return res.status(400).json({ message: 'Vui lòng nhập tên lớp học' });
    }

    // Generate a random 6-character class code
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await Classroom.findOne({ code });
      if (!existing) isUnique = true;
    }

    const classroom = await Classroom.create({
      name,
      code,
      grade: grade || '',
      school: school || '',
      subject: subject || '',
      homeroomTeacher: homeroomTeacher || null,
      teachers: Array.isArray(teachers) ? teachers : [],
      students: Array.isArray(students) ? students : [],
    });

    res.status(201).json(classroom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    const { name, grade, school, subject, homeroomTeacher, teachers, students } = req.body;

    if (name !== undefined) {
      classroom.name = name;
    }
    if (grade !== undefined) {
      classroom.grade = grade;
    }
    if (school !== undefined) {
      classroom.school = school;
    }
    if (subject !== undefined) {
      classroom.subject = subject;
    }
    if (homeroomTeacher !== undefined) {
      classroom.homeroomTeacher = homeroomTeacher || null;
    }

    if (Array.isArray(teachers)) {
      classroom.teachers = teachers;
    }

    if (Array.isArray(students)) {
      classroom.students = students;
    }

    await classroom.save();

    res.json(classroom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignStudents = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    const { studentIds } = req.body;

    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ message: 'studentIds phải là một mảng' });
    }

    const set = new Set(classroom.students.map((id) => id.toString()));

    studentIds.forEach((id) => {
      if (id && !set.has(id)) {
        classroom.students.push(id);
      }
    });

    await classroom.save();

    res.json(classroom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignTeachers = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    const { teacherIds } = req.body;

    if (!Array.isArray(teacherIds)) {
      return res.status(400).json({ message: 'teacherIds phải là một mảng' });
    }

    const set = new Set(classroom.teachers.map((id) => id.toString()));

    teacherIds.forEach((id) => {
      if (id && !set.has(id)) {
        classroom.teachers.push(id);
      }
    });

    await classroom.save();

    res.json(classroom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const importClasses = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Vui lòng tải lên file CSV hợp lệ' });
    }

    const rows = parseCsvBuffer(req.file.buffer);

    if (!rows.length) {
      return res.status(400).json({ message: 'File không có dữ liệu' });
    }

    const requiredHeaders = ['school', 'grade', 'classname', 'studentemail', 'teacheremail'];

    const missingHeaders = requiredHeaders.filter(
      (key) => !Object.prototype.hasOwnProperty.call(rows[0], key),
    );

    if (missingHeaders.length) {
      return res.status(400).json({
        message: `Thiếu cột bắt buộc trong file: ${missingHeaders.join(', ')}`,
      });
    }

    const classKeyMap = new Map();
    const teacherEmailSet = new Set();
    const studentEmailSet = new Set();

    rows.forEach((row) => {
      const school = (row.school || '').trim();
      const grade = (row.grade || '').trim();
      const className = (row.classname || '').trim();
      const studentEmail = (row.studentemail || '').trim().toLowerCase();
      const teacherEmail = (row.teacheremail || '').trim().toLowerCase();

      if (!school || !grade || !className || !studentEmail || !teacherEmail) {
        return;
      }

      const key = `${school}__${grade}__${className}`;
      if (!classKeyMap.has(key)) {
        classKeyMap.set(key, {
          school,
          grade,
          className,
          teacherEmails: new Set(),
          studentEmails: new Set(),
        });
      }

      const entry = classKeyMap.get(key);
      entry.teacherEmails.add(teacherEmail);
      entry.studentEmails.add(studentEmail);

      teacherEmailSet.add(teacherEmail);
      studentEmailSet.add(studentEmail);
    });

    if (!classKeyMap.size) {
      return res.status(400).json({
        message: 'Không có dòng dữ liệu hợp lệ nào trong file',
      });
    }

    const teacherMap = {};
    if (teacherEmailSet.size) {
      const teachers = await User.find({
        email: { $in: Array.from(teacherEmailSet) },
      });
      teachers.forEach((t) => {
        teacherMap[t.email.toLowerCase()] = t;
      });
    }

    const studentMap = {};
    if (studentEmailSet.size) {
      const students = await User.find({
        email: { $in: Array.from(studentEmailSet) },
      });
      students.forEach((s) => {
        studentMap[s.email.toLowerCase()] = s;
      });
    }

    const results = [];

    for (const [, value] of classKeyMap) {
      const { school, grade, className, teacherEmails, studentEmails } = value;

      const teachersForClass = [];
      teacherEmails.forEach((email) => {
        const existing = teacherMap[email];
        if (existing && existing.role === 'teacher') {
          teachersForClass.push(existing._id);
        }
      });

      const studentsForClass = [];
      studentEmails.forEach((email) => {
        const existing = studentMap[email];
        if (existing && existing.role === 'student') {
          studentsForClass.push(existing._id);
        }
      });

      const existingClass = await Classroom.findOne({
        name: className,
        grade,
        school,
      });

      let classroom = existingClass;

      if (!classroom) {
        classroom = await Classroom.create({
          name: className,
          grade,
          school,
          subject: '',
          homeroomTeacher: teachersForClass[0] || null,
          teachers: teachersForClass,
          students: studentsForClass,
        });
      } else {
        const teacherSet = new Set(classroom.teachers.map((id) => id.toString()));
        teachersForClass.forEach((id) => {
          if (!teacherSet.has(id.toString())) {
            classroom.teachers.push(id);
          }
        });

        const studentSet = new Set(classroom.students.map((id) => id.toString()));
        studentsForClass.forEach((id) => {
          if (!studentSet.has(id.toString())) {
            classroom.students.push(id);
          }
        });

        if (!classroom.homeroomTeacher && teachersForClass[0]) {
          classroom.homeroomTeacher = teachersForClass[0];
        }

        await classroom.save();
      }

      results.push({
        classroomId: classroom._id,
        name: classroom.name,
        grade: classroom.grade,
        school: classroom.school,
        teacherCount: teachersForClass.length,
        studentCount: studentsForClass.length,
      });
    }

    res.json({
      message: 'Đã xử lý file import lớp học thành công',
      classrooms: results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndDelete(req.params.id);
    if (!classroom) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }
    res.json({ message: 'Đã xóa lớp học thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getClassrooms,
  getClassroomById,
  getClassroomByCode,
  createClassroom,
  updateClassroom,
  deleteClassroom,
  assignStudents,
  assignTeachers,
  importClasses,
  joinClassroom,
  approveStudent,
  removeStudent,
  importStudentsToClassroom,
};
