import DemandForecast from '../models/DemandForecast.js';
import Inventory from '../models/Inventory.js';

const MOVING_AVG_N = 3;

export const movingAverage = (history, n = MOVING_AVG_N) => {
  if (!history || history.length === 0) return 0;

  const sorted = [...history].sort((a, b) => a.period.localeCompare(b.period));
  const window  = sorted.slice(-n);
  const total   = window.reduce((sum, h) => sum + (h.soldQty || 0), 0);
  const average = total / window.length;

  return Math.ceil(average);
};

const validatePeriod = (period) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    throw new Error(`Invalid forecastPeriod "${period}". Expected format: YYYY-MM`);
  }
};

export const generateForecast = async (historicalData, forecastPeriod) => {
  validatePeriod(forecastPeriod);

  if (!historicalData || typeof historicalData !== 'object') {
    throw new Error('historicalData must be a non-null object keyed by SKU');
  }

  const skus = Object.keys(historicalData);
  if (skus.length === 0) {
    console.warn('[forecastService] historicalData is empty – nothing to forecast');
    return [];
  }

  const inventoryRecords = await Inventory.find({ sku: { $in: skus } })
    .select('sku productId sizeId')
    .lean();

  const inventoryMap = {};
  for (const rec of inventoryRecords) {
    inventoryMap[rec.sku] = { productId: rec.productId, sizeId: rec.sizeId };
  }

  const results     = [];
  const upsertOps   = [];

  for (const sku of skus) {
    const history     = historicalData[sku];
    const forecastQty = movingAverage(history, MOVING_AVG_N);
    const invInfo     = inventoryMap[sku] || {};

    const periodsUsed = Math.min(history.length, MOVING_AVG_N);

    upsertOps.push({
      updateOne: {
        filter: { sku, forecastPeriod },
        update: {
          $set: {
            sku,
            forecastPeriod,
            forecastQty,
            productId:      invInfo.productId  || null,
            sizeId:         invInfo.sizeId     || null,
            method:         'moving_average',
            confidencePct:  periodsUsed >= MOVING_AVG_N ? 85 : 60,
            notes: `Moving average over ${periodsUsed} period(s). Generated: ${new Date().toISOString()}`,
          },
        },
        upsert: true,
      },
    });

    results.push({ sku, forecastPeriod, forecastQty, periodsUsed });
  }

  if (upsertOps.length > 0) {
    await DemandForecast.bulkWrite(upsertOps, { ordered: false });
  }

  console.log(`[forecastService] Generated ${results.length} forecast(s) for period ${forecastPeriod}`);

  return results;
};
