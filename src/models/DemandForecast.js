import mongoose from 'mongoose';

const PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const DemandForecastSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'productId is required'],
    },
    sizeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'sizeId is required'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true,
    },
    forecastPeriod: {
      type: String,
      required: [true, 'Forecast period is required (format: YYYY-MM)'],
      trim: true,
      validate: {
        validator: (v) => PERIOD_REGEX.test(v),
        message: 'forecastPeriod must be in YYYY-MM format (e.g. "2025-07")',
      },
    },
    forecastQty: {
      type: Number,
      required: [true, 'Forecast quantity is required'],
      min: [0, 'Forecast quantity cannot be negative'],
    },
    actualQty: {
      type: Number,
      min: [0, 'Actual quantity cannot be negative'],
      default: null,
    },
    confidencePct: {
      type: Number,
      min: [0, 'Confidence cannot be below 0'],
      max: [100, 'Confidence cannot exceed 100'],
      default: 80,
    },
    method: {
      type: String,
      enum: {
        values: ['moving_average', 'weighted_average', 'exponential_smoothing', 'manual'],
        message: '{VALUE} is not a recognised forecasting method',
      },
      default: 'moving_average',
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

DemandForecastSchema.index({ sku: 1, forecastPeriod: 1 }, { unique: true });
DemandForecastSchema.index({ productId: 1, forecastPeriod: 1 });

DemandForecastSchema.virtual('forecastAccuracyPct').get(function () {
  if (this.actualQty == null || this.forecastQty === 0) return null;
  const error = Math.abs(this.actualQty - this.forecastQty) / this.forecastQty;
  return Math.max(0, (1 - error) * 100).toFixed(1);
});

export default mongoose.model('DemandForecast', DemandForecastSchema);
