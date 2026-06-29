export default function HowItWorks() {
  return (
    <main className="section">
      <p className="eyebrow">How It Works</p>
      <h1>Built for safe, accountable donation coordination</h1>
      <div className="timeline">
        {[
          ['1', 'Donor posts availability', 'Food details, quantity, pickup location, pickup window, safe-before time, and handling notes are captured.'],
          ['2', 'Partner accepts donation', 'Verified NGOs and volunteers filter available donations by location, timing, food type, and capacity.'],
          ['3', 'Pickup is scheduled', 'Pickup owner, route notes, delivery location, and status updates are tracked in one workflow.'],
          ['4', 'Delivery is verified', 'The donation is marked delivered, creating an auditable impact history for donors and administrators.']
        ].map(([number, title, text]) => (
          <article key={number}><strong>{number}</strong><div><h3>{title}</h3><p>{text}</p></div></article>
        ))}
      </div>
    </main>
  );
}
