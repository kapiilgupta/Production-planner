import express from 'express';
import {
  generateScheduleCtrl,
  getSchedule,
  getUtilization,
} from '../controllers/scheduleController.js';

const router = express.Router();

router.post('/generate', generateScheduleCtrl);
router.get('/utilization', getUtilization);
router.get('/', getSchedule);

export default router;
