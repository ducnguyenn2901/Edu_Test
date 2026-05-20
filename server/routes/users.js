const express = require('express');
const router = express.Router();
const {
  getUsers,
  getStudents,
  createUser,
  updateUser,
  toggleLockUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), getUsers);
router.get('/students', protect, authorize('admin', 'teacher'), getStudents);
router.post('/', protect, authorize('admin'), createUser);
router.patch('/:id', protect, authorize('admin'), updateUser);
router.patch('/:id/lock', protect, authorize('admin'), toggleLockUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
