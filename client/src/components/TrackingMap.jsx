import { MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function TrackingMap({ donation }) {
  const { t } = useLanguage();

  if (!donation) {
    return (
      <div className="tracking-map-container">
        <div className="tracking-map-placeholder">
          <MapPin />
          <strong>{t('No Location')}</strong>
          <span>{t('Select a donation to view its location')}</span>
        </div>
      </div>
    );
  }

  const pickupAddress = donation?.pickupAddress || '';
  const city = donation?.city || '';
  const locationString = `${pickupAddress} ${city}`.trim();

  if (!locationString) {
    return (
      <div className="tracking-map-container">
        <div className="tracking-map-placeholder">
          <MapPin />
          <strong>{t('Location Unavailable')}</strong>
          <span>{t('Pickup location details are not provided')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tracking-map-container">
      <iframe
        title="Donation pickup location"
        src={`https://maps.google.com/maps?q=${encodeURIComponent(locationString)}&output=embed`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '8px'
        }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
