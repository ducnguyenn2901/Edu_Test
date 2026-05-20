const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['community', 'teacher-student', 'student-student'],
      default: 'community',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    pinnedAt: {
      type: Date,
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['sent', 'delivered', 'seen'],
      default: 'sent',
    },
    seenBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        seenAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

messageSchema.index({ classroom: 1, type: 1, createdAt: -1 });
messageSchema.index({ classroom: 1, sender: 1, recipient: 1, type: 1, createdAt: -1 });
messageSchema.index({ classroom: 1, pinned: 1 });

module.exports = mongoose.model('Message', messageSchema);
