const mongoose = require('mongoose');
const DailyLog = require('../models/DailyLog');

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

const parseLogDate = (str) => {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const dateObj = new Date(str + "T00:00:00.000Z");
  if (isNaN(dateObj.getTime())) return null;
  if (dateObj.toISOString().slice(0, 10) !== str) return null;
  return dateObj;
};

// Strict check for null, booleans, empty strings, arrays, objects
const isValidNumberInput = (val) => {
  if (typeof val === 'number') return true;
  if (typeof val === 'string' && val.trim() !== '') return true;
  return false;
};

const validateLogFields = (body, isUpdate = false) => {
  const update = {};
  let hasField = false;
  const wholeNums = ['mood', 'energy', 'stressLevel'];
  
  for (const f of wholeNums) {
    if (body[f] !== undefined) {
      if (!isValidNumberInput(body[f])) {
        return { isValid: false, message: `${f} must be a whole number between 1 and 5` };
      }
      const val = Number(body[f]);
      if (!Number.isFinite(val) || !Number.isInteger(val) || val < 1 || val > 5) {
        return { isValid: false, message: `${f} must be a whole number between 1 and 5` };
      }
      update[f] = val;
      hasField = true;
    }
  }

  if (body.sleepHours !== undefined) {
    if (!isValidNumberInput(body.sleepHours)) {
      return { isValid: false, message: `sleepHours must be a number between 0 and 24` };
    }
    const val = Number(body.sleepHours);
    if (!Number.isFinite(val) || val < 0 || val > 24) {
      return { isValid: false, message: `sleepHours must be a number between 0 and 24` };
    }
    update.sleepHours = val;
    hasField = true;
  }

  if (body.hydrationLiters !== undefined) {
    if (!isValidNumberInput(body.hydrationLiters)) {
      return { isValid: false, message: `hydrationLiters must be a number between 0 and 20` };
    }
    const val = Number(body.hydrationLiters);
    if (!Number.isFinite(val) || val < 0 || val > 20) {
      return { isValid: false, message: `hydrationLiters must be a number between 0 and 20` };
    }
    update.hydrationLiters = val;
    hasField = true;
  }

  if (body.cycleDay !== undefined) {
    if (!isValidNumberInput(body.cycleDay)) {
      return { isValid: false, message: `cycleDay must be a whole number between 1 and 90` };
    }
    const val = Number(body.cycleDay);
    if (!Number.isFinite(val) || !Number.isInteger(val) || val < 1 || val > 90) {
      return { isValid: false, message: `cycleDay must be a whole number between 1 and 90` };
    }
    update.cycleDay = val;
    hasField = true;
  }

  if (body.notes !== undefined) {
    if (typeof body.notes !== 'string') return { isValid: false, message: `notes must be a string` };
    const trimmed = body.notes.trim();
    if (trimmed.length > 1000) return { isValid: false, message: `notes cannot exceed 1000 characters` };
    update.notes = trimmed;
    
    if (isUpdate) {
      hasField = true; // Updates with "" are valid
    } else {
      if (trimmed.length > 0) hasField = true; // Create ignores ""
    }
  }

  if (!hasField) return { isValid: false, message: 'Provide at least one log field' };
  
  return { isValid: true, data: update };
};

// --- Controllers ---

const createDailyLog = async (req, res) => {
  try {
    const body = req.body || {};
    const { date } = body;
    if (!date) return res.status(400).json({ message: 'date is required' });

    const parsedDate = parseLogDate(date);
    if (!parsedDate) return res.status(400).json({ message: 'date must be a valid date in YYYY-MM-DD format' });

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (parsedDate > tomorrow) return res.status(400).json({ message: 'date cannot be in the future' });

    const validation = validateLogFields(body, false);
    if (!validation.isValid) return res.status(400).json({ message: validation.message });

    const existingLog = await DailyLog.findOne({ user: req.user._id, date: parsedDate });
    if (existingLog) return res.status(409).json({ message: 'A log for this date already exists. Use update instead.' });

    const logData = { ...validation.data, user: req.user._id, date: parsedDate };
    
    let log;
    try {
      log = await DailyLog.create(logData);
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ message: 'A log for this date already exists. Use update instead.' });
      throw err;
    }

    res.status(201).json({ message: 'Daily log created', log });
  } catch (error) {
    handleError(res, error, 'Server error creating daily log');
  }
};

const getDailyLogs = async (req, res) => {
  try {
    let toDateStr = req.query.to;
    let fromDateStr = req.query.from;
    
    let toDate;
    if (toDateStr) {
      toDate = parseLogDate(toDateStr);
      if (!toDate) return res.status(400).json({ message: 'to date must be a valid date in YYYY-MM-DD format' });
    } else {
      const now = new Date();
      toDateStr = now.toISOString().slice(0, 10);
      toDate = new Date(toDateStr + "T00:00:00.000Z");
    }

    let fromDate;
    if (fromDateStr) {
      fromDate = parseLogDate(fromDateStr);
      if (!fromDate) return res.status(400).json({ message: 'from date must be a valid date in YYYY-MM-DD format' });
    } else {
      fromDate = new Date(toDate.getTime() - 29 * 24 * 60 * 60 * 1000);
    }

    if (fromDate > toDate) return res.status(400).json({ message: 'from must not be after to' });

    const daysDiff = (toDate - fromDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > 366) return res.status(400).json({ message: 'Date range cannot exceed 366 days' });

    const logs = await DailyLog.find({
      user: req.user._id,
      date: { $gte: fromDate, $lte: toDate }
    }).sort({ date: -1 });

    res.status(200).json({ count: logs.length, logs });
  } catch (error) {
    handleError(res, error, 'Server error fetching daily logs');
  }
};

const getDailyLogByDate = async (req, res) => {
  try {
    const parsedDate = parseLogDate(req.params.date);
    if (!parsedDate) return res.status(400).json({ message: 'date must be a valid date in YYYY-MM-DD format' });

    const log = await DailyLog.findOne({ user: req.user._id, date: parsedDate });
    if (!log) return res.status(404).json({ message: 'No log found for this date' });

    res.status(200).json({ log });
  } catch (error) {
    handleError(res, error, 'Server error fetching daily log');
  }
};

const updateDailyLog = async (req, res) => {
  try {
    const body = req.body || {};
    const parsedDate = parseLogDate(req.params.date);
    if (!parsedDate) return res.status(400).json({ message: 'date must be a valid date in YYYY-MM-DD format' });

    const validation = validateLogFields(body, true);
    if (!validation.isValid) return res.status(400).json({ message: validation.message });

    const log = await DailyLog.findOne({ user: req.user._id, date: parsedDate });
    if (!log) return res.status(404).json({ message: 'No log found for this date' });

    for (const key in validation.data) {
      log[key] = validation.data[key];
    }
    await log.save();

    res.status(200).json({ message: 'Daily log updated', log });
  } catch (error) {
    handleError(res, error, 'Server error updating daily log');
  }
};

module.exports = { createDailyLog, getDailyLogs, getDailyLogByDate, updateDailyLog };
