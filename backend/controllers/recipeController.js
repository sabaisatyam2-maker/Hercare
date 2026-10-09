const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const Category = require('../models/Category');
const Program = require('../models/Program');
const deleteImage = require('../utils/deleteImage');
const Favorite = require('../models/Favorite');

// Helper for generic error handling
const handleError = (res, error, customMessage = 'Server error') => {
  console.error(error);
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(val => val.message)[0];
    return res.status(400).json({ message });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id or value' });
  }
  return res.status(500).json({ message: customMessage });
};

// Helper for escaping regex characters
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const validateStringArray = (arr, fieldName) => {
  if (!Array.isArray(arr)) return { isValid: false, message: `${fieldName} must be an array` };
  const processed = [];
  for (const item of arr) {
    if (typeof item !== 'string') return { isValid: false, message: `Each ${fieldName} item must be a non-empty string` };
    const trimmed = item.trim();
    if (trimmed.length === 0) return { isValid: false, message: `Each ${fieldName} item must be a non-empty string` };
    processed.push(trimmed);
  }
  return { isValid: true, data: processed };
};

const validateString = (val, fieldName) => {
  if (typeof val !== 'string') return { isValid: false, message: `${fieldName} must be a non-empty string` };
  const trimmed = val.trim();
  if (trimmed.length === 0) return { isValid: false, message: `${fieldName} must be a non-empty string` };
  return { isValid: true, data: trimmed };
};

const isValidNumberInput = (val) => {
  if (typeof val === 'number') return true;
  if (typeof val === 'string' && val.trim() !== '') return true;
  return false;
};

const validateNumber = (val, min, max, fieldName) => {
  if (!isValidNumberInput(val)) return { isValid: false, message: `${fieldName} must be a whole number between ${min} and ${max}` };
  const num = Number(val);
  if (!Number.isInteger(num) || num < min || num > max) return { isValid: false, message: `${fieldName} must be a whole number between ${min} and ${max}` };
  return { isValid: true, data: num };
};

const validDietTagsList = [
  'vegetarian',
  'vegan',
  'eggetarian',
  'non-vegetarian',
  'gluten-free',
  'dairy-free',
  'low-carb',
  'pcos-friendly'
];

const createRecipe = async (req, res) => {
  let recipeSaved = false;
  try {
    const body = req.body || {};
    let { title, category, description, ingredients, instructions, prepTimeMinutes, servings, dietTags, isPublished } = body;

    if (typeof ingredients === 'string') {
      try { ingredients = JSON.parse(ingredients); } catch (e) {}
    }
    if (typeof instructions === 'string') {
      try { instructions = JSON.parse(instructions); } catch (e) {}
    }
    if (dietTags && typeof dietTags === 'string') {
      try { dietTags = JSON.parse(dietTags); } catch (e) {}
    }

    if (!mongoose.isValidObjectId(category)) {
      if (req.file && !recipeSaved) await deleteImage(req.file.filename);
      return res.status(400).json({ message: 'Invalid category id' });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists || categoryExists.type !== 'recipe') {
      if (req.file && !recipeSaved) await deleteImage(req.file.filename);
      return res.status(400).json({ message: 'Invalid recipe category' });
    }

    const titleVal = validateString(title, 'title');
    if (!titleVal.isValid) {
      if (req.file && !recipeSaved) await deleteImage(req.file.filename);
      return res.status(400).json({ message: titleVal.message });
    }
    title = titleVal.data;

    const descVal = validateString(description, 'description');
    if (!descVal.isValid) {
      if (req.file && !recipeSaved) await deleteImage(req.file.filename);
      return res.status(400).json({ message: descVal.message });
    }
    description = descVal.data;

    const ingVal = validateStringArray(ingredients, 'ingredients');
    if (!ingVal.isValid || ingVal.data.length === 0) {
      if (req.file && !recipeSaved) await deleteImage(req.file.filename);
      return res.status(400).json({ message: !ingVal.isValid ? ingVal.message : 'ingredients must have at least one item' });
    }
    ingredients = ingVal.data;

    const instVal = validateStringArray(instructions, 'instructions');
    if (!instVal.isValid || instVal.data.length === 0) {
      if (req.file && !recipeSaved) await deleteImage(req.file.filename);
      return res.status(400).json({ message: !instVal.isValid ? instVal.message : 'instructions must have at least one item' });
    }
    instructions = instVal.data;

    const prepVal = validateNumber(prepTimeMinutes, 1, 1440, 'prepTimeMinutes');
    if (!prepVal.isValid) {
      if (req.file && !recipeSaved) await deleteImage(req.file.filename);
      return res.status(400).json({ message: prepVal.message });
    }
    prepTimeMinutes = prepVal.data;

    const servVal = validateNumber(servings, 1, 100, 'servings');
    if (!servVal.isValid) {
      if (req.file && !recipeSaved) await deleteImage(req.file.filename);
      return res.status(400).json({ message: servVal.message });
    }
    servings = servVal.data;

    if (dietTags !== undefined) {
      if (!Array.isArray(dietTags)) {
        if (req.file && !recipeSaved) await deleteImage(req.file.filename);
        return res.status(400).json({ message: 'dietTags must be an array' });
      }
      const uniqueTags = [...new Set(dietTags)];
      for (const tag of uniqueTags) {
        if (!validDietTagsList.includes(tag)) {
          if (req.file && !recipeSaved) await deleteImage(req.file.filename);
          return res.status(400).json({ message: `Invalid diet tag: ${tag}. Allowed values: ${validDietTagsList.join(', ')}` });
        }
      }
      dietTags = uniqueTags;
    }

    const newRecipeData = {
      title,
      category,
      description,
      ingredients,
      instructions,
      prepTimeMinutes,
      servings,
      createdBy: req.user._id
    };

    if (dietTags !== undefined) newRecipeData.dietTags = dietTags;
    if (isPublished !== undefined) newRecipeData.isPublished = isPublished === 'true' || isPublished === true;

    if (req.file) {
      newRecipeData.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    const recipe = await Recipe.create(newRecipeData);
    recipeSaved = true;
    
    await recipe.populate('category', 'name');

    res.status(201).json({ message: 'Recipe created', recipe });

  } catch (error) {
    if (req.file && !recipeSaved) await deleteImage(req.file.filename);
    handleError(res, error, 'Server error during recipe creation');
  }
};

const getRecipes = async (req, res) => {
  try {
    const { keyword, category, dietTag } = req.query;
    const query = { isPublished: true };

    if (keyword !== undefined) {
      if (typeof keyword !== 'string') {
        return res.status(400).json({ message: 'keyword must be a string' });
      }
      query.title = { $regex: escapeRegex(keyword), $options: 'i' };
    }
    
    if (category) {
      if (!mongoose.isValidObjectId(category)) {
        return res.status(400).json({ message: 'Invalid category id' });
      }
      query.category = category;
    }
    
    if (dietTag) {
      query.dietTags = { $in: [dietTag] };
    }

    const recipes = await Recipe.find(query).populate('category', 'name');
    res.status(200).json({ count: recipes.length, recipes });

  } catch (error) {
    handleError(res, error, 'Server error fetching recipes');
  }
};

const getRecipeById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid recipe id' });
    }

    const recipe = await Recipe.findOne({ _id: req.params.id, isPublished: true }).populate('category', 'name');

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.status(200).json({ recipe });
  } catch (error) {
    handleError(res, error, 'Server error fetching recipe');
  }
};

