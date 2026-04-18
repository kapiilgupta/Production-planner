import Inventory from '../models/Inventory.js';

export const getInventory = async (req, res, next) => {
  try {
    const records = await Inventory.find()
      .populate({
        path:   'productId',
        select: 'name category isActive',
      })
      .sort({ sku: 1 });

    const data = records.map((r) => r.toObject());

    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

export const updateInventory = async (req, res, next) => {
  try {
    const { sku } = req.params;
    const { quantityOnHand, reorderPoint } = req.body;

    if (quantityOnHand === undefined) {
      return res.status(400).json({
        success: false,
        message: 'quantityOnHand is required in the request body.',
      });
    }

    if (typeof quantityOnHand !== 'number' || quantityOnHand < 0) {
      return res.status(400).json({
        success: false,
        message: 'quantityOnHand must be a non-negative number.',
      });
    }

    const updateFields = { quantityOnHand };
    if (reorderPoint !== undefined) updateFields.reorderPoint = reorderPoint;

    const record = await Inventory.findOneAndUpdate(
      { sku: sku.toUpperCase() },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate({ path: 'productId', select: 'name category' });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `No inventory record found for SKU "${sku}".`,
      });
    }

    return res.json({ success: true, data: record.toObject() });
  } catch (err) {
    next(err);
  }
};

export const getLowStockAlerts = async (req, res, next) => {
  try {
    const records = await Inventory.find({
      $expr: { $lt: ['$quantityOnHand', '$reorderPoint'] },
    })
      .populate({ path: 'productId', select: 'name category' })
      .sort({ quantityOnHand: 1 });

    const data = records.map((r) => r.toObject());

    return res.json({
      success:  true,
      count:    data.length,
      hasAlerts: data.length > 0,
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getInventoryBySku = async (req, res, next) => {
  try {
    const record = await Inventory.findOne({
      sku: req.params.sku.toUpperCase(),
    }).populate({ path: 'productId', select: 'name category sizes' });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `SKU "${req.params.sku}" not found in inventory.`,
      });
    }

    return res.json({ success: true, data: record.toObject() });
  } catch (err) {
    next(err);
  }
};
