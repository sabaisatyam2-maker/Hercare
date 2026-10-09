const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a category name'],
      trim: true
    },
    type: {
      type: String,
      required: [true, 'Please specify the category type'],
      enum: ['recipe', 'workout']
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: The combination of name and type must be unique
categorySchema.index({ name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
