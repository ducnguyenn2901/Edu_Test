const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'teacher'), getCategories);
router.post('/', protect, authorize('admin', 'teacher'), createCategory);
router.put('/:id', protect, authorize('admin', 'teacher'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;

