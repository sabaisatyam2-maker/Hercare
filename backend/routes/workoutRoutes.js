const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const uploadSingleImage = require('../middleware/upload');
const {
  createWorkout,
  getWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
  getWorkoutsAdmin,
  getWorkoutByIdAdmin
} = require('../controllers/workoutController');

// Public routes
router.get('/', getWorkouts);
router.get('/admin', protect, authorize('admin'), getWorkoutsAdmin);
router.get('/admin/:id', protect, authorize('admin'), getWorkoutByIdAdmin);
router.get('/:id', getWorkoutById);

// Admin only routes
router.post('/', protect, authorize('admin'), uploadSingleImage, createWorkout);
router.put('/:id', protect, authorize('admin'), uploadSingleImage, updateWorkout);
router.delete('/:id', protect, authorize('admin'), deleteWorkout);

module.exports = router;
