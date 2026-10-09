const mongoose = require('mongoose');

const programEnrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user']
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: [true, 'Please provide a program']
    },
    currentDay: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active'
    },
    completedDays: {
      type: [Number],
      default: []
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date // Set when status becomes 'completed'
    }
  },
  {
    timestamps: true
  }
);

// Partial Unique Index: Ek user ek program mein ek time par sirf EK "active" enrollment rakh sakta hai
programEnrollmentSchema.index(
  { user: 1, program: 1, status: 1 },
  { 
    unique: true, 
    partialFilterExpression: { status: 'active' } 
  }
);

module.exports = mongoose.model('ProgramEnrollment', programEnrollmentSchema);
