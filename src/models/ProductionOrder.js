import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema(
  {
    sizeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'sizeId is required on each order item'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required on each order item'],
      trim: true,
      uppercase: true,
    },
    sizeLabel: {
      type: String,
      required: [true, 'Size label is required on each order item'],
      enum: {
        values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34'],
        message: '{VALUE} is not a valid size label',
      },
    },
    plannedQty: {
      type: Number,
      required: [true, 'Planned quantity is required'],
      min: [1, 'Planned quantity must be at least 1'],
    },
    machineMinutesPerUnit: {
      type: Number,
      required: [true, 'Machine minutes per unit is required on each order item'],
      min: [0.1, 'Machine minutes must be greater than 0'],
    },
  },
  { _id: true }
);

OrderItemSchema.virtual('totalMachineMinutes').get(function () {
  return +(this.plannedQty * this.machineMinutesPerUnit).toFixed(2);
});

const ProductionOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'productId is required'],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['pending', 'in-progress', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'pending',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    items: {
      type: [OrderItemSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 1,
        message: 'A production order must contain at least one item',
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

ProductionOrderSchema.index({ status: 1, dueDate: 1 });
ProductionOrderSchema.index({ productId: 1 });

ProductionOrderSchema.virtual('totalPlannedQty').get(function () {
  return (this.items || []).reduce((sum, item) => sum + item.plannedQty, 0);
});

ProductionOrderSchema.virtual('totalMachineMinutes').get(function () {
  return +(this.items || [])
    .reduce((sum, item) => sum + item.plannedQty * item.machineMinutesPerUnit, 0)
    .toFixed(2);
});

ProductionOrderSchema.pre('validate', async function () {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('ProductionOrder').countDocuments();
    this.orderNumber = `PO-${String(count + 1).padStart(5, '0')}`;
  }
});

export default mongoose.model('ProductionOrder', ProductionOrderSchema);
