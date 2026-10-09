const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const uploadSingleImage = require('../middleware/upload');
const {
  createProgram,
  getPrograms,
  getProgramById,
  getProgramsAdmin,
  getProgramByIdAdmin,
  updateProgram,
  deleteProgram
} = require('../controllers/programController');

router.get('/', getPrograms);
router.get('/admin', protect, authorize('admin'), getProgramsAdmin);
router.get('/admin/:id', protect, authorize('admin'), getProgramByIdAdmin);
router.get('/:id', getProgramById);

router.post('/', protect, authorize('admin'), uploadSingleImage, createProgram);
router.put('/:id', protect, authorize('admin'), uploadSingleImage, updateProgram);
router.delete('/:id', protect, authorize('admin'), deleteProgram);

module.exports = router;
