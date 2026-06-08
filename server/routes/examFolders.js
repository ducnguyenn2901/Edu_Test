const express = require('express');
const router = express.Router();

const {
  getMyExamFolders,
  createExamFolder,
  updateExamFolder,
  deleteExamFolder,
} = require('../controllers/examFolderController');

const { protect, authorize } = require('../middleware/auth');

router.get('/mine', protect, authorize('teacher', 'admin'), getMyExamFolders);
router.post('/', protect, authorize('teacher', 'admin'), createExamFolder);
router.put('/:id', protect, authorize('teacher', 'admin'), updateExamFolder);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteExamFolder);

module.exports = router;
