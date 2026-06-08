const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const ACCESS_COOKIE_NAME = 'edutest_access';
const CSRF_COOKIE_NAME = 'edutest_csrf';

const baseCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };
};

const setAuthCookies = (res, token) => {
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const maxAgeMs = 30 * 24 * 60 * 60 * 1000;

  res.cookie(ACCESS_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    httpOnly: true,
    maxAge: maxAgeMs,
  });
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    ...baseCookieOptions(),
    httpOnly: false,
    maxAge: maxAgeMs,
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE_NAME, baseCookieOptions());
  res.clearCookie(CSRF_COOKIE_NAME, baseCookieOptions());
};

const OAUTH_STATE_COOKIE_NAME = 'edutest_oauth_state';

const roleRedirect = {
  admin: '/admin',
  student: '/student',
  teacher: '/teacher',
  mod: '/teacher',
};

const getFrontendUrl = () => {
  const raw = process.env.FRONTEND_URL || '';
  if (!raw) return '';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
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
      phone,
      address,
      dateOfBirth,
      gender,
    } = req.body;

    // 1. Kiểm tra email đã tồn tại chưa
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // 2. Xác định Role (không cho tự đăng ký admin)
    const allowedRoles = ['student', 'teacher'];
    const finalRole = allowedRoles.includes(role) ? role : 'student';

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
          status: 'pending',
        });
      }

      const token = generateToken(user._id);
      setAuthCookies(res, token);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      });
    } else {
      res.status(400).json({ message: 'Thông tin người dùng không hợp lệ' });
    }
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra trên server trong quá trình đăng ký',
      error: error.message,
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
      return res
        .status(403)
        .json({ message: 'Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên' });
    }

    if (user.status === 'pending') {
      return res
        .status(403)
        .json({ message: 'Tài khoản của bạn đang chờ quản trị viên phê duyệt.' });
    }

    const isMatch = await user.comparePassword(password);

    if (isMatch) {
      const token = generateToken(user._id);
      setAuthCookies(res, token);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
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

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (_req, res) => {
  clearAuthCookies(res);
  res.json({ message: 'Đăng xuất thành công' });
};

// @desc    Google OAuth start
// @route   GET /api/auth/google
// @access  Public
exports.googleStart = async (_req, res) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    return res.status(500).json({ message: 'Thiếu cấu hình Google OAuth' });
  }

  const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
  const state = crypto.randomBytes(24).toString('hex');

  res.cookie(OAUTH_STATE_COOKIE_NAME, state, {
    ...baseCookieOptions(),
    httpOnly: true,
    maxAge: 10 * 60 * 1000,
  });

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'consent',
    state,
  });

  return res.redirect(url);
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const savedState = req.cookies?.[OAUTH_STATE_COOKIE_NAME];
    res.clearCookie(OAUTH_STATE_COOKIE_NAME, baseCookieOptions());

    if (!code || !state || !savedState || state !== savedState) {
      const frontendUrl = getFrontendUrl();
      if (frontendUrl) return res.redirect(`${frontendUrl}/login?oauth=error`);
      return res.status(400).json({ message: 'OAuth state không hợp lệ' });
    }

    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
    const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
    const { tokens } = await client.getToken(String(code));
    if (!tokens?.id_token) {
      const frontendUrl = getFrontendUrl();
      if (frontendUrl) return res.redirect(`${frontendUrl}/login?oauth=error`);
      return res.status(400).json({ message: 'Không lấy được token từ Google' });
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;
    const name = payload?.name || 'Google User';
    const googleId = payload?.sub;
    const avatarUrl = payload?.picture || '';

    if (!email || !googleId) {
      const frontendUrl = getFrontendUrl();
      if (frontendUrl) return res.redirect(`${frontendUrl}/login?oauth=error`);
      return res.status(400).json({ message: 'Thiếu thông tin tài khoản Google' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        password: crypto.randomBytes(24).toString('hex'),
        role: 'student',
        status: 'active',
        authProvider: 'google',
        googleId,
        avatarUrl,
      });
    } else {
      if (user.status === 'locked') {
        const frontendUrl = getFrontendUrl();
        if (frontendUrl) return res.redirect(`${frontendUrl}/login?oauth=locked`);
        return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
      }
      if (user.status === 'pending') {
        const frontendUrl = getFrontendUrl();
        if (frontendUrl) return res.redirect(`${frontendUrl}/login?oauth=pending`);
        return res.status(403).json({ message: 'Tài khoản đang chờ phê duyệt' });
      }

      const updates = {};
      if (!user.googleId) updates.googleId = googleId;
      if (!user.avatarUrl && avatarUrl) updates.avatarUrl = avatarUrl;
      if (user.authProvider === 'local' && updates.googleId) updates.authProvider = 'google';
      if (Object.keys(updates).length) {
        user = await User.findByIdAndUpdate(user._id, updates, { new: true });
      }
    }

    const token = generateToken(user._id);
    setAuthCookies(res, token);

    const frontendUrl = getFrontendUrl();
    if (frontendUrl)
      return res.redirect(`${frontendUrl}${roleRedirect[user.role] || '/'}?oauth=success`);
    return res.json({ message: 'Đăng nhập Google thành công' });
  } catch (error) {
    const frontendUrl = getFrontendUrl();
    if (frontendUrl) return res.redirect(`${frontendUrl}/login?oauth=error`);
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get available subjects for teacher registration
// @route   GET /api/auth/subjects
// @access  Public
exports.getSubjects = async (req, res) => {
  try {
    const subjects = [
      'Toán',
      'Lý',
      'Hóa',
      'Sinh',
      'Tiếng Anh',
      'Tiếng Việt',
      'Lịch sử',
      'Địa lý',
      'Giáo dục công dân',
      'Thể dục',
      'Công nghệ',
      'Tin học',
      'Mỹ thuật',
      'Âm nhạc',
      'GDCD',
      'Kinh tế',
      'Pháp luật',
    ];
    res.json(subjects);
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
