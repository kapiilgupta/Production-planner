import mongoose from 'mongoose';

const SizeSchema = new mongoose.Schema(
  {
    sizeLabel: {
      type: String,
      required: [true, 'Size label is required'],
      enum: {
        values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34'],
        message: '{VALUE} is not a valid size label',
      },
    },
    sku: {
      type: String,
      required: [true, 'SKU is required for each size'],
      trim: true,
      uppercase: true,
    },
    machineMinutesPerUnit: {
      type: Number,
      required: [true, 'Machine minutes per unit is required'],
      min: [0.1, 'Machine minutes must be greater than 0'],
    },
    materialQtyPerUnit: {
      type: Number,
      required: [true, 'Material quantity per unit is required'],
      min: [0, 'Material quantity cannot be negative'],
    },
  },
  { _id: true }
);

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [120, 'Product name cannot exceed 120 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: {
        values: ['Tops', 'Bottoms', 'Outerwear', 'Accessories', 'Footwear', 'Other', 'Apparel', 'Activewear', 'Formal'],
        message: '{VALUE} is not a recognised category',
      },
      default: 'Other',
    },
    sizes: {
      type: [SizeSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 1,
        message: 'A product must have at least one size variant',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

ProductSchema.index({ 'sizes.sku': 1 }, { unique: true, sparse: true });
ProductSchema.index({ category: 1, isActive: 1 });

ProductSchema.virtual('skuCount').get(function () {
  return this.sizes ? this.sizes.length : 0;
});

ProductSchema.pre('save', async function () {
  const labels = this.sizes.map((s) => s.sizeLabel);
  const unique = new Set(labels);
  if (unique.size !== labels.length) {
    throw new Error('A product cannot have duplicate size labels');
  }
});

export default mongoose.model('Product', ProductSchema);
