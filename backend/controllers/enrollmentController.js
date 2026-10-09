const mongoose = require('mongoose');
const ProgramEnrollment = require('../models/ProgramEnrollment');
const Program = require('../models/Program');

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

const createEnrollment = async (req, res) => {
  try {
    const body = req.body || {};
    const { programId } = body;
    
    if (!programId || typeof programId !== 'string' || !/^[a-fA-F0-9]{24}$/.test(programId)) {
      return res.status(400).json({ message: 'programId must be a valid id' });
    }

    const program = await Program.findOne({ _id: programId, isPublished: true });
    if (!program) return res.status(404).json({ message: 'Program not found' });

    const existing = await ProgramEnrollment.findOne({ user: req.user._id, program: programId, status: 'active' });
    if (existing) return res.status(409).json({ message: 'You are already enrolled in this program' });

    let enrollment;
    try {
      enrollment = await ProgramEnrollment.create({
        user: req.user._id,
        program: programId,
        currentDay: 1,
        status: 'active'
      });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ message: 'You are already enrolled in this program' });
      throw err;
    }

    await enrollment.populate('program', 'title image durationDays goal');

    res.status(201).json({
      message: 'Enrolled successfully',
      enrollment: { ...enrollment.toObject(), progressPercent: 0 }
    });
  } catch (error) {
    handleError(res, error, 'Server error creating enrollment');
  }
};

const getEnrollments = async (req, res) => {
  try {
    const query = { user: req.user._id };
    
    if (req.query.status) {
      const allowed = ['active', 'completed', 'abandoned'];
      if (!allowed.includes(req.query.status)) {
        return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
      }
      query.status = req.query.status;
    }

    const enrollments = await ProgramEnrollment.find(query)
      .populate('program', 'title image durationDays goal')
      .sort({ startedAt: -1 });

    const formatted = enrollments.map(enr => {
      const e = enr.toObject();
      let progressPercent = 0;
      if (e.program && e.program.durationDays > 0) {
        progressPercent = Math.round((e.completedDays.length / e.program.durationDays) * 100);
      }
      return { ...e, progressPercent };
    });

    res.status(200).json({ count: formatted.length, enrollments: formatted });
  } catch (error) {
    handleError(res, error, 'Server error fetching enrollments');
  }
};

const getEnrollmentById = async (req, res) => {
  try {
    if (!/^[a-fA-F0-9]{24}$/.test(req.params.id)) return res.status(400).json({ message: 'Invalid id' });

    const enrollment = await ProgramEnrollment.findOne({ _id: req.params.id, user: req.user._id })
      .populate({ 
        path: 'program', 
        populate: [
          { path: 'days.recipes', match: { isPublished: true }, select: 'title image prepTimeMinutes' },
          { path: 'days.workouts', match: { isPublished: true }, select: 'title image durationMinutes difficulty' }
        ] 
      });

    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    const e = enrollment.toObject();
    let progressPercent = 0;
    let currentDayContent = null;

    if (e.program && e.program.durationDays > 0) {
      progressPercent = Math.round((e.completedDays.length / e.program.durationDays) * 100);
      if (e.status === 'active' && e.program.days) {
        currentDayContent = e.program.days.find(d => d.dayNumber === e.currentDay) || null;
      }
    }

    res.status(200).json({ enrollment: e, progressPercent, currentDayContent });
  } catch (error) {
    handleError(res, error, 'Server error fetching enrollment');
  }
};

const completeDay = async (req, res) => {
  try {
    if (!/^[a-fA-F0-9]{24}$/.test(req.params.id)) return res.status(400).json({ message: 'Invalid id' });

    const body = req.body || {};
    if (body.dayNumber === undefined || body.dayNumber === null || body.dayNumber === '' || typeof body.dayNumber === 'boolean') {
      return res.status(400).json({ message: 'dayNumber is required' });
    }
    const dayNumber = Number(body.dayNumber);
    if (!Number.isInteger(dayNumber)) return res.status(400).json({ message: 'dayNumber must be a whole number' });

    const enrollment = await ProgramEnrollment.findOne({ _id: req.params.id, user: req.user._id })
      .populate('program', 'durationDays');

    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    if (enrollment.status !== 'active') return res.status(409).json({ message: 'Enrollment is not active' });
    if (!enrollment.program) return res.status(404).json({ message: 'Program not found' });

    const durationDays = enrollment.program.durationDays;
    
    if (dayNumber < 1 || dayNumber > durationDays) return res.status(400).json({ message: `dayNumber must be between 1 and ${durationDays}` });
    if (dayNumber > enrollment.currentDay) return res.status(400).json({ message: 'You cannot complete a day ahead of your current day' });
    if (enrollment.completedDays.includes(dayNumber)) return res.status(409).json({ message: 'Day already completed' });

    // Atomic update to avoid duplicates
    const updated = await ProgramEnrollment.findOneAndUpdate(
      { _id: enrollment._id, user: req.user._id, status: 'active' },
      { $addToSet: { completedDays: dayNumber } },
      { new: true }
    ).populate('program', 'durationDays');

    if (!updated) return res.status(409).json({ message: 'Enrollment is not active or not found' });

    // Recompute currentDay dynamically
    let newCurrentDay = 1;
    for (let i = 1; i <= durationDays; i++) {
      if (!updated.completedDays.includes(i)) {
        newCurrentDay = i;
        break;
      }
    }
    
    let isCompleted = updated.completedDays.length === durationDays;

    if (isCompleted) {
      updated.status = 'completed';
      updated.completedAt = Date.now();
      updated.currentDay = durationDays;
    } else {
      updated.currentDay = newCurrentDay;
    }

    await updated.save();

    const progressPercent = Math.round((updated.completedDays.length / durationDays) * 100);
    const message = isCompleted ? 'Program completed! Congratulations' : 'Day completed';

    res.status(200).json({ message, enrollment: updated, progressPercent });
  } catch (error) {
    handleError(res, error, 'Server error completing day');
  }
};

const abandonEnrollment = async (req, res) => {
  try {
    if (!/^[a-fA-F0-9]{24}$/.test(req.params.id)) return res.status(400).json({ message: 'Invalid id' });

    const enrollment = await ProgramEnrollment.findOne({ _id: req.params.id, user: req.user._id });
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    if (enrollment.status !== 'active') return res.status(409).json({ message: 'Enrollment is not active' });

    enrollment.status = 'abandoned';
    await enrollment.save();

    res.status(200).json({ message: 'Enrollment abandoned', enrollment });
  } catch (error) {
    handleError(res, error, 'Server error abandoning enrollment');
  }
};

module.exports = { createEnrollment, getEnrollments, getEnrollmentById, completeDay, abandonEnrollment };
