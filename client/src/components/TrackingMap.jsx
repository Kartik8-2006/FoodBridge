import { LocateFixed, MapPin, Navigation, Truck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { formatDate, titleCase } from '../utils.js';

function hasCoordinates(location) {
  return Number.isFinite(Number(location?.latitude)) && Number.isFinite(Number(location?.longitude));
}

function coordinateQuery(location) {
  return `${location.latitude},${location.longitude}`;
}

function addressQuery(address, city) {
  return [address, city].filter(Boolean).join(', ');
}

function pickupQuery(donation) {
  if (hasCoordinates(donation?.pickupLocation)) return coordinateQuery(donation.pickupLocation);
  return addressQuery(donation?.pickupAddress, donation?.city);
}

function deliveryQuery(donation) {
  if (hasCoordinates(donation?.deliveryLocation)) return coordinateQuery(donation.deliveryLocation);
  return donation?.deliveryAddress || '';
}

function volunteerQuery(donation) {
  if (hasCoordinates(donation?.volunteerLocation)) return coordinateQuery(donation.volunteerLocation);
  return '';
}

function mapUrl(query) {
  return query ? `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed` : '';
}

function directionsUrl(origin, destination) {
  if (!destination) return '#';
  const params = new URLSearchParams({
    api: '1',
    destination
  });
  if (origin) params.set('origin', origin);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export default function TrackingMap({ donation, mode = 'viewer', onShareLocation, isSharing = false }) {
  const { t } = useLanguage();

  if (!donation) {
    return (
      <div className="tracking-empty">
        <MapPin />
        <strong>{t('No Location')}</strong>
        <span>{t('Select a donation to view route tracking.')}</span>
      </div>
    );
  }

  const pickup = pickupQuery(donation);
  const delivery = deliveryQuery(donation);
  const volunteer = volunteerQuery(donation);
  const destination = donation.status === 'picked_up' || donation.status === 'delivered'
    ? delivery || pickup
    : pickup || delivery;
  const shownPoint = volunteer || destination;
  const routeLink = directionsUrl(volunteer, destination);
  const lastUpdated = donation.volunteerLocation?.updatedAt
    ? formatDate(donation.volunteerLocation.updatedAt)
    : t('Waiting for volunteer location');

  return (
    <div className="tracking-card">
      <div className="tracking-map-frame">
        {shownPoint ? (
          <iframe title={`${donation.title} tracking map`} src={mapUrl(shownPoint)} />
        ) : (
          <div className="tracking-empty">
            <MapPin />
            <strong>{t('Location Unavailable')}</strong>
            <span>{t('Pickup or volunteer location will appear here.')}</span>
          </div>
        )}
      </div>

      <div className="tracking-route">
        <div className="tracking-route-heading">
          <span className="status">{t(titleCase(donation.status))}</span>
          <strong>{donation.title}</strong>
          <small>{lastUpdated}</small>
        </div>

        <div className="tracking-point-list">
          <div>
            <MapPin size={18} />
            <span><strong>{t('Pickup')}</strong><small>{donation.pickupAddress || t('Pickup pending')}</small></span>
          </div>
          <div>
            <Truck size={18} />
            <span><strong>{t('Volunteer')}</strong><small>{volunteer ? donation.volunteerLocation?.label || t('Live location shared') : t('Not shared yet')}</small></span>
          </div>
          <div>
            <Navigation size={18} />
            <span><strong>{t('Drop-off')}</strong><small>{donation.deliveryAddress || t('Set when NGO schedules pickup')}</small></span>
          </div>
        </div>

        <div className="tracking-actions">
          <a href={routeLink} target="_blank" rel="noreferrer">
            <Navigation size={16} /> {t('Open route')}
          </a>
          {mode === 'volunteer' && (
            <button type="button" onClick={onShareLocation} disabled={isSharing}>
              <LocateFixed size={16} /> {isSharing ? t('Sharing...') : t('Share location')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
