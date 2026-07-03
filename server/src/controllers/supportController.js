import { SupportRequest } from '../models/SupportRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createSupportRequest = asyncHandler(async (req, res) => {
  if (!['ngo', 'admin'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Only NGOs and admins can create food support requests');
  }

  const request = await SupportRequest.create({
    requester: req.user._id,
    householdSize: req.body.householdSize,
    location: req.body.location,
    need: req.body.need,
    urgency: req.body.urgency
  });

  res.status(201).json({ request });
});
