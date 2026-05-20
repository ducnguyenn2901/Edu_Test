const express = require('express');
const router = express.Router();
const {
  getClassrooms,
  getClassroomById,
  getClassroomByCode,
  createClassroom,
  updateClassroom,
  assignStudents,
  assignTeachers,
  importClasses,
  joinClassroom,
  approveStudent,
  removeStudent,
  importStudentsToClassroom,
  deleteClassroom,
} = require('../controllers/classroomController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', protect, authorize('admin', 'teacher', 'student'), getClassrooms);
router.get('/:id', protect, authorize('admin', 'teacher', 'student'), getClassroomById);
router.get('/code/:code', protect, authorize('student'), getClassroomByCode);
router.post('/join', protect, authorize('student'), joinClassroom);
router.post('/approve', protect, authorize('teacher', 'admin'), approveStudent);
router.post('/remove-student', protect, authorize('teacher', 'admin'), removeStudent);
router.post('/:id/import-students', protect, authorize('teacher', 'admin'), upload.single('file'), importStudentsToClassroom);
router.post('/', protect, authorize('admin', 'teacher'), createClassroom);
router.put('/:id', protect, authorize('admin', 'teacher'), updateClassroom);
router.patch('/:id', protect, authorize('admin', 'teacher'), updateClassroom);
router.delete('/:id', protect, authorize('admin', 'teacher'), deleteClassroom);
router.post('/:id/assign-students', protect, authorize('admin'), assignStudents);
router.post('/:id/assign-teachers', protect, authorize('admin'), assignTeachers);
router.post(
  '/import',
  protect,
  authorize('admin'),
  upload.single('file'),
  importClasses,
);

module.exports = router;
