const express = require('express');
const router = express.Router();
const { getTeacherStudents, updateTeacherStudents } = require('../controllers/userController');
const { getDashboardStats } = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, authorize('teacher', 'admin'), getDashboardStats);
router.get('/:id/students', protect, authorize('admin', 'teacher'), getTeacherStudents);
router.put('/:id/students', protect, authorize('admin'), updateTeacherStudents);

module.exports = router;
