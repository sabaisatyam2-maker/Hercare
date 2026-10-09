const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createEnrollment,
  getEnrollments,
  getEnrollmentById,
  completeDay,
  abandonEnrollment
} = require('../controllers/enrollmentController');

router.use(protect);

router.post('/', createEnrollment);
router.get('/', getEnrollments);
router.get('/:id', getEnrollmentById);
router.put('/:id/complete-day', completeDay);
router.put('/:id/abandon', abandonEnrollment);

module.exports = router;
