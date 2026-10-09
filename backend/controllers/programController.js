const mongoose = require('mongoose');
const Program = require('../models/Program');
const ProgramEnrollment = require('../models/ProgramEnrollment');
const Recipe = require('../models/Recipe');
const Workout = require('../models/Workout');
const deleteImage = require('../utils/deleteImage');

// --- Helpers ---
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

const verifyIdsExist = async (Model, ids) => {
  const uniqueIds = [...new Set(ids.map(id => id.toString()))];
  if (uniqueIds.length === 0) return true;
  
  for (const id of uniqueIds) {
    if (!mongoose.isValidObjectId(id)) return false;
  }
  
  const count = await Model.countDocuments({ _id: { $in: uniqueIds } });
  return count === uniqueIds.length;
};

// Main nested JSON days array validation logic
const validateDays = async (days, durationDays) => {
  if (!Array.isArray(days)) {
    return { isValid: false, message: 'days must be an array' };
  }
  if (days.length !== durationDays) {
    return { isValid: false, message: `days length must be exactly ${durationDays}` };
  }

  const cleanedDays = [];
  const allRecipeIds = [];
  const allWorkoutIds = [];
  const objectIdRegex = /^[a-fA-F0-9]{24}$/;
  const dayNumbers = [];

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    // plain object check
    if (!day || typeof day !== 'object' || Array.isArray(day)) {
      return { isValid: false, message: 'Each day must be an object' };
    }

    const dNum = Number(day.dayNumber);
    if (!Number.isInteger(dNum)) {
      return { isValid: false, message: 'dayNumber must be an integer' };
    }
    dayNumbers.push(dNum);

    if (!day.title || typeof day.title !== 'string' || day.title.trim().length === 0) {
      return { isValid: false, message: 'Each day must have a non-empty title string' };
    }

    let recipes = [];
    if (day.recipes !== undefined) {
      if (!Array.isArray(day.recipes)) return { isValid: false, message: `recipes must be an array in day ${dNum}` };
      for (const r of day.recipes) {
        if (typeof r !== 'string' || !objectIdRegex.test(r)) {
          return { isValid: false, message: `Invalid recipe id in day ${dNum}` };
        }
      }
      recipes = day.recipes;
    }

    let workouts = [];
    if (day.workouts !== undefined) {
      if (!Array.isArray(day.workouts)) return { isValid: false, message: `workouts must be an array in day ${dNum}` };
      for (const w of day.workouts) {
        if (typeof w !== 'string' || !objectIdRegex.test(w)) {
          return { isValid: false, message: `Invalid workout id in day ${dNum}` };
        }
      }
      workouts = day.workouts;
    }

    let tasks = [];
    if (day.tasks !== undefined) {
      if (!Array.isArray(day.tasks)) return { isValid: false, message: `tasks must be an array in day ${dNum}` };
      for (const t of day.tasks) {
        if (typeof t !== 'string' || t.trim().length === 0) {
          return { isValid: false, message: `Each task must be a non-empty string in day ${dNum}` };
        }
        tasks.push(t.trim());
      }
    }

    allRecipeIds.push(...recipes);
    allWorkoutIds.push(...workouts);

    cleanedDays.push({
      dayNumber: dNum,
      title: day.title.trim(),
      recipes,
      workouts,
      tasks
    });
  }

  // Validate dayNumbers strictly 1 to N sequence without gaps
  dayNumbers.sort((a, b) => a - b);
  for (let i = 0; i < durationDays; i++) {
    if (dayNumbers[i] !== i + 1) {
      return { isValid: false, message: 'dayNumber must be exactly 1 to durationDays with no gaps or duplicates' };
    }
  }

  cleanedDays.sort((a, b) => a.dayNumber - b.dayNumber);

  // Validate existence directly via ID arrays after Regex checks passed
  const recipesExist = await verifyIdsExist(Recipe, allRecipeIds);
  if (!recipesExist) return { isValid: false, message: 'One or more recipes do not exist' };

  const workoutsExist = await verifyIdsExist(Workout, allWorkoutIds);
  if (!workoutsExist) return { isValid: false, message: 'One or more workouts do not exist' };

  return { isValid: true, data: cleanedDays };
};

