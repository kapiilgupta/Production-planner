import ScheduleSlot from '../models/ScheduleSlot.js';
import ProductionOrder from '../models/ProductionOrder.js';
import Machine from '../models/Machine.js';

const SHIFT_START_HOUR  = 6;
const BUFFER_MINUTES    = 15;

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60_000);

const shiftStart = (date) => {
  const d = new Date(date);
  d.setHours(SHIFT_START_HOUR, 0, 0, 0);
  return d;
};

const pickEarliestMachine = (pointers) => {
  let earliestId   = null;
  let earliestTime = Infinity;

  for (const [id, time] of Object.entries(pointers)) {
    if (time.getTime() < earliestTime) {
      earliestTime = time.getTime();
      earliestId   = id;
    }
  }

  return earliestId;
};

export const calcDurationMins = (items) =>
  items.reduce(
    (total, item) => total + item.plannedQty * (item.machineMinutesPerUnit || 0),
    0
  );

export const generateSchedule = async (scheduleDate) => {
  const baseDate = scheduleDate ? new Date(scheduleDate) : new Date();
  if (isNaN(baseDate.getTime())) {
    throw new Error(`Invalid scheduleDate: "${scheduleDate}"`);
  }

  // EDD: assign to earliest free machine based on sorted due date
  const orders = await ProductionOrder.find({ status: 'pending' })
    .sort({ dueDate: 1 })
    .lean();

  if (orders.length === 0) {
    console.warn('[schedulingEngine] No pending production orders found.');
    return [];
  }

  const machines = await Machine.find({ isOperational: true })
    .select('name type shiftMinutes')
    .lean();

  if (machines.length === 0) {
    throw new Error('[schedulingEngine] No operational machines available for scheduling.');
  }

  const pointers = {};
  for (const machine of machines) {
    pointers[machine._id.toString()] = shiftStart(baseDate);
  }

  const machineMap = {};
  for (const machine of machines) {
    machineMap[machine._id.toString()] = machine;
  }

  const slotsToCreate = [];

  for (const order of orders) {
    const durationMins = calcDurationMins(order.items || []);

    if (durationMins <= 0) {
      console.warn(`[schedulingEngine] Order ${order.orderNumber} has 0 duration minutes – skipping.`);
      continue;
    }

    const chosenMachineId = pickEarliestMachine(pointers);
    const machine         = machineMap[chosenMachineId];

    const startTime = pointers[chosenMachineId];
    const endTime   = addMinutes(startTime, durationMins);

    slotsToCreate.push({
      productionOrderId: order._id,
      orderNumber:       order.orderNumber,
      machineId:         machine._id,
      machineName:       machine.name,
      startTime,
      endTime,
      durationMinutes:   Math.round(durationMins),
      status:            'scheduled',
      notes:             `EDD schedule – due ${order.dueDate ? order.dueDate.toISOString().slice(0,10) : 'N/A'}`,
    });

    console.log(
      `[schedulingEngine] ${order.orderNumber} → ${machine.name} | ` +
      `${startTime.toISOString()} → ${endTime.toISOString()} (${Math.round(durationMins)} min)`
    );

    pointers[chosenMachineId] = addMinutes(endTime, BUFFER_MINUTES);
  }

  if (slotsToCreate.length === 0) {
    console.log('[schedulingEngine] No valid slots to schedule.');
    return [];
  }

  const createdSlots = await ScheduleSlot.insertMany(slotsToCreate, { ordered: false });

  console.log(`[schedulingEngine] Created ${createdSlots.length} schedule slot(s).`);

  return createdSlots.map((s) => s.toObject());
};
