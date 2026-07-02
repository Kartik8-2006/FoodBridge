import { PartnerNgo } from '../models/PartnerNgo.js';
import { partnerNgoSeed } from '../data/partnerNgos.js';
import { asyncHandler } from '../utils/asyncHandler.js';

async function ensurePartnerDirectory() {
  const count = await PartnerNgo.countDocuments();
  if (count > 0) return;
  await PartnerNgo.insertMany(partnerNgoSeed, { ordered: false });
}

export const listPartnerNgos = asyncHandler(async (req, res) => {
  await ensurePartnerDirectory();

  const filter = { active: true };
  if (typeof req.query.city === 'string' && req.query.city.trim()) {
    filter.city = new RegExp(`^${req.query.city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  }

  const partners = await PartnerNgo.find(filter)
    .select('-createdAt -updatedAt -__v')
    .sort({ city: 1, name: 1 })
    .lean();

  res.json({
    partners,
    cities: [...new Set(partners.map((partner) => partner.city))].sort(),
    total: partners.length
  });
});
