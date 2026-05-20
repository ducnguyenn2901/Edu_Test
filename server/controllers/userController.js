const User = require('../models/User');
const Classroom = require('../models/Classroom');

const getUsers = async (req, res) => {
  try {
    const { grade, className, school } = req.query;

    const filter = {};
    if (grade) {
      filter.grade = grade;
    }
    if (className) {
      filter.className = className;
    }
    if (school) {
      filter.school = school;
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    const mapped = users.map((user) => {
      const roleLabel =
        user.role === 'admin'
          ? 'Admin'
          : user.role === 'teacher'
          ? 'Teacher'
          : user.role === 'mod'
          ? 'Mod'
          : 'Student';

      const roleColor =
        user.role === 'teacher' || user.role === 'admin' || user.role === 'mod'
          ? 'purple'
          : 'orange';

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: roleLabel,
        roleColor,
        joinedDate: user.createdAt,
        status: user.status === 'locked' ? 'Locked' : (user.status === 'pending' ? 'Pending' : 'Active'),
        grade: user.grade || '',
        className: user.className || '',
        school: user.school || '',
        department: user.department || '',
        students: user.students || [],
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user.name || user.email,
        )}&background=random`,
      };
    });

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStudents = async (req, res) => {
  try {
    const { grade, className, school } = req.query;

    const filter = { role: 'student' };
    if (grade) {
      filter.grade = grade;
    }
    if (className) {
      filter.className = className;
    }
    if (school) {
      filter.school = school;
    }

    const requester = req.user;
    if (requester && requester.role === 'teacher') {
      const teachingGrades = Array.isArray(requester.teachingGrades)
        ? requester.teachingGrades.filter(Boolean)
        : [];
      const teachingClasses = Array.isArray(requester.teachingClasses)
        ? requester.teachingClasses.filter(Boolean)
        : [];

      if (teachingGrades.length || teachingClasses.length) {
        const orConditions = [];

        if (teachingGrades.length) {
          orConditions.push({ grade: { $in: teachingGrades } });
        }

        if (teachingClasses.length) {
          orConditions.push({ className: { $in: teachingClasses } });
        }

        if (orConditions.length) {
          filter.$or = orConditions;
        }
      }
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    const mapped = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      joinedDate: user.createdAt,
      status: user.status === 'locked' ? 'Locked' : 'Active',
      grade: user.grade || '',
      className: user.className || '',
      school: user.school || '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name || user.email,
      )}&background=random`,
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTeacherStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, className, school } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Thiếu id giáo viên' });
    }

    if (req.user.role === 'teacher' && req.user._id.toString() !== id) {
      return res
        .status(403)
        .json({ message: 'Bạn không có quyền xem học sinh của giáo viên khác' });
    }

    const teacher = await User.findById(id);

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Không tìm thấy giáo viên' });
    }

    const filter = { role: 'student' };

    if (grade) {
      filter.grade = grade;
    }
    if (className) {
      filter.className = className;
    }
    if (school) {
      filter.school = school;
    }

    const teachingGrades = Array.isArray(teacher.teachingGrades)
      ? teacher.teachingGrades.filter(Boolean)
      : [];
    const teachingClasses = Array.isArray(teacher.teachingClasses)
      ? teacher.teachingClasses.filter(Boolean)
      : [];

    const scopeConditions = [];

    if (teachingGrades.length) {
      scopeConditions.push({ grade: { $in: teachingGrades } });
    }

    if (teachingClasses.length) {
      scopeConditions.push({ className: { $in: teachingClasses } });
    }

    const classrooms = await Classroom.find({
      $or: [{ homeroomTeacher: id }, { teachers: id }],
    }).select('students');

    const classroomStudentIds = new Set();
    classrooms.forEach((c) => {
      if (Array.isArray(c.students)) {
        c.students.forEach((studentId) => {
          if (studentId) classroomStudentIds.add(studentId.toString());
        });
      }
    });

    // Add direct students assigned to the teacher
    if (Array.isArray(teacher.students)) {
      teacher.students.forEach(id => {
        if (id) classroomStudentIds.add(id.toString());
      });
    }

    if (classroomStudentIds.size > 0) {
      scopeConditions.push({
        _id: { $in: Array.from(classroomStudentIds) },
      });
    }

    // If no assignments found for teacher, return empty array immediately
    if (scopeConditions.length === 0) {
      return res.json([]);
    }

    if (scopeConditions.length > 0) {
      filter.$or = scopeConditions;
    }

    const students = await User.find(filter).sort({ createdAt: -1 });

    const mapped = students.map((student) => ({
      id: student._id,
      name: student.name,
      email: student.email,
      joinedDate: student.createdAt,
      status: student.status === 'locked' ? 'Locked' : 'Active',
      grade: student.grade || '',
      className: student.className || '',
      school: student.school || '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        student.name || student.email,
      )}&background=random`,
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTeacherStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ message: 'studentIds phải là một mảng' });
    }

    const teacher = await User.findById(id);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Không tìm thấy giáo viên' });
    }

    teacher.students = studentIds;
    await teacher.save();

    res.json({ message: 'Đã cập nhật danh sách học sinh thành công', total: studentIds.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      grade,
      className,
      school,
      department,
      teachingGrades,
      teachingClasses,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'teacher',
      grade: grade || '',
      className: className || '',
      school: school || '',
      department: department || '',
      teachingGrades:
        Array.isArray(teachingGrades) && teachingGrades.length
          ? teachingGrades
          : [],
      teachingClasses:
        Array.isArray(teachingClasses) && teachingClasses.length
          ? teachingClasses
          : [],
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role:
        user.role === 'admin'
          ? 'Admin'
          : user.role === 'teacher'
          ? 'Teacher'
          : user.role === 'mod'
          ? 'Mod'
          : 'Student',
      status: user.status === 'locked' ? 'Locked' : 'Active',
      grade: user.grade || '',
      className: user.className || '',
      school: user.school || '',
      department: user.department || '',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const {
      role,
      name,
      email,
      grade,
      className,
      school,
      department,
      teachingGrades,
      teachingClasses,
    } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (role) {
      user.role = role;
    }

    if (name) {
      user.name = name;
    }

    if (email) {
      user.email = email;
    }

    if (grade !== undefined) {
      user.grade = grade;
    }

    if (className !== undefined) {
      user.className = className;
    }

    if (school !== undefined) {
      user.school = school;
    }

    if (department !== undefined) {
      user.department = department;
    }

    if (teachingGrades !== undefined) {
      user.teachingGrades = Array.isArray(teachingGrades)
        ? teachingGrades
        : [];
    }

    if (teachingClasses !== undefined) {
      user.teachingClasses = Array.isArray(teachingClasses)
        ? teachingClasses
        : [];
    }

    if (req.body.status !== undefined) {
      user.status = req.body.status;
    }

    await user.save();

    res.json({ message: 'Cập nhật người dùng thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleLockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Không thể khóa tài khoản admin' });
    }

    user.status = user.status === 'locked' ? 'active' : 'locked';
    await user.save();

    res.json({
      message: 'Cập nhật trạng thái tài khoản thành công',
      status: user.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Không thể xóa tài khoản admin' });
    }

    await user.deleteOne();

    res.json({ message: 'Xóa người dùng thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getStudents,
  getTeacherStudents,
  updateTeacherStudents,
  createUser,
  updateUser,
  toggleLockUser,
  deleteUser,
};
