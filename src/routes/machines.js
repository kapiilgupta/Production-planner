import express from 'express';
import Machine from '../models/Machine.js';
import {
  getMachines,
  createMachine,
} from '../controllers/scheduleController.js';

const router = express.Router();

router.get('/', getMachines);
router.post('/', createMachine);

router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'type', 'shiftMinutes', 'isOperational', 'location', 'notes'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const machine = await Machine.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    if (!machine) return res.status(404).json({ success: false, message: 'Machine not found.' });
    return res.json({ success: true, data: machine });
  } catch(err) { next(err); }
});

export default router;
