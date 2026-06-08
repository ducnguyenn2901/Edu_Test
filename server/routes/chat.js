const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendMessage,
  getCommunityMessages,
  getTeacherStudentMessages,
  getStudentStudentMessages,
  getParticipants,
  pinMessage,
  getPinnedMessages,
  toggleReaction,
  markAsSeen,
  getStats,
} = require('../controllers/chatController');

router.post('/send', protect, sendMessage);
router.get('/community/:classroomId', protect, getCommunityMessages);
router.get('/teacher-student/:classroomId/:recipientId', protect, getTeacherStudentMessages);
router.get('/student-student/:classroomId/:recipientId', protect, getStudentStudentMessages);
router.get('/participants/:classroomId', protect, getParticipants);
router.get('/stats/:classroomId', protect, getStats);
router.post('/pin/:messageId', protect, pinMessage);
router.get('/pinned/:classroomId', protect, getPinnedMessages);
router.post('/reaction/:messageId', protect, toggleReaction);
router.post('/seen/:messageId', protect, markAsSeen);

module.exports = router;
