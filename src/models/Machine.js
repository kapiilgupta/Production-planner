import mongoose from 'mongoose';

const MachineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Machine name is required'],
      trim: true,
      maxlength: [100, 'Machine name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      required: [true, 'Machine type is required'],
      trim: true,
      enum: {
        values: [
          'Sewing',
          'Cutting',
          'Pressing',
          'Packing',
          'Embroidery',
          'Printing',
          'CNC',
          'Assembly',
          'Other',
        ],
        message: '{VALUE} is not a recognised machine type',
      },
      default: 'Other',
    },
    shiftMinutes: {
      type: Number,
      required: true,
      min: [60, 'Shift must be at least 60 minutes'],
      max: [1440, 'Shift cannot exceed 1440 minutes (24 h)'],
      default: 480,
    },
    isOperational: {
      type: Boolean,
      default: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [120, 'Location cannot exceed 120 characters'],
      default: '',
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

MachineSchema.index({ isOperational: 1, type: 1 });

MachineSchema.virtual('shiftHours').get(function () {
  return +(this.shiftMinutes / 60).toFixed(2);
});

export default mongoose.model('Machine', MachineSchema);
