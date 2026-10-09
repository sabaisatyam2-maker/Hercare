const mongoose = require('mongoose');
const Favorite = require('../models/Favorite');
const Recipe = require('../models/Recipe');
const Workout = require('../models/Workout');

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

const addFavorite = async (req, res) => {
  try {
    const body = req.body || {};
    const { itemType, itemId } = body;
    
    if (itemType !== 'recipe' && itemType !== 'workout') {
      return res.status(400).json({ message: 'itemType must be "recipe" or "workout"' });
    }
    if (!itemId || typeof itemId !== 'string' || !/^[a-fA-F0-9]{24}$/.test(itemId)) {
      return res.status(400).json({ message: 'Invalid itemId' });
    }

    let itemExists = false;
    if (itemType === 'recipe') {
      const recipe = await Recipe.findOne({ _id: itemId, isPublished: true });
      if (recipe) itemExists = true;
    } else {
      const workout = await Workout.findOne({ _id: itemId, isPublished: true });
      if (workout) itemExists = true;
    }

    if (!itemExists) return res.status(404).json({ message: 'Item not found' });

    const existing = await Favorite.findOne({ user: req.user._id, itemType, item: itemId });
    if (existing) return res.status(409).json({ message: 'Already in favorites' });

    let favorite;
    try {
      favorite = await Favorite.create({ user: req.user._id, itemType, item: itemId });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ message: 'Already in favorites' });
      throw err;
    }

    res.status(201).json({ message: 'Added to favorites', favorite });
  } catch (error) {
    handleError(res, error, 'Server error adding to favorites');
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    
    if (itemType !== 'recipe' && itemType !== 'workout') {
      return res.status(400).json({ message: 'itemType must be "recipe" or "workout"' });
    }
    if (!itemId || !/^[a-fA-F0-9]{24}$/.test(itemId)) {
      return res.status(400).json({ message: 'Invalid itemId' });
    }

    const favorite = await Favorite.findOneAndDelete({ user: req.user._id, itemType, item: itemId });
    if (!favorite) return res.status(404).json({ message: 'Favorite not found' });

    res.status(200).json({ message: 'Removed from favorites' });
  } catch (error) {
    handleError(res, error, 'Server error removing favorite');
  }
};

const getFavorites = async (req, res) => {
  try {
    const query = { user: req.user._id };
    
    if (req.query.type) {
      if (req.query.type !== 'recipe' && req.query.type !== 'workout') {
        return res.status(400).json({ message: 'type must be "recipe" or "workout"' });
      }
      query.itemType = req.query.type;
    }

    const favorites = await Favorite.find(query).sort({ createdAt: -1 }).limit(200);

    const recipeIds = [];
    const workoutIds = [];

    favorites.forEach(f => {
      if (f.itemType === 'recipe') recipeIds.push(f.item);
      else if (f.itemType === 'workout') workoutIds.push(f.item);
    });

    const populatedRecipes = {};
    if (recipeIds.length > 0) {
      const recipes = await Recipe.find({ _id: { $in: recipeIds }, isPublished: true }).populate('category', 'name');
      recipes.forEach(r => populatedRecipes[r._id.toString()] = r);
    }

    const populatedWorkouts = {};
    if (workoutIds.length > 0) {
      const workouts = await Workout.find({ _id: { $in: workoutIds }, isPublished: true }).populate('category', 'name');
      workouts.forEach(w => populatedWorkouts[w._id.toString()] = w);
    }

    const results = [];
    favorites.forEach(f => {
      const itemIdStr = f.item.toString();
      let populatedItem = null;
      
      if (f.itemType === 'recipe') populatedItem = populatedRecipes[itemIdStr];
      else if (f.itemType === 'workout') populatedItem = populatedWorkouts[itemIdStr];

      if (populatedItem) {
        results.push({
          _id: f._id,
          itemType: f.itemType,
          createdAt: f.createdAt,
          item: populatedItem
        });
      }
    });

    res.status(200).json({ count: results.length, favorites: results });
  } catch (error) {
    handleError(res, error, 'Server error fetching favorites');
  }
};

module.exports = { addFavorite, getFavorites, removeFavorite };
