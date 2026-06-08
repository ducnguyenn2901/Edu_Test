const express = require('express');
const router = express.Router();
const multer = require('multer');
const allowedMimeTypes = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/json',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) return cb(null, true);
    return cb(new Error('Định dạng tệp không được hỗ trợ'), false);
  },
});
const {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  deleteBulkQuestions,
  flagQuestion,
  reviewQuestion,
  exportQuestions,
  importQuestions,
} = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('teacher', 'admin', 'mod'), getQuestions);
router.get('/export', protect, authorize('teacher', 'admin'), exportQuestions);
router.post(
  '/import',
  protect,
  authorize('teacher', 'admin'),
  upload.single('file'),
  importQuestions,
);
router.post('/bulk-delete', protect, authorize('teacher', 'admin'), deleteBulkQuestions);
router.get('/:id', protect, authorize('teacher', 'admin', 'mod'), getQuestionById);
router.post('/', protect, authorize('teacher', 'admin'), createQuestion);
router.put('/:id', protect, authorize('teacher', 'admin'), updateQuestion);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteQuestion);
router.post('/:id/flag', protect, authorize('student', 'teacher', 'admin'), flagQuestion);
router.post('/:id/review', protect, authorize('mod', 'admin'), reviewQuestion);

module.exports = router;
