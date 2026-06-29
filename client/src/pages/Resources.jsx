export default function Resources({ type }) {
  const ngoPage = type === 'ngos';

  return (
    <main className="section">
      <p className="eyebrow">{ngoPage ? 'NGO Partners' : 'Resources'}</p>
      <h1>{ngoPage ? 'Verified NGO coordination for reliable distribution' : 'Food safety, donation, and support resources'}</h1>
      <div className="card-grid">
        {[
          ['Safe pickup windows', 'Prioritize cooked food with clear safe-before times and temperature guidance.'],
          ['Donation quality rules', 'Accept sealed, fresh, clearly labeled food. Decline unsafe or unknown items.'],
          ['Recipient dignity', 'Collect only necessary support details and protect personal information.'],
          ['NGO verification', 'Registration details and service areas are reviewed before operational access.']
        ].map(([title, text]) => (
          <article className="data-card" key={title}><h3>{title}</h3><p>{text}</p></article>
        ))}
      </div>
    </main>
  );
}
