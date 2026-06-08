const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: false, // Make optional for image-based questions
    },
    contentImage: String, // URL/path to question image
    type: {
      type: String,
      enum: ['Trắc nghiệm', 'Tự luận', 'Đúng/Sai', 'Điền từ', 'Tương tác'],
      default: 'Trắc nghiệm',
    },
    difficulty: {
      type: String,
      enum: ['Dễ', 'Trung bình', 'Khó', 'Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'],
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
        contentImage: String, // URL/path to answer option image
        isCorrect: Boolean,
      },
    ],
    interactive: {
      kind: String,
      data: mongoose.Schema.Types.Mixed,
    },
    author: {
      type: String,
      default: 'Unknown',
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isInQuestionBank: {
      type: Boolean,
      default: true,
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
