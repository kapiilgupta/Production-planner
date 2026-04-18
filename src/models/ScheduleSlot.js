import mongoose from 'mongoose';

const ScheduleSlotSchema = new mongoose.Schema(
  {
    productionOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionOrder',
      required: [true, 'productionOrderId is required'],
    },
    orderNumber: {
      type: String,
      required: [true, 'orderNumber is required'],
      trim: true,
      uppercase: true,
    },
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine',
      required: [true, 'machineId is required'],
    },
    machineName: {
      type: String,
      required: [true, 'machineName is required'],
      trim: true,
    },
    startTime: {
      type: Date,
      required: [true, 'startTime is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'endTime is required'],
    },
    durationMinutes: {
      type: Number,
      min: [1, 'Duration must be at least 1 minute'],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['scheduled', 'in-progress', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid slot status',
      },
      default: 'scheduled',
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

ScheduleSlotSchema.index({ machineId: 1, startTime: 1, endTime: 1 });
ScheduleSlotSchema.index({ productionOrderId: 1 });
ScheduleSlotSchema.index({ status: 1, startTime: 1 });

ScheduleSlotSchema.pre('validate', async function () {
  if (this.startTime && this.endTime) {
    if (this.endTime <= this.startTime) {
      throw new Error('endTime must be after startTime');
    }

    if (this.durationMinutes == null) {
      this.durationMinutes = Math.round(
        (this.endTime.getTime() - this.startTime.getTime()) / 60_000
      );
    }
  }
});

ScheduleSlotSchema.virtual('durationFormatted').get(function () {
  if (!this.durationMinutes) return null;
  const h   = Math.floor(this.durationMinutes / 60);
  const min = this.durationMinutes % 60;
  if (h === 0)   return `${min} min`;
  if (min === 0) return `${h} h`;
  return `${h} h ${min} min`;
});

ScheduleSlotSchema.virtual('isRunning').get(function () {
  if (this.status !== 'in-progress') return false;
  const now = Date.now();
  return this.startTime.getTime() <= now && now <= this.endTime.getTime();
});

export default mongoose.model('ScheduleSlot', ScheduleSlotSchema);