// --- Controllers ---

const createProgram = async (req, res) => {
  let programSaved = false;
  try {
    let { title, description, durationDays, goal, isPublished, days } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      if (req.file) await deleteImage(req.file.filename);
      return res.status(400).json({ message: 'title is required and must be a non-empty string' });
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      if (req.file) await deleteImage(req.file.filename);
      return res.status(400).json({ message: 'description is required and must be a non-empty string' });
    }
    if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
      if (req.file) await deleteImage(req.file.filename);
      return res.status(400).json({ message: 'goal is required and must be a non-empty string' });
    }

    const duration = Number(durationDays);
    if (![7, 14, 21, 30].includes(duration)) {
      if (req.file) await deleteImage(req.file.filename);
      return res.status(400).json({ message: 'durationDays must be 7, 14, 21, or 30' });
    }

    if (typeof days === 'string') {
      try {
        days = JSON.parse(days);
      } catch (e) {
        if (req.file) await deleteImage(req.file.filename);
        return res.status(400).json({ message: 'days must be valid JSON' });
      }
    }

    const daysVal = await validateDays(days, duration);
    if (!daysVal.isValid) {
      if (req.file) await deleteImage(req.file.filename);
      return res.status(400).json({ message: daysVal.message });
    }

    const newProgramData = {
      title: title.trim(),
      description: description.trim(),
      durationDays: duration,
      goal: goal.trim(),
      days: daysVal.data,
      createdBy: req.user._id
    };

    if (isPublished !== undefined) {
      newProgramData.isPublished = isPublished === 'true' || isPublished === true;
    }

    if (req.file) {
      newProgramData.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    const program = await Program.create(newProgramData);
    programSaved = true;

    res.status(201).json({ message: 'Program created', program });
  } catch (error) {
    if (req.file && !programSaved) await deleteImage(req.file.filename);
    handleError(res, error, 'Server error during program creation');
  }
};

const getPrograms = async (req, res) => {
  try {
    const { keyword, durationDays } = req.query;
    const query = { isPublished: true };

    if (keyword !== undefined) {
      if (typeof keyword !== 'string') return res.status(400).json({ message: 'keyword must be a string' });
      query.title = { $regex: escapeRegex(keyword), $options: 'i' };
    }
    if (durationDays !== undefined) {
      const dur = Number(durationDays);
      if (![7, 14, 21, 30].includes(dur)) return res.status(400).json({ message: 'durationDays must be 7, 14, 21, or 30' });
      query.durationDays = dur;
    }

    const programs = await Program.find(query).select('-days').sort({ createdAt: -1 });
    res.status(200).json({ count: programs.length, programs });
  } catch (error) {
    handleError(res, error, 'Server error fetching programs');
  }
};

const getProgramById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid program id' });

    const program = await Program.findOne({ _id: req.params.id, isPublished: true })
      .populate({ 
        path: 'days.recipes', 
        match: { isPublished: true }, 
        select: 'title image prepTimeMinutes' 
      })
      .populate({ 
        path: 'days.workouts', 
        match: { isPublished: true }, 
        select: 'title image durationMinutes difficulty' 
      });

    if (!program) return res.status(404).json({ message: 'Program not found' });
    res.status(200).json({ program });
  } catch (error) {
    handleError(res, error, 'Server error fetching program');
  }
};

const getProgramsAdmin = async (req, res) => {
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
      if (typeof req.query.q !== 'string') return res.status(400).json({ message: 'q must be a string' });
      query.title = { $regex: escapeRegex(req.query.q), $options: 'i' };
    }
    
    if (req.query.isPublished !== undefined) {
      if (req.query.isPublished !== 'true' && req.query.isPublished !== 'false') {
        return res.status(400).json({ message: 'isPublished must be true or false' });
      }
      query.isPublished = req.query.isPublished === 'true';
    }

    const count = await Program.countDocuments(query);
    const programs = await Program.find(query)
      .select('-days')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ 
      total: count, page, pages: Math.ceil(count / limit), count: programs.length, programs 
    });
  } catch (error) {
    handleError(res, error, 'Server error fetching programs');
  }
};

