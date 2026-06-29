import { ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Home() {
  const { t } = useLanguage();

  return (
    <main>
      <section className="story-hero" id="our-story">
        <div className="story-copy">
          <p className="script-title">{t("Our story")}</p>
          <h1>{t("Fighting Food Waste Every Day")}</h1>
          <p>
            {t("FoodBridge Network connects surplus meals, verified volunteers, trusted NGOs, and families who need timely support. We create simple pathways to move food from donors to people with dignity, speed, and care.")}
          </p>
          <Link className="maroon-pill" to="/find-food">{t("Find Food")}</Link>
        </div>
        <div className="story-image" aria-label="FoodBridge distribution center" />
      </section>

      <section className="store-promo">
        <button className="slider-arrow left"><ChevronLeft /></button>
        <div className="store-copy">
          <p className="script-title">{t("Show up for your city!")}</p>
          <h2>{t("Treat your community and help us rescue more food. Every action moves meals back to local tables.")}</h2>
          <Link to="/donate-food">{t("Donate Now")}</Link>
        </div>
        <div className="store-preview">
          <div className="store-orange">
            <h3>{t("Welcome to FoodBridge Partner Hub")}</h3>
            <p>{t("Donation drives, pickup teams, verified NGOs, and citywide service programs.")}</p>
            <span>{t("Start Now")}</span>
          </div>
          <div className="store-photo" />
          <div className="store-tile green">{t("Give directly to families")}</div>
          <div className="store-tile dark">{t("Volunteer route kits")}</div>
        </div>
        <button className="slider-arrow right"><ChevronRight /></button>
        <div className="slider-dots"><span /><span /><span /></div>
      </section>

      <section className="feature-cards">
        {[
          [t('Volunteer Opportunities'), t('Help collect, sort, and deliver food to nearby communities.'), '/volunteer', 'volunteer'],
          [t('Find Food'), t('Locate active food support, distribution partners, and assistance requests.'), '/find-food', 'find'],
          [t('Programs'), t('Coordinate recurring donation programs with NGOs, hostels, events, and restaurants.'), '/resources', 'programs']
        ].map(([title, text, path, image]) => (
          <article className="feature-card" key={title}>
            <div className={`feature-image ${image}`} />
            <h3>{title}</h3>
            <p>{text}</p>
            <Link to={path}>{t("Learn More")}</Link>
          </article>
        ))}
      </section>

      <section className="facts-band" id="impact-facts">
        <div className="team-photo" />
        <div className="fact-grid">
          {[
            [t('For every surplus donation posted early, more meals can be delivered safely.'), t('FOOD RESCUE FACT #26'), 'orange'],
            [t('1 in 4 urban families may need short-term meal support during a difficult month.'), t('COMMUNITY FACT #102'), 'green'],
            [t('Verified partners make distribution faster, safer, and more accountable.'), t('NETWORK FACT #78'), 'orange']
          ].map(([title, label, tone]) => (
            <article className={`fact-card ${tone}`} key={label}>
              <Star size={52} fill="currentColor" />
              <h3>{title}</h3>
              <strong>{label}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="latest-news" id="latest-updates">
        <h2 className="script-title">{t("Latest News")}</h2>
        <div className="news-grid">
          <article className="news-card">
            <div className="news-logo">FoodBridge<br />Network</div>
            <div><h3>{t("Serving Hope: Summer 2026")}</h3><Link to="/events">{t("Read More")}</Link></div>
          </article>
          <article className="news-card">
            <div className="news-logo">FoodBridge<br />Network</div>
            <div><h3>{t("From Surplus Shelves to Neighbors' Tables")}</h3><p>{t("Local partners are opening reliable food rescue windows across the city...")}</p><Link to="/resources">{t("Read More")}</Link></div>
          </article>
        </div>
        <Link className="blog-button" to="/resources">{t("Check Out Our Blog")}</Link>
      </section>

      <Link className="back-top" to="/">↑</Link>
    </main>
  );
}
