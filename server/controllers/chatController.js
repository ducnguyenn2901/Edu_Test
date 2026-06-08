const Message = require('../models/Message');
const Classroom = require('../models/Classroom');
const User = require('../models/User');

const isUserIdInClassroom = (classroom, userId) => {
  const id = userId.toString();
  if (classroom.homeroomTeacher?.toString() === id) return true;
  if (classroom.teachers?.some((v) => v.toString() === id)) return true;
  if (classroom.students?.some((v) => v.toString() === id)) return true;
  return false;
};

const isClassroomMember = (classroom, user) => {
  if (user.role === 'admin') return true;
  return isUserIdInClassroom(classroom, user._id);
};

const requireClassroomMember = async (classroomId, user) => {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom)
    return { classroom: null, error: { status: 404, message: 'Lớp học không tồn tại' } };
  if (!isClassroomMember(classroom, user)) {
    return {
      classroom: null,
      error: { status: 403, message: 'Bạn không có quyền truy cập lớp học này' },
    };
  }
  return { classroom, error: null };
};

exports.sendMessage = async (req, res) => {
  try {
    const { classroomId, content, type, recipient } = req.body;
    const sender = req.user._id;

    const { classroom, error } = await requireClassroomMember(classroomId, req.user);
    if (error) return res.status(error.status).json({ message: error.message });

    const messageData = {
      classroom: classroomId,
      sender,
      content,
      type,
    };

    if (recipient) {
      if (!isUserIdInClassroom(classroom, recipient)) {
        return res.status(403).json({ message: 'Người nhận không thuộc lớp học này' });
      }
      messageData.recipient = recipient;
    }

    const message = await Message.create(messageData);
    await message.populate('sender', 'name email role');
    if (recipient) {
      await message.populate('recipient', 'name email');
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCommunityMessages = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { error } = await requireClassroomMember(classroomId, req.user);
    if (error) return res.status(error.status).json({ message: error.message });

    const messages = await Message.find({
      classroom: classroomId,
      type: 'community',
    })
      .populate('sender', 'name email role')
      .populate('reactions.user', 'name')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTeacherStudentMessages = async (req, res) => {
  try {
    const { classroomId, recipientId } = req.params;
    const currentUserId = req.user._id;
    const { classroom, error } = await requireClassroomMember(classroomId, req.user);
    if (error) return res.status(error.status).json({ message: error.message });
    if (!isUserIdInClassroom(classroom, recipientId)) {
      return res.status(403).json({ message: 'Người nhận không thuộc lớp học này' });
    }

    const messages = await Message.find({
      classroom: classroomId,
      type: 'teacher-student',
      $or: [
        { sender: currentUserId, recipient: recipientId },
        { sender: recipientId, recipient: currentUserId },
      ],
    })
      .populate('sender', 'name email role')
      .populate('recipient', 'name email')
      .populate('reactions.user', 'name')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentStudentMessages = async (req, res) => {
  try {
    const { classroomId, recipientId } = req.params;
    const currentUserId = req.user._id;
    const { classroom, error } = await requireClassroomMember(classroomId, req.user);
    if (error) return res.status(error.status).json({ message: error.message });
    if (!isUserIdInClassroom(classroom, recipientId)) {
      return res.status(403).json({ message: 'Người nhận không thuộc lớp học này' });
    }

    const messages = await Message.find({
      classroom: classroomId,
      type: 'student-student',
      $or: [
        { sender: currentUserId, recipient: recipientId },
        { sender: recipientId, recipient: currentUserId },
      ],
    })
      .populate('sender', 'name email role')
      .populate('recipient', 'name email')
      .populate('reactions.user', 'name')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getParticipants = async (req, res) => {
  try {
    const { classroomId } = req.params;

    const { error } = await requireClassroomMember(classroomId, req.user);
    if (error) return res.status(error.status).json({ message: error.message });

    const classroom = await Classroom.findById(classroomId)
      .populate('homeroomTeacher', 'name email role')
      .populate('teachers', 'name email role')
      .populate('students', 'name email role');

    if (!classroom) {
      return res.status(404).json({ message: 'Lớp học không tồn tại' });
    }

    const byId = new Map();
    const pushUser = (u) => {
      if (!u) return;
      byId.set(u._id.toString(), u);
    };

    pushUser(classroom.homeroomTeacher);
    (classroom.teachers || []).forEach(pushUser);
    (classroom.students || []).forEach(pushUser);

    res.json(Array.from(byId.values()));
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
    const { error } = await requireClassroomMember(message.classroom, req.user);
    if (error) return res.status(error.status).json({ message: error.message });

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
    const { error } = await requireClassroomMember(classroomId, req.user);
    if (error) return res.status(error.status).json({ message: error.message });

    const messages = await Message.find({
      classroom: classroomId,
      pinned: true,
    })
      .populate('sender', 'name email role')
      .populate('pinnedBy', 'name')
      .populate('reactions.user', 'name')
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
    const { error } = await requireClassroomMember(message.classroom, req.user);
    if (error) return res.status(error.status).json({ message: error.message });

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === userId.toString() && r.emoji === emoji,
    );

    if (existingReactionIndex !== -1) {
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      const otherReactionIndex = message.reactions.findIndex(
        (r) => r.user.toString() === userId.toString(),
      );

      if (otherReactionIndex !== -1) {
        message.reactions.splice(otherReactionIndex, 1);
      }

      message.reactions.push({
        emoji,
        user: userId,
      });
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
    const { error } = await requireClassroomMember(message.classroom, req.user);
    if (error) return res.status(error.status).json({ message: error.message });

    if (!message.seenBy.includes(userId)) {
      message.seenBy.push(userId);
      message.status = 'seen';
    }

    await message.save();
    await message.populate('sender', 'name email role');

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { error } = await requireClassroomMember(classroomId, req.user);
    if (error) return res.status(error.status).json({ message: error.message });

    const communityMessages = await Message.countDocuments({
      classroom: classroomId,
      type: 'community',
    });

    const teacherStudentMessages = await Message.countDocuments({
      classroom: classroomId,
      type: 'teacher-student',
    });

    const studentStudentMessages = await Message.countDocuments({
      classroom: classroomId,
      type: 'student-student',
    });

    const activeUsers = await Message.distinct('sender', {
      classroom: classroomId,
    });

    const classroom = await Classroom.findById(classroomId);
    const totalMembers = (classroom?.students?.length || 0) + 
                         (classroom?.teachers?.length || 0) + 
                         (classroom?.homeroomTeacher ? 1 : 0);

    res.json({
      communityMessages,
      teacherStudentMessages,
      studentStudentMessages,
      totalMessages: communityMessages + teacherStudentMessages + studentStudentMessages,
      activeUsers: activeUsers.length,
      totalMembers,
      engagementRate: totalMembers > 0 ? Math.round((activeUsers.length / totalMembers) * 100) : 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
