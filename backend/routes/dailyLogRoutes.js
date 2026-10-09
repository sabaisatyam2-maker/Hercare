const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createDailyLog,
  getDailyLogs,
  getDailyLogByDate,
  updateDailyLog
} = require('../controllers/dailyLogController');

router.use(protect);

router.post('/', createDailyLog);
router.get('/', getDailyLogs);
router.get('/:date', getDailyLogByDate);
router.put('/:date', updateDailyLog);

module.exports = router;