const updateRecipe = async (req, res) => {
  let recipeSaved = false;
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      if (req.file) await deleteImage(req.file.filename);
      return res.status(400).json({ message: 'Invalid recipe id' });
    }

    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      if (req.file) await deleteImage(req.file.filename);
      return res.status(404).json({ message: 'Recipe not found' });
    }

    let { title, category, description, ingredients, instructions, prepTimeMinutes, servings, dietTags, isPublished } = req.body;

    if (typeof ingredients === 'string') {
      try { ingredients = JSON.parse(ingredients); } catch (e) {}
    }
    if (typeof instructions === 'string') {
      try { instructions = JSON.parse(instructions); } catch (e) {}
    }
    if (dietTags && typeof dietTags === 'string') {
      try { dietTags = JSON.parse(dietTags); } catch (e) {}
    }

    if (category && category !== recipe.category.toString()) {
      if (!mongoose.isValidObjectId(category)) {
        if (req.file) await deleteImage(req.file.filename);
        return res.status(400).json({ message: 'Invalid category id' });
      }
      const categoryExists = await Category.findById(category);
      if (!categoryExists || categoryExists.type !== 'recipe') {
        if (req.file) await deleteImage(req.file.filename);
        return res.status(400).json({ message: 'Invalid recipe category' });
      }
      recipe.category = category;
    }

    if (title !== undefined) {
      const titleVal = validateString(title, 'title');
      if (!titleVal.isValid) {
        if (req.file) await deleteImage(req.file.filename);
        return res.status(400).json({ message: titleVal.message });
      }
      recipe.title = titleVal.data;
    }

    if (description !== undefined) {
      const descVal = validateString(description, 'description');
      if (!descVal.isValid) {
        if (req.file) await deleteImage(req.file.filename);
        return res.status(400).json({ message: descVal.message });
      }
      recipe.description = descVal.data;
    }

    if (ingredients !== undefined) {
      const ingVal = validateStringArray(ingredients, 'ingredients');
      if (!ingVal.isValid || ingVal.data.length === 0) {
        if (req.file) await deleteImage(req.file.filename);
        return res.status(400).json({ message: !ingVal.isValid ? ingVal.message : 'ingredients must have at least one item' });
      }
      recipe.ingredients = ingVal.data;
    }

    if (instructions !== undefined) {
      const instVal = validateStringArray(instructions, 'instructions');
      if (!instVal.isValid || instVal.data.length === 0) {
        if (req.file) await deleteImage(req.file.filename);
        return res.status(400).json({ message: !instVal.isValid ? instVal.message : 'instructions must have at least one item' });
      }
      recipe.instructions = instVal.data;
    }

    if (prepTimeMinutes !== undefined) {
      const prepVal = validateNumber(prepTimeMinutes, 1, 1440, 'prepTimeMinutes');
      if (!prepVal.isValid) {
        if (req.file) await deleteImage(req.file.filename);
        return res.status(400).json({ message: prepVal.message });
      }
      recipe.prepTimeMinutes = prepVal.data;
    }

    if (servings !== undefined) {
      const servVal = validateNumber(servings, 1, 100, 'servings');
      if (!servVal.isValid) {
        if (req.file) await deleteImage(req.file.filename);
        return res.status(400).json({ message: servVal.message });
      }
      recipe.servings = servVal.data;
    }

    if (dietTags !== undefined) {
      if (!Array.isArray(dietTags)) {
        if (req.file) await deleteImage(req.file.filename);
        return res.status(400).json({ message: 'dietTags must be an array' });
      }
      const uniqueTags = [...new Set(dietTags)];
      for (const tag of uniqueTags) {
        if (!validDietTagsList.includes(tag)) {
          if (req.file) await deleteImage(req.file.filename);
          return res.status(400).json({ message: `Invalid diet tag: ${tag}. Allowed values: ${validDietTagsList.join(', ')}` });
        }
      }
      recipe.dietTags = uniqueTags;
    }

    if (isPublished !== undefined) {
      recipe.isPublished = isPublished === 'true' || isPublished === true;
    }

    const oldImagePublicId = recipe.image?.publicId;

    if (req.file) {
      recipe.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    const updatedRecipe = await recipe.save();
    recipeSaved = true;

    // After success, delete the old image if a new one was uploaded
    if (req.file && oldImagePublicId) {
      await deleteImage(oldImagePublicId);
    }

    await updatedRecipe.populate('category', 'name');

    res.status(200).json({ message: 'Recipe updated', recipe: updatedRecipe });

  } catch (error) {
    if (req.file && !recipeSaved) await deleteImage(req.file.filename);
    handleError(res, error, 'Server error updating recipe');
  }
};

