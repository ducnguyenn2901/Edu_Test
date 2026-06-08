const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      default: null,
    },
    avatarUrl: {
      type: String,
      default: '',
      trim: true,
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin', 'mod'],
      default: 'student',
    },
    status: {
      type: String,
      enum: ['active', 'locked', 'pending'],
      default: 'active',
    },
    grade: {
      type: String,
      default: '',
      trim: true,
    },
    className: {
      type: String,
      default: '',
      trim: true,
    },
    school: {
      type: String,
      default: '',
      trim: true,
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    teachingGrades: {
      type: [String],
      default: [],
    },
    teachingClasses: {
      type: [String],
      default: [],
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
