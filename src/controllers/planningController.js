import { generateProductionOrders } from '../services/planningEngine.js';
import ProductionOrder from '../models/ProductionOrder.js';

export const generateOrders = async (req, res, next) => {
  try {
    const { forecastPeriod } = req.body;

    if (!forecastPeriod) {
      return res.status(400).json({
        success: false,
        message: 'forecastPeriod is required (format: YYYY-MM).',
      });
    }

    const orders = await generateProductionOrders(forecastPeriod);

    if (orders.length === 0) {
      return res.json({
        success: true,
        message: 'No production orders needed — current inventory meets all forecast demands.',
        count:   0,
        data:    [],
      });
    }

    return res.status(201).json({
      success: true,
      message: `${orders.length} production order(s) created for period ${forecastPeriod}.`,
      count:   orders.length,
      data:    orders,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.status) {
      const VALID_STATUSES = ['pending', 'in-progress', 'completed', 'cancelled'];
      if (!VALID_STATUSES.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        });
      }
      filter.status = req.query.status;
    }

    if (req.query.productId) {
      filter.productId = req.query.productId;
    }

    const orders = await ProductionOrder.find(filter)
      .populate({ path: 'productId', select: 'name category' })
      .sort({ dueDate: 1 })
      .lean();

    const enriched = orders.map((o) => ({
      ...o,
      totalPlannedQty:      o.items.reduce((s, i) => s + i.plannedQty, 0),
      totalMachineMinutes:  +o.items
        .reduce((s, i) => s + i.plannedQty * i.machineMinutesPerUnit, 0)
        .toFixed(2),
    }));

    return res.json({
      success: true,
      count:   enriched.length,
      data:    enriched,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await ProductionOrder.findById(req.params.id)
      .populate({ path: 'productId', select: 'name category sizes' })
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Production order not found.' });
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const VALID_STATUSES = ['pending', 'in-progress', 'completed', 'cancelled'];
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const order = await ProductionOrder.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    )
      .populate({ path: 'productId', select: 'name category' })
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Production order not found.' });
    }

    return res.json({
      success: true,
      message: `Order ${order.orderNumber} status updated to "${status}".`,
      data:    order,
    });
  } catch (err) {
    next(err);
  }
};
