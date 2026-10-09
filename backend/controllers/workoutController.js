const mongoose = require('mongoose');
const Workout = require('../models/Workout');
const Category = require('../models/Category');
const Program = require('../models/Program');
const deleteImage = require('../utils/deleteImage');
const Favorite = require('../models/Favorite');

// Helpers
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

const validateDuration = (duration) => {
  const d = Number(duration);
  return Number.isInteger(d) && d > 0;
};

const validateVideoUrl = (url) => {
  if (url === "") return true; // Allowed for clearing during update
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const validDifficulties = ['beginner', 'intermediate', 'advanced'];
const validIntensities = ['low-impact', 'moderate', 'high-impact'];

// Controllers
const createWorkout = async (req, res) => {
  let workoutSaved = false;
  try {
    let { title, category, description, steps, durationMinutes, difficulty, intensity, equipmentNeeded, videoUrl, isPublished } = req.body;

    if (typeof steps === 'string') {
      try { steps = JSON.parse(steps); } catch (e) {}
    }
    if (equipmentNeeded !== undefined && typeof equipmentNeeded === 'string') {
      try { equipmentNeeded = JSON.parse(equipmentNeeded); } catch (e) {}
    }

    const stepsVal = validateStringArray(steps, 'steps');
    if (!stepsVal.isValid) {
      if (req.file) await deleteImage(req.file.filename);
      return res.status(400).json({ message: stepsVal.message });
    }
    if (stepsVal.data.length === 0) {
      if (req.file) await deleteImage(req.file.filename);
      return res.status(400).json({ message: 'steps must have at least one item' });
    }
    steps = stepsVal.data;

    if (equipmentNeeded !== undefined) {
      const equipVal = validateStringArray(equipmentNeeded, 'equipmentNeeded');
      if (!equipVal.isValid) {
        if (req.file) await deleteImage(req.file.filename);
        return res.status(400).json({ message: equipVal.message });
      }
      equipmentNeeded = equipVal.data;
    }

    if (durationMinutes === undefined || !validateDuration(durationMinutes)) {
      if (req.file) await deleteImage(req.file.filename);
      return res.status(400).json({ message: 'durationMinutes must be a whole number greater than 0' });
    }

    if (!validDifficulties.includes(difficulty)) {
      if (req.file) await deleteImage(req.file.filename);
      return res.status(400).json({ message: `difficulty must be one of: ${validDifficulties.join(', ')}` });
    }

    if (!validIntensities.includes(intensity)) {
      if (req.file) await deleteImage(req.file.filename);
      return res.status(400).json({ message: `intensity must be one of: ${validIntensities.join(', ')}` });
    }

    if (videoUrl !== undefined && videoUrl !== "") {
      if (!validateVideoUrl(videoUrl)) {
        if (req.file) await deleteImage(req.file.filename);
        return res.status(400).json({ message: 'videoUrl must be a valid http or https URL' });
      }
    }

    if (!mongoose.isValidObjectId(category)) {
      if (req.file) await deleteImage(req.file.filename);
      return res.status(400).json({ message: 'Invalid category id' });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists || categoryExists.type !== 'workout') {
      if (req.file) await deleteImage(req.file.filename);
      return res.status(400).json({ message: 'Invalid workout category' });
    }

    const newWorkoutData = {
      title,
      category,
      description,
      steps,
      durationMinutes: Number(durationMinutes),
      difficulty,
      intensity,
      createdBy: req.user._id
    };

    if (equipmentNeeded !== undefined) newWorkoutData.equipmentNeeded = equipmentNeeded;
    if (videoUrl !== undefined && videoUrl !== "") newWorkoutData.videoUrl = videoUrl;
    if (isPublished !== undefined) newWorkoutData.isPublished = isPublished === 'true' || isPublished === true;

    if (req.file) {
      newWorkoutData.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    const workout = await Workout.create(newWorkoutData);
    workoutSaved = true;

    await workout.populate('category', 'name');
    res.status(201).json({ message: 'Workout created', workout });

  } catch (error) {
    if (req.file && !workoutSaved) await deleteImage(req.file.filename);
    handleError(res, error, 'Server error during workout creation');
  }
};

const getWorkouts = async (req, res) => {
  try {
    const { keyword, category, difficulty, intensity } = req.query;
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
    
    if (difficulty) {
      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({ message: `difficulty must be one of: ${validDifficulties.join(', ')}` });
      }
      query.difficulty = difficulty;
    }
    
    if (intensity) {
      if (!validIntensities.includes(intensity)) {
        return res.status(400).json({ message: `intensity must be one of: ${validIntensities.join(', ')}` });
      }
      query.intensity = intensity;
    }

    const workouts = await Workout.find(query).populate('category', 'name');
    res.status(200).json({ count: workouts.length, workouts });

  } catch (error) {
    handleError(res, error, 'Server error fetching workouts');
  }
};

const getWorkoutById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid workout id' });
    }

    const workout = await Workout.findOne({ _id: req.params.id, isPublished: true }).populate('category', 'name');

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.status(200).json({ workout });
  } catch (error) {
    handleError(res, error, 'Server error fetching workout');
  }
};