const deleteRecipe = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid recipe id' });
    }

    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Protection logic against deleting a recipe tied to a program
    const programCount = await Program.countDocuments({ "days.recipes": req.params.id });
    if (programCount > 0) {
      return res.status(409).json({ message: `Cannot delete: recipe is used in ${programCount} program(s)` });
    }

    await recipe.deleteOne();

    if (recipe.image?.publicId) {
      await deleteImage(recipe.image.publicId);
    }

    await Favorite.deleteMany({ itemType: 'recipe', item: recipe._id });

    res.status(200).json({ message: 'Recipe removed successfully' });

  } catch (error) {
    handleError(res, error, 'Server error deleting recipe');
  }
};

const getRecipesAdmin = async (req, res) => {
  try {
    let page = 1;
    if (req.query.page !== undefined) {
      page = Number(req.query.page);
      if (!Number.isInteger(page) || page < 1) {
        return res.status(400).json({ message: 'page must be a positive integer' });
      }
    }

    let limit = 10;
    if (req.query.limit !== undefined) {
      limit = Number(req.query.limit);
      if (!Number.isInteger(limit) || limit < 1) {
        return res.status(400).json({ message: 'limit must be a positive integer' });
      }
    }
    if (limit > 50) limit = 50;

    const query = {};

    if (req.query.q !== undefined) {
      if (typeof req.query.q !== 'string') {
        return res.status(400).json({ message: 'q must be a string' });
      }
      query.title = { $regex: escapeRegex(req.query.q), $options: 'i' };
    }

    if (req.query.category !== undefined) {
      if (!mongoose.isValidObjectId(req.query.category)) {
        return res.status(400).json({ message: 'Invalid category id' });
      }
      query.category = req.query.category;
    }

    if (req.query.isPublished !== undefined) {
      if (req.query.isPublished !== 'true' && req.query.isPublished !== 'false') {
        return res.status(400).json({ message: 'isPublished must be true or false' });
      }
      query.isPublished = req.query.isPublished === 'true';
    }

    if (req.query.dietTag !== undefined) {
      const validTags = [
        'vegetarian', 'vegan', 'eggetarian', 'non-vegetarian', 
        'gluten-free', 'dairy-free', 'low-carb', 'pcos-friendly'
      ];
      if (!validTags.includes(req.query.dietTag)) {
        return res.status(400).json({ message: `dietTag must be one of: ${validTags.join(', ')}` });
      }
      query.dietTags = req.query.dietTag;
    }

    const count = await Recipe.countDocuments(query);
    const recipes = await Recipe.find(query)
      .populate('category', 'name type')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ 
      total: count, page, pages: Math.ceil(count / limit), count: recipes.length, recipes 
    });
  } catch (error) {
    handleError(res, error, 'Server error fetching recipes');
  }
};

const getRecipeByIdAdmin = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid recipe id' });
    }

    const recipe = await Recipe.findById(req.params.id).populate('category', 'name type');

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.status(200).json({ recipe });
  } catch (error) {
    handleError(res, error, 'Server error fetching recipe');
  }
};

module.exports = {
  createRecipe,
  getRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  getRecipesAdmin,
  getRecipeByIdAdmin
};
