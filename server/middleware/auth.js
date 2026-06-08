const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.cookies?.edutest_access) {
    token = req.cookies.edutest_access;
  }

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
    } catch {
      token = undefined;
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Người dùng không tồn tại hoặc đã bị xóa' });
      }

      return next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      let message = 'Không có quyền truy cập, token không hợp lệ';
      if (error.name === 'TokenExpiredError') {
        message = 'Phiên làm việc đã hết hạn, vui lòng đăng nhập lại';
      }
      return res.status(401).json({ message });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Không có quyền truy cập, không có token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role ${req.user.role} không được phép truy cập`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
