import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'productId (reference to Product) is required'],
    },
    sizeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'sizeId (reference to Product.sizes._id) is required'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true,
      unique: true,
    },
    quantityOnHand: {
      type: Number,
      required: [true, 'Quantity on hand is required'],
      min: [0, 'Quantity on hand cannot be negative'],
      default: 0,
    },
    reorderPoint: {
      type: Number,
      required: true,
      min: [0, 'Reorder point cannot be negative'],
      default: 50,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

InventorySchema.index({ productId: 1, sizeId: 1 }, { unique: true });

InventorySchema.virtual('needsReorder').get(function () {
  return this.quantityOnHand <= this.reorderPoint;
});

InventorySchema.virtual('stockGap').get(function () {
  return this.reorderPoint - this.quantityOnHand;
});

export default mongoose.model('Inventory', InventorySchema);
