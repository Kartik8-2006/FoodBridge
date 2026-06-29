import { useLanguage } from '../context/LanguageContext.jsx';

export default function Resources({ type }) {
  const { t } = useLanguage();
  const ngoPage = type === 'ngos';

  const cards = [
    { id: "food-safety", title: t('Safe pickup windows'), text: t('Prioritize cooked food with clear safe-before times and temperature guidance.') },
    { id: "donor-handbook", title: t('Donation quality rules'), text: t('Accept sealed, fresh, clearly labeled food. Decline unsafe or unknown items.') },
    { id: "volunteer-guide", title: t('Recipient dignity'), text: t('Collect only necessary support details and protect personal information.') },
    { id: "reports-section", title: t('NGO verification'), text: t('Registration details and service areas are reviewed before operational access.') }
  ];

  return (
    <main className="section">
      <p className="eyebrow">{ngoPage ? t('NGO Partners') : t('Resources')}</p>
      <h1>{ngoPage ? t('Verified NGO coordination for reliable distribution') : t('Food safety, donation, and support resources')}</h1>
      <div className="card-grid">
        {cards.map((card) => (
          <article className="data-card" id={card.id} key={card.title}>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
