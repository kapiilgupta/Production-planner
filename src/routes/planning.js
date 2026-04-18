import express from 'express';
import {
  generateOrders,
  getOrders,
  getOrderById,
  updateOrderStatus,
} from '../controllers/planningController.js';

const router = express.Router();

router.post('/generate', generateOrders);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);

export default router;
