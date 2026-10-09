const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a recipe title'],
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
    ingredients: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'A recipe must have at least one ingredient'
      }
    },
    instructions: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'A recipe must have at least one instruction step'
      }
    },
    prepTimeMinutes: {
      type: Number,
      required: [true, 'Please add preparation time in minutes']
    },
    servings: {
      type: Number,
      required: [true, 'Please add number of servings']
    },
    dietTags: [
      {
        type: String,
        enum: [
          'vegetarian',
          'vegan',
          'eggetarian',
          'non-vegetarian',
          'gluten-free',
          'dairy-free',
          'low-carb',
          'pcos-friendly'
        ]
      }
    ],
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
recipeSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Recipe', recipeSchema);
