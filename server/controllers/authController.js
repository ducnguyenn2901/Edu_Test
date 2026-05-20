const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Middleware to check DB connection
const checkDBConnection = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database connection is not ready. Please check your MongoDB configuration or IP whitelist.');
  }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, grade, className, school, department, phone, address, dateOfBirth, gender } = req.body;

    // 1. Kiểm tra email đã tồn tại chưa
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // 2. Xác định Role (Logic gán Admin cho người đầu tiên)
    let finalRole = 'student';
    try {
      const userCount = await User.countDocuments();
      const allowedRoles = ['student', 'teacher'];
      
      if (userCount === 0) {
        finalRole = 'admin';
      } else {
        finalRole = allowedRoles.includes(role) ? role : 'student';
      }
    } catch (countError) {
      console.error('Lỗi khi đếm người dùng:', countError);
      // Nếu lỗi khi đếm, mặc định là student cho an toàn
      finalRole = 'student';
    }

    // 3. Xác định trạng thái ban đầu
    let status = 'active';
    if (finalRole === 'teacher') {
      status = 'pending';
    }

    // 4. Tạo người dùng mới
    const userData = {
      name,
      email,
      password,
      role: finalRole,
      status,
      grade,
      className,
      school,
      phone,
      address: address || '',
    };

    if (role === 'teacher') {
      userData.department = department;
    }

    if (dateOfBirth) {
      userData.dateOfBirth = dateOfBirth;
    }

    if (gender) {
      userData.gender = gender;
    }

    const user = await User.create(userData);

    if (user) {
      if (user.status === 'pending') {
        return res.status(201).json({
          message: 'Đăng ký thành công. Tài khoản giáo viên đang chờ quản trị viên phê duyệt.',
          status: 'pending'
        });
      }

      const token = generateToken(user._id);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: token,
        status: user.status,
      });
    } else {
      res.status(400).json({ message: 'Thông tin người dùng không hợp lệ' });
    }
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ 
      message: 'Đã có lỗi xảy ra trên server trong quá trình đăng ký', 
      error: error.message 
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Tài khoản của bạn đang chờ quản trị viên phê duyệt.' });
    }

    const isMatch = await user.comparePassword(password);

    if (isMatch) {
      const token = generateToken(user._id);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: token,
      });
    } else {
      res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên server' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;
      user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;
      user.gender = req.body.gender || user.gender;
      
      // Additional fields based on role
      if (user.role === 'student') {
        user.grade = req.body.grade || user.grade;
        user.className = req.body.className || user.className;
        user.school = req.body.school || user.school;
      } else if (user.role === 'teacher') {
        user.school = req.body.school || user.school;
        user.department = req.body.department || user.department;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        grade: updatedUser.grade,
        className: updatedUser.className,
        school: updatedUser.school,
        department: updatedUser.department,
        phone: updatedUser.phone,
        address: updatedUser.address,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
      });
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (user && (await user.comparePassword(currentPassword))) {
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Đổi mật khẩu thành công' });
    } else {
      res.status(401).json({ message: 'Mật khẩu hiện tại không chính xác' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