const updateWorkout = async (req, res) => {
  let workoutSaved = false;
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      if (req.file && !workoutSaved) await deleteImage(req.file.filename);
      return res.status(400).json({ message: 'Invalid workout id' });
    }

    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      if (req.file && !workoutSaved) await deleteImage(req.file.filename);
      return res.status(404).json({ message: 'Workout not found' });
    }

    let { title, category, description, steps, durationMinutes, difficulty, intensity, equipmentNeeded, videoUrl, isPublished } = req.body;

    if (typeof steps === 'string') {
      try { steps = JSON.parse(steps); } catch (e) {}
    }
    if (equipmentNeeded !== undefined && typeof equipmentNeeded === 'string') {
      try { equipmentNeeded = JSON.parse(equipmentNeeded); } catch (e) {}
    }

    if (category && category !== workout.category.toString()) {
      if (!mongoose.isValidObjectId(category)) {
        if (req.file && !workoutSaved) await deleteImage(req.file.filename);
        return res.status(400).json({ message: 'Invalid category id' });
      }
      const categoryExists = await Category.findById(category);
      if (!categoryExists || categoryExists.type !== 'workout') {
        if (req.file && !workoutSaved) await deleteImage(req.file.filename);
        return res.status(400).json({ message: 'Invalid workout category' });
      }
      workout.category = category;
    }

    if (title !== undefined) workout.title = title;
    if (description !== undefined) workout.description = description;
    
    if (steps !== undefined) {
      const stepsVal = validateStringArray(steps, 'steps');
      if (!stepsVal.isValid) {
        if (req.file && !workoutSaved) await deleteImage(req.file.filename);
        return res.status(400).json({ message: stepsVal.message });
      }
      if (stepsVal.data.length === 0) {
        if (req.file && !workoutSaved) await deleteImage(req.file.filename);
        return res.status(400).json({ message: 'steps must have at least one item' });
      }
      workout.steps = stepsVal.data;
    }
    
    if (durationMinutes !== undefined) {
      if (!validateDuration(durationMinutes)) {
        if (req.file && !workoutSaved) await deleteImage(req.file.filename);
        return res.status(400).json({ message: 'durationMinutes must be a whole number greater than 0' });
      }
      workout.durationMinutes = Number(durationMinutes);
    }
    
    if (difficulty !== undefined) {
      if (!validDifficulties.includes(difficulty)) {
        if (req.file && !workoutSaved) await deleteImage(req.file.filename);
        return res.status(400).json({ message: `difficulty must be one of: ${validDifficulties.join(', ')}` });
      }
      workout.difficulty = difficulty;
    }
    
    if (intensity !== undefined) {
      if (!validIntensities.includes(intensity)) {
        if (req.file && !workoutSaved) await deleteImage(req.file.filename);
        return res.status(400).json({ message: `intensity must be one of: ${validIntensities.join(', ')}` });
      }
      workout.intensity = intensity;
    }
    
    if (equipmentNeeded !== undefined) {
      const equipVal = validateStringArray(equipmentNeeded, 'equipmentNeeded');
      if (!equipVal.isValid) {
        if (req.file && !workoutSaved) await deleteImage(req.file.filename);
        return res.status(400).json({ message: equipVal.message });
      }
      workout.equipmentNeeded = equipVal.data;
    }

    if (videoUrl !== undefined) {
      if (!validateVideoUrl(videoUrl)) {
        if (req.file && !workoutSaved) await deleteImage(req.file.filename);
        return res.status(400).json({ message: 'videoUrl must be a valid http or https URL' });
      }
      workout.videoUrl = videoUrl; // "" par bhi aayega (to clear it out)
    }
    
    if (isPublished !== undefined) workout.isPublished = isPublished === 'true' || isPublished === true;

    const oldImagePublicId = workout.image?.publicId;

    if (req.file) {
      workout.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    const updatedWorkout = await workout.save();
    workoutSaved = true;

    if (req.file && oldImagePublicId) {
      await deleteImage(oldImagePublicId);
    }

    await updatedWorkout.populate('category', 'name');
    res.status(200).json({ message: 'Workout updated', workout: updatedWorkout });

  } catch (error) {
    if (req.file && !workoutSaved) await deleteImage(req.file.filename);
    handleError(res, error, 'Server error updating workout');
  }
};

const deleteWorkout = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid workout id' });
    }

    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    const programCount = await Program.countDocuments({ "days.workouts": req.params.id });
    if (programCount > 0) {
      return res.status(409).json({ message: `Cannot delete: workout is used in ${programCount} program(s)` });
    }

    await workout.deleteOne();

    if (workout.image?.publicId) {
      await deleteImage(workout.image.publicId);
    }

    await Favorite.deleteMany({ itemType: 'workout', item: workout._id });

    res.status(200).json({ message: 'Workout removed successfully' });

  } catch (error) {
    handleError(res, error, 'Server error deleting workout');
  }
};

const getWorkoutsAdmin = async (req, res) => {
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

    if (req.query.difficulty !== undefined) {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      if (!validDifficulties.includes(req.query.difficulty)) {
        return res.status(400).json({ message: `difficulty must be one of: ${validDifficulties.join(', ')}` });
      }
      query.difficulty = req.query.difficulty;
    }

    if (req.query.intensity !== undefined) {
      const validIntensities = ['low-impact', 'moderate', 'high-impact'];
      if (!validIntensities.includes(req.query.intensity)) {
        return res.status(400).json({ message: `intensity must be one of: ${validIntensities.join(', ')}` });
      }
      query.intensity = req.query.intensity;
    }

    const count = await Workout.countDocuments(query);
    const workouts = await Workout.find(query)
      .populate('category', 'name type')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ 
      total: count, page, pages: Math.ceil(count / limit), count: workouts.length, workouts 
    });
  } catch (error) {
    handleError(res, error, 'Server error fetching workouts');
  }
};

const getWorkoutByIdAdmin = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid workout id' });
    }

    const workout = await Workout.findById(req.params.id).populate('category', 'name type');

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.status(200).json({ workout });
  } catch (error) {
    handleError(res, error, 'Server error fetching workout');
  }
};

module.exports = {
  createWorkout,
  getWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
  getWorkoutsAdmin,
  getWorkoutByIdAdmin
};
