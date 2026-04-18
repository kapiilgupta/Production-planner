import express from 'express';
import {
  getInventory,
  getLowStockAlerts,
  updateInventory,
  getInventoryBySku,
} from '../controllers/inventoryController.js';

const router = express.Router();

router.get('/', getInventory);

// MUST be registered BEFORE /:sku to prevent matching "alerts" as a SKU value
router.get('/alerts', getLowStockAlerts);

router.get('/:sku', getInventoryBySku);
router.put('/:sku', updateInventory);

export default router;
