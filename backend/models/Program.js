const mongoose = require('mongoose');

// Chhota embedded schema har din ke liye (separate collection nahi banegi)
const dayActivitySchema = new mongoose.Schema(
  {
    dayNumber: {
      type: Number,
      required: [true, 'Please add a day number']
    },
    title: {
      type: String,
      required: [true, 'Please add a title for this day']
    },
    recipes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'
      }
    ],
    workouts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workout'
      }
    ],
    tasks: [String]
  },
  { _id: false } // Disable _id for embedded array items
);

// Main Program Schema
const programSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a program title'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please add a description']
    },
    durationDays: {
      type: Number,
      required: [true, 'Please specify the duration in days'],
      enum: [7, 14, 21, 30]
    },
    goal: {
      type: String,
      required: [true, 'Please add a goal for this program']
    },
    image: {
      url: {
        type: String
      },
      publicId: {
        type: String
      }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isPublished: {
      type: Boolean,
      default: true
    },
    days: {
      type: [dayActivitySchema],
      validate: {
        // Custom validator function
        validator: function (v) {
          // 'this' refers to the current Program document
          // 'v' is the days array
          return v && v.length === this.durationDays;
        },
        message: 'Number of days must match durationDays'
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Program', programSchema);
