const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getExams,
  getExamById,
  getMyExams,
  createExam,
  createExamWithFiles,
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
  importExam,
  parseExamFile,
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure disk storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp to avoid conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = uniqueSuffix + ext;
    cb(null, filename);
  },
});

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);

const fileFilter = (_req, file, cb) => {
  if (allowedMimeTypes.has(file.mimetype)) return cb(null, true);
  return cb(new Error('Định dạng tệp không được hỗ trợ'), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

router.get('/', protect, authorize('student', 'admin'), getExams);
router.get('/student-dashboard', protect, authorize('student', 'admin'), getStudentDashboardStats);
router.get('/mine', protect, authorize('teacher', 'admin'), getMyExams);
router.get('/attempts/mine', protect, authorize('student', 'admin'), getMyAttempts);
router.get('/:id', protect, authorize('student', 'teacher', 'admin'), getExamById);
router.get('/:id/attempts/:attemptId', protect, authorize('student', 'admin'), getMyAttemptDetail);
router.get('/:id/stats', protect, authorize('teacher', 'admin'), getExamStats);
router.post('/', protect, authorize('teacher', 'admin'), createExam);
router.post(
  '/with-files',
  protect,
  authorize('teacher', 'admin'),
  upload.array('files', 10),
  createExamWithFiles,
);
router.post(
  '/parse',
  protect,
  authorize('teacher', 'admin'),
  memoryUpload.single('file'),
  parseExamFile,
);
router.post(
  '/import',
  protect,
  authorize('teacher', 'admin'),
  memoryUpload.single('file'),
  importExam,
);
router.put('/:id', protect, authorize('teacher', 'admin'), updateExam);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteExam);
router.post('/:id/submit', protect, authorize('student', 'admin'), submitExam);
router.post('/:id/flag', protect, authorize('student', 'teacher', 'admin'), flagExam);
router.post('/:id/review', protect, authorize('mod', 'admin'), reviewExam);

module.exports = router;

// router.post('/:id/clone', protect, authorize('teacher', 'admin'), cloneExam);
// router.post('/:id/template', protect, authorize('teacher', 'admin'), createTemplateFromExam,);
// Fix applied 2
