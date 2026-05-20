const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  flagQuestion,
  reviewQuestion,
  exportQuestions,
  importQuestions,
} = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('teacher', 'admin', 'mod'), getQuestions);
router.get('/export', protect, authorize('teacher', 'admin'), exportQuestions);
router.post('/import', protect, authorize('teacher', 'admin'), upload.single('file'), importQuestions);
router.get('/:id', protect, authorize('teacher', 'admin', 'mod'), getQuestionById);
router.post('/', protect, authorize('teacher', 'admin'), createQuestion);
router.put('/:id', protect, authorize('teacher', 'admin'), updateQuestion);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteQuestion);
router.post('/:id/flag', protect, authorize('student', 'teacher', 'admin'), flagQuestion);
router.post('/:id/review', protect, authorize('mod', 'admin'), reviewQuestion);

module.exports = router;
