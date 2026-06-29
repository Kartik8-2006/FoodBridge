import { SupportRequest } from '../models/SupportRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createSupportRequest = asyncHandler(async (req, res) => {
  if (req.user.role !== 'recipient' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only recipients can request food support');
  }

  const request = await SupportRequest.create({
    recipient: req.user._id,
    householdSize: req.body.householdSize,
    location: req.body.location,
    need: req.body.need,
    urgency: req.body.urgency
  });

  res.status(201).json({ request });
});
