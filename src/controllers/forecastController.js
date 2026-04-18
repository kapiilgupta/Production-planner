import { generateForecast } from '../services/forecastService.js';
import DemandForecast from '../models/DemandForecast.js';

export const generateForecastCtrl = async (req, res, next) => {
  try {
    const { forecastPeriod, historicalData } = req.body;

    if (!forecastPeriod) {
      return res.status(400).json({
        success: false,
        message: 'forecastPeriod is required (format: YYYY-MM).',
      });
    }

    if (!historicalData || typeof historicalData !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'historicalData is required and must be an object keyed by SKU.',
      });
    }

    if (Object.keys(historicalData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'historicalData must contain at least one SKU.',
      });
    }

    const results = await generateForecast(historicalData, forecastPeriod);

    return res.status(201).json({
      success: true,
      forecastPeriod,
      count:   results.length,
      data:    results,
    });
  } catch (err) {
    next(err);
  }
};

export const getForecasts = async (req, res, next) => {
  try {
    const { period, sku } = req.query;

    if (!period) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "period" is required (format: YYYY-MM).',
      });
    }

    const filter = { forecastPeriod: period };
    if (sku) filter.sku = sku.toUpperCase();

    const forecasts = await DemandForecast.find(filter)
      .populate({ path: 'productId', select: 'name category' })
      .sort({ sku: 1 })
      .lean();

    return res.json({
      success: true,
      period,
      count:   forecasts.length,
      data:    forecasts,
    });
  } catch (err) {
    next(err);
  }
};

export const getForecastPeriods = async (req, res, next) => {
  try {
    const periods = await DemandForecast.distinct('forecastPeriod');
    periods.sort().reverse();

    return res.json({ success: true, count: periods.length, data: periods });
  } catch (err) {
    next(err);
  }
};

export const recordActualDemand = async (req, res, next) => {
  try {
    const { actualQty } = req.body;

    if (actualQty === undefined || typeof actualQty !== 'number' || actualQty < 0) {
      return res.status(400).json({
        success: false,
        message: 'actualQty must be a non-negative number.',
      });
    }

    const forecast = await DemandForecast.findByIdAndUpdate(
      req.params.id,
      { $set: { actualQty } },
      { new: true, runValidators: true }
    ).lean();

    if (!forecast) {
      return res.status(404).json({ success: false, message: 'Forecast not found.' });
    }

    return res.json({ success: true, data: forecast });
  } catch (err) {
    next(err);
  }
};
