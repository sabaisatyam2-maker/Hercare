const Category = require('../models/Category');
const Recipe = require('../models/Recipe');
const Workout = require('../models/Workout');

// @desc    Create a category (Admin Only)
const createCategory = async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    if (type !== 'recipe' && type !== 'workout') {
      return res.status(400).json({ message: 'Type must be either recipe or workout' });
    }

    const category = await Category.create({ name, type });
    res.status(201).json(category);

  } catch (error) {
    // Handle compound unique index duplicate error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This category already exists for this type' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all categories (Public)
const getCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};

    if (type) {
      filter.type = type;
    }

    const categories = await Category.find(filter).sort({ name: 1 });
    res.status(200).json(categories);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a category (Admin Only)
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const { name, type } = req.body;

    if (name) category.name = name;
    if (type) {
      if (type !== 'recipe' && type !== 'workout') {
        return res.status(400).json({ message: 'Type must be either recipe or workout' });
      }
      category.type = type;
    }

    await category.save();
    res.status(200).json(category);

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This category already exists for this type' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a category (Admin Only)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // IMPORTANT SAFETY CHECK
    const recipeExists = await Recipe.exists({ category: req.params.id });
    const workoutExists = await Workout.exists({ category: req.params.id });

    if (recipeExists || workoutExists) {
      return res.status(400).json({ 
        message: 'Cannot delete — this category is used by existing recipes or workouts' 
      });
    }

    await category.deleteOne();
    res.status(200).json({ message: 'Category removed successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
};
