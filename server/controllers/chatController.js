const Message = require('../models/Message');
const Classroom = require('../models/Classroom');

exports.getCommunityMessages = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const messages = await Message.find({
      classroom: classroomId,
      type: 'community'
    })
      .populate('sender', 'name email role')
      .populate('reactions.user', 'name')
      .populate('seenBy.user', 'name')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTeacherStudentMessages = async (req, res) => {
  try {
    const { classroomId, recipientId } = req.params;
    const currentUserId = req.user._id;
    
    const messages = await Message.find({
      classroom: classroomId,
      type: 'teacher-student',
      $or: [
        { sender: currentUserId, recipient: recipientId },
        { sender: recipientId, recipient: currentUserId }
      ]
    })
      .populate('sender', 'name email role')
      .populate('recipient', 'name email role')
      .populate('reactions.user', 'name')
      .populate('seenBy.user', 'name')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentStudentMessages = async (req, res) => {
  try {
    const { classroomId, recipientId } = req.params;
    const currentUserId = req.user._id;
    
    const messages = await Message.find({
      classroom: classroomId,
      type: 'student-student',
      $or: [
        { sender: currentUserId, recipient: recipientId },
        { sender: recipientId, recipient: currentUserId }
      ]
    })
      .populate('sender', 'name email role')
      .populate('recipient', 'name email role')
      .populate('reactions.user', 'name')
      .populate('seenBy.user', 'name')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { classroomId, content, type, recipient } = req.body;
    const sender = req.user._id;
    
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Lớp học không tồn tại' });
    }
    
    const messageData = {
      classroom: classroomId,
      sender,
      content,
      type
    };
    
    if (recipient) {
      messageData.recipient = recipient;
    }
    
    const message = await Message.create(messageData);
    await message.populate('sender', 'name email role');
    if (recipient) {
      await message.populate('recipient', 'name email role');
    }
    
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getChatParticipants = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const classroom = await Classroom.findById(classroomId)
      .populate('teachers', 'name email role')
      .populate('students', 'name email role');
    
    if (!classroom) {
      return res.status(404).json({ message: 'Lớp học không tồn tại' });
    }
    
    const participants = [...(classroom.teachers || []), ...(classroom.students || [])];
    res.json(participants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Tin nhắn không tồn tại' });
    }
    
    message.pinned = !message.pinned;
    if (message.pinned) {
      message.pinnedBy = userId;
      message.pinnedAt = new Date();
    } else {
      message.pinnedBy = undefined;
      message.pinnedAt = undefined;
    }
    
    await message.save();
    await message.populate('sender', 'name email role');
    await message.populate('pinnedBy', 'name');
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPinnedMessages = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const messages = await Message.find({
      classroom: classroomId,
      pinned: true
    })
      .populate('sender', 'name email role')
      .populate('pinnedBy', 'name')
      .sort({ pinnedAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Tin nhắn không tồn tại' });
    }
    
    const existingReactionIndex = message.reactions.findIndex(
      r => r.user.toString() === userId.toString() && r.emoji === emoji
    );
    
    if (existingReactionIndex > -1) {
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      message.reactions.push({ emoji, user: userId });
    }
    
    await message.save();
    await message.populate('sender', 'name email role');
    await message.populate('reactions.user', 'name');
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsSeen = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Tin nhắn không tồn tại' });
    }
    
    const alreadySeen = message.seenBy.some(
      s => s.user.toString() === userId.toString()
    );
    
    if (!alreadySeen) {
      message.seenBy.push({ user: userId });
      message.status = 'seen';
    }
    
    await message.save();
    await message.populate('sender', 'name email role');
    await message.populate('seenBy.user', 'name');
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