const getProgramByIdAdmin = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid program id' });

    const program = await Program.findById(req.params.id)
      .populate('days.recipes', 'title image prepTimeMinutes')
      .populate('days.workouts', 'title image durationMinutes difficulty');

    if (!program) return res.status(404).json({ message: 'Program not found' });
    res.status(200).json({ program });
  } catch (error) {
    handleError(res, error, 'Server error fetching program');
  }
};

const updateProgram = async (req, res) => {
  let programSaved = false;
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      if (req.file) await deleteImage(req.file.filename);
      return res.status(400).json({ message: 'Invalid program id' });
    }

    const program = await Program.findById(req.params.id);
    if (!program) {
      if (req.file) await deleteImage(req.file.filename);
      return res.status(404).json({ message: 'Program not found' });
    }

    let { title, description, durationDays, goal, isPublished, days } = req.body;

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        if (req.file) await deleteImage(req.file.filename);
        return res.status(400).json({ message: 'title must be a non-empty string' });
      }
      program.title = title.trim();
    }
    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        if (req.file) await deleteImage(req.file.filename);
        return res.status(400).json({ message: 'description must be a non-empty string' });
      }
      program.description = description.trim();
    }
    if (goal !== undefined) {
      if (typeof goal !== 'string' || goal.trim().length === 0) {
        if (req.file) await deleteImage(req.file.filename);
        return res.status(400).json({ message: 'goal must be a non-empty string' });
      }
      program.goal = goal.trim();
    }

    let targetDuration = program.durationDays;
    let durationChanged = false;

    if (durationDays !== undefined) {
      const dur = Number(durationDays);
      if (![7, 14, 21, 30].includes(dur)) {
        if (req.file) await deleteImage(req.file.filename);
        return res.status(400).json({ message: 'durationDays must be 7, 14, 21, or 30' });
      }
      if (dur !== program.durationDays) {
        durationChanged = true;
        targetDuration = dur;
      }
    }

    if (durationChanged && days === undefined) {
      if (req.file) await deleteImage(req.file.filename);
      return res.status(400).json({ message: 'days must be provided when durationDays changes' });
    }

    if (days !== undefined) {
      if (typeof days === 'string') {
        try { days = JSON.parse(days); } catch (e) {
          if (req.file) await deleteImage(req.file.filename);
          return res.status(400).json({ message: 'days must be valid JSON' });
        }
      }

      const daysVal = await validateDays(days, targetDuration);
      if (!daysVal.isValid) {
        if (req.file) await deleteImage(req.file.filename);
        return res.status(400).json({ message: daysVal.message });
      }
      program.days = daysVal.data;
      if (durationChanged) program.durationDays = targetDuration;
    }

    if (isPublished !== undefined) {
      program.isPublished = isPublished === 'true' || isPublished === true;
    }

    const oldImagePublicId = program.image?.publicId;

    if (req.file) {
      program.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    const updatedProgram = await program.save();
    programSaved = true;

    if (req.file && oldImagePublicId) await deleteImage(oldImagePublicId);

    await updatedProgram.populate('days.recipes', 'title image prepTimeMinutes');
    await updatedProgram.populate('days.workouts', 'title image durationMinutes difficulty');

    res.status(200).json({ message: 'Program updated', program: updatedProgram });
  } catch (error) {
    if (req.file && !programSaved) await deleteImage(req.file.filename);
    handleError(res, error, 'Server error updating program');
  }
};

const deleteProgram = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid program id' });

    const program = await Program.findById(req.params.id);
    if (!program) return res.status(404).json({ message: 'Program not found' });

    const enrollmentCount = await ProgramEnrollment.countDocuments({ program: req.params.id });
    if (enrollmentCount > 0) {
      return res.status(409).json({ 
        message: `Cannot delete: ${enrollmentCount} enrollment(s) exist. Unpublish the program instead (set isPublished to false).` 
      });
    }

    await program.deleteOne();
    if (program.image?.publicId) await deleteImage(program.image.publicId);

    res.status(200).json({ message: 'Program removed successfully' });
  } catch (error) {
    handleError(res, error, 'Server error deleting program');
  }
};

module.exports = {
  createProgram,
  getPrograms,
  getProgramById,
  getProgramsAdmin,
  getProgramByIdAdmin,
  updateProgram,
  deleteProgram
};
