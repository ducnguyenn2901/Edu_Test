const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Trắc nghiệm', 'Tự luận'],
      default: 'Trắc nghiệm',
    },
    difficulty: {
      type: String,
      enum: ['Dễ', 'Trung bình', 'Khó'],
      default: 'Trung bình',
    },
    subject: {
      type: String,
      required: true,
    },
    grade: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    tags: [String],
    explanation: String,
    weight: {
      type: Number,
      default: 1,
      min: 0,
    },
    answers: [
      {
        id: String,
        content: String,
        isCorrect: Boolean,
      },
    ],
    author: {
      type: String,
      default: 'Unknown',
    },
    needsReview: {
      type: Boolean,
      default: false,
    },
    flags: [
      {
        userId: String,
        role: String,
        reason: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model('Question', questionSchema);
