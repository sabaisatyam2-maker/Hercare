const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const uploadSingleImage = require('../middleware/upload');
const {
  createRecipe,
  getRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  getRecipesAdmin,
  getRecipeByIdAdmin
} = require('../controllers/recipeController');

// Public routes
router.get('/', getRecipes);
router.get('/admin', protect, authorize('admin'), getRecipesAdmin);
router.get('/admin/:id', protect, authorize('admin'), getRecipeByIdAdmin);
router.get('/:id', getRecipeById);

// Admin only routes
router.post('/', protect, authorize('admin'), uploadSingleImage, createRecipe);
router.put('/:id', protect, authorize('admin'), uploadSingleImage, updateRecipe);
router.delete('/:id', protect, authorize('admin'), deleteRecipe);

module.exports = router;
