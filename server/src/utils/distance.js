function normalize(value = '') {
  return String(value).trim().toLowerCase();
}

export function cityDistanceKm(fromCity, toCity) {
  const from = normalize(fromCity);
  const to = normalize(toCity);

  if (!from || !to) return null;
  if (from === to) return 5;
  return 25;
}

export function addDistanceToDonation(donation, user) {
  const item = typeof donation.toObject === 'function' ? donation.toObject() : donation;
  const donorCity = item.donor?.profile?.city || item.city;
  const userCity = user?.profile?.city || user?.profile?.serviceArea || user?.profile?.address;
  const distanceKm = cityDistanceKm(donorCity, userCity);

  return {
    ...item,
    distanceKm,
    distanceLabel: distanceKm === null ? 'Distance unavailable' : `${distanceKm} km`
  };
}

export function cityRegex(city) {
  const value = String(city || '').trim();
  return value ? new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') : null;
}

export function sortUsersByDistance(users, donorCity) {
  return [...users].sort((a, b) => {
    const aDistance = cityDistanceKm(donorCity, a.profile?.city || a.profile?.serviceArea) ?? 999;
    const bDistance = cityDistanceKm(donorCity, b.profile?.city || b.profile?.serviceArea) ?? 999;
    return aDistance - bDistance;
  });
}
