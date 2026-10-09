const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a workout title'],
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please assign a category']
    },
    description: {
      type: String,
      required: [true, 'Please add a description']
    },
    steps: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'A workout must have at least one step'
      }
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Please add duration in minutes']
    },
    difficulty: {
      type: String,
      required: [true, 'Please specify the difficulty level'],
      enum: ['beginner', 'intermediate', 'advanced']
    },
    intensity: {
      type: String,
      required: [true, 'Please specify the intensity level'],
      enum: ['low-impact', 'moderate', 'high-impact']
    },
    equipmentNeeded: {
      type: [String],
      default: []
    },
    videoUrl: {
      type: String
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
    }
  },
  {
    timestamps: true
  }
);

// Text index for search functionality on title and description
workoutSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Workout', workoutSchema);
