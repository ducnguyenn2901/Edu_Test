const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    startAt: {
      type: Date,
    },
    endAt: {
      type: Date,
    },
    grade: {
      type: String,
    },
    tags: [String],
    description: String,
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    randomConfig: {
      enabled: {
        type: Boolean,
        default: false,
      },
      subject: String,
      grade: String,
      difficulties: [String],
      tagFilters: [String],
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
      },
      questionCount: {
        type: Number,
        default: null,
        min: 1,
      },
    },
    scoringConfig: {
      enabled: {
        type: Boolean,
        default: false,
      },
      negativeMarkRatio: {
        type: Number,
        default: 0,
      },
      passScore: {
        type: Number,
        default: 5,
      },
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Archived'],
      default: 'Draft',
    },
    maxAttempts: {
      type: Number,
      default: null,
    },
    targetClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
      },
    ],
    targetStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    attempts: [
      {
        studentId: {
          type: String,
          required: true,
        },
        score: {
          type: Number,
          required: true,
        },
        correctCount: Number,
        totalQuestions: Number,
        timeSpent: Number,
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        answers: [
          {
            questionId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Question',
            },
            answerId: String,
          },
        ],
      },
    ],
    createdBy: {
      type: String, // Can be ObjectId if we have User model
      default: 'Admin',
    },
    isTemplate: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model('Exam', examSchema);
