const express = require('express');
const router = express.Router();
const {
  getExams,
  getExamById,
  getMyExams,
  createExam,
  updateExam,
  deleteExam,
  submitExam,
  getMyAttempts,
  getMyAttemptDetail,
  // cloneExam,
  getExamStats,
  flagExam,
  reviewExam,
  // createTemplateFromExam,
  getStudentDashboardStats,
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('student', 'admin'), getExams);
router.get('/student-dashboard', protect, authorize('student', 'admin'), getStudentDashboardStats);
router.get('/mine', protect, authorize('teacher', 'admin'), getMyExams);
router.get('/attempts/mine', protect, authorize('student', 'admin'), getMyAttempts);
router.get('/:id', protect, authorize('student', 'admin'), getExamById);
router.get('/:id/attempts/:attemptId', protect, authorize('student', 'admin'), getMyAttemptDetail);
router.get('/:id/stats', protect, authorize('teacher', 'admin'),getExamStats, getMyAttemptDetail);
router.post('/', protect, authorize('teacher', 'admin'), createExam);
router.put('/:id', protect, authorize('teacher', 'admin'), updateExam);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteExam);
router.post('/:id/submit', protect, authorize('student', 'admin'), submitExam);
router.post('/:id/flag', protect, authorize('student', 'teacher', 'admin'), flagExam);
router.post('/:id/review', protect, authorize('mod', 'admin'), reviewExam);

module.exports = router;





// router.post('/:id/clone', protect, authorize('teacher', 'admin'), cloneExam);
// router.post('/:id/template', protect, authorize('teacher', 'admin'), createTemplateFromExam,);