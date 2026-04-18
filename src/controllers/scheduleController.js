import { generateSchedule } from '../services/schedulingEngine.js';
import ScheduleSlot from '../models/ScheduleSlot.js';
import Machine from '../models/Machine.js';

export const generateScheduleCtrl = async (req, res, next) => {
  try {
    const { scheduleDate } = req.body;

    if (!scheduleDate) {
      return res.status(400).json({
        success: false,
        message: 'scheduleDate is required (ISO date string, e.g. "2025-08-01").',
      });
    }

    const parsedDate = new Date(scheduleDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: `"${scheduleDate}" is not a valid date.`,
      });
    }

    const slots = await generateSchedule(parsedDate);

    if (slots.length === 0) {
      return res.json({
        success: true,
        message: 'No pending orders to schedule.',
        count:   0,
        data:    [],
      });
    }

    return res.status(201).json({
      success: true,
      message: `${slots.length} schedule slot(s) created.`,
      count:   slots.length,
      data:    slots,
    });
  } catch (err) {
    next(err);
  }
};

export const getSchedule = async (req, res, next) => {
  try {
    const { date, machineId, status } = req.query;
    const filter = {};

    if (date) {
      const start = new Date(date);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          message: `"${date}" is not a valid date. Use YYYY-MM-DD format.`,
        });
      }
      const end = new Date(start);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      filter.startTime = { $gte: start, $lte: end };
    }

    if (machineId) filter.machineId = machineId;
    if (status)    filter.status    = status;

    const slots = await ScheduleSlot.find(filter)
      .populate({ path: 'machineId',         select: 'name type shiftMinutes' })
      .populate({ path: 'productionOrderId', select: 'orderNumber status dueDate' })
      .sort({ startTime: 1 });

    const data = slots.map((s) => s.toObject());

    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

export const getMachines = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.operational !== undefined) {
      filter.isOperational = req.query.operational === 'true';
    }

    const machines = await Machine.find(filter).sort({ name: 1 }).lean();

    return res.json({ success: true, count: machines.length, data: machines });
  } catch (err) {
    next(err);
  }
};

export const createMachine = async (req, res, next) => {
  try {
    const { name, type, shiftMinutes, isOperational, location, notes } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'name and type are required.',
      });
    }

    const machine = await Machine.create({
      name,
      type,
      shiftMinutes:  shiftMinutes  ?? 480,
      isOperational: isOperational ?? true,
      location:      location      || '',
      notes:         notes         || '',
    });

    return res.status(201).json({ success: true, data: machine.toObject() });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

export const getUtilization = async (req, res, next) => {
  try {
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: `"${req.query.date}" is not a valid date.`,
      });
    }

    const dayStart = new Date(targetDate);
    const dayEnd   = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    dayEnd.setHours(23, 59, 59, 999);

    const slots = await ScheduleSlot.find({
      startTime: { $gte: dayStart, $lte: dayEnd },
      status:    { $in: ['scheduled', 'in-progress', 'completed'] },
    })
      .select('machineId machineName durationMinutes status')
      .lean();

    const machines = await Machine.find().select('name type shiftMinutes').lean();

    const scheduledMap = {};
    const slotCountMap = {};

    for (const slot of slots) {
      const id = slot.machineId.toString();
      scheduledMap[id] = (scheduledMap[id] || 0) + (slot.durationMinutes || 0);
      slotCountMap[id] = (slotCountMap[id] || 0) + 1;
    }

    const report = machines.map((m) => {
      const id               = m._id.toString();
      const scheduledMinutes = scheduledMap[id] || 0;
      const utilizationPct   = m.shiftMinutes > 0
        ? +((scheduledMinutes / m.shiftMinutes) * 100).toFixed(1)
        : 0;

      return {
        machineId:        m._id,
        machineName:      m.name,
        type:             m.type,
        shiftMinutes:     m.shiftMinutes,
        scheduledMinutes,
        utilizationPct,
        slotsCount:       slotCountMap[id] || 0,
        status:           utilizationPct === 0 ? 'idle'
                        : utilizationPct < 80  ? 'normal'
                        : utilizationPct < 100 ? 'high'
                        : 'over-scheduled',
      };
    });

    report.sort((a, b) => b.utilizationPct - a.utilizationPct);

    return res.json({
      success: true,
      date:    targetDate.toISOString().slice(0, 10),
      count:   report.length,
      data:    report,
    });
  } catch (err) {
    next(err);
  }
};
