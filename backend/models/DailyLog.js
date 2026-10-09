const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user']
    },
    date: {
      type: Date,
      required: [true, 'Please provide a date']
    },
    mood: {
      type: Number, 
      min: 1,
      max: 5
    },
    energy: {
      type: Number,
      min: 1,
      max: 5
    },
    sleepHours: {
      type: Number,
      min: 0,
      max: 24
    },
    stressLevel: {
      type: Number,
      min: 1,
      max: 5
    },
    hydrationLiters: {
      type: Number,
      min: 0
    },
    cycleDay: {
      type: Number,
      min: 1 // optional, if not tracked it remains empty
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: Ek user ek din mein sirf ek log bana sakta hai
dailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
