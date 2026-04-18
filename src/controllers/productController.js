import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';

export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, category, sizes } = req.body;

    if (!name || !category || !Array.isArray(sizes) || sizes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'name, category, and at least one size are required.',
      });
    }

    const product = await Product.create({ name, category, sizes });

    const inventoryDocs = product.sizes.map((size) => ({
      productId:      product._id,
      sizeId:         size._id,
      sku:            size.sku,
      quantityOnHand: 0,
      reorderPoint:   50,
    }));

    const inventoryRecords = await Inventory.insertMany(inventoryDocs, {
      ordered: false,
      rawResult: false,
    });

    return res.status(201).json({
      success: true,
      data: {
        product,
        inventoryCreated: inventoryRecords.length,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'One or more SKUs already exist. Please use unique SKUs.',
        keyValue: err.keyValue,
      });
    }
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    return res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const allowed = ['name', 'category', 'isActive'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};
