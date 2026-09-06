// Shared demo data used by both:
//  - `npm run seed`          (full reset + insert, manual)
//  - seedDemoData.js (auto)  (inserts only missing demo rows on server start)
export const DEMO_PASSWORD = 'Password123!';

export const demoUsers = [
  {
    name: 'Anika Sharma',
    email: 'donor@foodbridge.org',
    role: 'donor',
    profile: {
      organizationName: 'Harvest Table Events',
      foodSourceType: 'event',
      city: 'Bengaluru',
      address: 'Indiranagar, Bengaluru',
      phone: '+91 98765 43210',
      verificationStatus: 'not_required'
    }
  },
  {
    name: 'Seva Meals Foundation',
    email: 'ngo@foodbridge.org',
    role: 'ngo',
    profile: {
      registrationNumber: 'NGO-4821-KA',
      contactPerson: 'Rahul Menon',
      serviceArea: 'Bengaluru East',
      city: 'Bengaluru',
      phone: '+91 98765 43211',
      verificationStatus: 'pending'
    }
  },
  {
    name: 'Meera Iyer',
    email: 'volunteer@foodbridge.org',
    role: 'volunteer',
    profile: {
      availability: 'Weekday evenings and weekends',
      hasTransport: true,
      serviceRadiusKm: 12,
      city: 'Bengaluru',
      phone: '+91 98765 43212',
      verificationStatus: 'not_required'
    }
  },
  {
    name: 'FoodBridge Admin',
    email: 'admin@foodbridge.org',
    role: 'admin',
    profile: { verificationStatus: 'not_required' }
  }
];

export function demoDonations(donorId) {
  const now = new Date();
  return [
    {
      donor: donorId,
      title: 'Fresh vegetable biryani trays',
      foodType: 'cooked',
      dietType: 'veg',
      quantity: '6 hotel pans',
      estimatedMeals: 95,
      pickupAddress: 'Harvest Table Events, Indiranagar, Bengaluru',
      pickupLocation: { latitude: 12.9784, longitude: 77.6408, label: 'Harvest Table Events' },
      city: 'Bengaluru',
      pickupWindowStart: new Date(now.getTime() + 60 * 60 * 1000),
      pickupWindowEnd: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      safeBefore: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      storageInstructions: 'Keep covered and warm until pickup.',
      allergenNotes: 'Contains dairy and cashews.',
      status: 'posted'
    },
    {
      donor: donorId,
      title: 'Packaged bread and fruit boxes',
      foodType: 'packaged',
      dietType: 'veg',
      quantity: '40 sealed boxes',
      estimatedMeals: 40,
      pickupAddress: 'Community Hall, Koramangala, Bengaluru',
      pickupLocation: { latitude: 12.9352, longitude: 77.6245, label: 'Community Hall Koramangala' },
      city: 'Bengaluru',
      pickupWindowStart: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      pickupWindowEnd: new Date(now.getTime() + 5 * 60 * 60 * 1000),
      safeBefore: new Date(now.getTime() + 18 * 60 * 60 * 1000),
      storageInstructions: 'Room temperature storage is acceptable.',
      allergenNotes: 'Contains wheat.',
      status: 'posted'
    },
    {
      donor: donorId,
      title: 'Restaurant dinner meal packs',
      foodType: 'packaged',
      dietType: 'mixed',
      quantity: '55 sealed meal packs',
      estimatedMeals: 55,
      pickupAddress: 'Restaurant ABC, MG Road, Bengaluru',
      pickupLocation: { latitude: 12.9756, longitude: 77.6068, label: 'Restaurant ABC MG Road' },
      city: 'Bengaluru',
      pickupWindowStart: new Date(now.getTime() + 90 * 60 * 1000),
      pickupWindowEnd: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      safeBefore: new Date(now.getTime() + 10 * 60 * 60 * 1000),
      storageInstructions: 'Keep sealed. Pickup from rear service counter.',
      allergenNotes: 'Contains wheat and dairy.',
      contactNumber: '+91 98765 43214',
      status: 'posted'
    }
  ];
}