import { Link } from 'react-router-dom';

export function DetailPage({ hero, navItems = [], sections = [], values = [], children }) {
  const heroStyle = hero?.image ? { '--detail-hero-image': `url("${hero.image}")` } : undefined;

  return (
    <main className="detail-page">
      <section className={`detail-hero ${hero?.tone || 'green'}`} style={heroStyle}>
        <div className="detail-hero-copy">
          <p>{hero?.eyebrow}</p>
          <h1>{hero?.title}</h1>
          {hero?.text && <strong>{hero.text}</strong>}
        </div>
        <div className="detail-hero-media" aria-hidden="true" />
      </section>

      {navItems.length > 0 && (
        <nav className="detail-anchor-nav" aria-label="Page sections">
          {navItems.map((item) => (
            <a href={`#${item.id}`} key={item.id}>{item.label}</a>
          ))}
        </nav>
      )}

      {sections.map((section, index) => (
        <section className={section.feature ? 'detail-feature-band' : `detail-row ${section.reverse ? 'reverse' : ''}`} id={section.id} key={section.id}>
          {section.image && <div className="detail-row-image" style={{ backgroundImage: `url("${section.image}")` }} aria-hidden="true" />}
          <div className="detail-row-copy">
            {section.kicker && <p className="eyebrow">{section.kicker}</p>}
            <h2>{section.title}</h2>
            {section.text?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets && (
              <ul>
                {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            )}
            {section.cta && <Link className="detail-cta" to={section.cta.to}>{section.cta.label}</Link>}
          </div>
          {!section.image && <span className="detail-row-number">{String(index + 1).padStart(2, '0')}</span>}
        </section>
      ))}

      {values.length > 0 && (
        <section className="detail-values">
          <h2>Platform values that guide every action</h2>
          <div>
            {values.map((value) => (
              <article key={value.title}>
                <strong>{value.title}</strong>
                <p>{value.text}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {children}

      <a className="back-top" href="#root">Top</a>
    </main>
  );
}
