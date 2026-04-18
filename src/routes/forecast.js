import express from 'express';
import {
  generateForecastCtrl,
  getForecasts,
  getForecastPeriods,
  recordActualDemand,
} from '../controllers/forecastController.js';

const router = express.Router();

router.post('/generate', generateForecastCtrl);
router.get('/periods', getForecastPeriods);
router.get('/', getForecasts);
router.patch('/:id/actual', recordActualDemand);

export default router;
