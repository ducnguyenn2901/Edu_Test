const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/send', chatController.sendMessage);
router.get('/community/:classroomId', chatController.getCommunityMessages);
router.get('/teacher-student/:classroomId/:recipientId', chatController.getTeacherStudentMessages);
router.get('/student-student/:classroomId/:recipientId', chatController.getStudentStudentMessages);
router.get('/participants/:classroomId', chatController.getChatParticipants);
router.put('/pin/:messageId', chatController.pinMessage);
router.get('/pinned/:classroomId', chatController.getPinnedMessages);
router.post('/reaction/:messageId', chatController.toggleReaction);
router.put('/seen/:messageId', chatController.markAsSeen);

module.exports = router;
