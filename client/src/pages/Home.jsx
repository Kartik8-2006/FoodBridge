import { ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main>
      <section className="story-hero">
        <div className="story-copy">
          <p className="script-title">Our Story</p>
          <h1>Fighting Food Waste Every Day</h1>
          <p>
            FoodBridge Network connects surplus meals, verified volunteers, trusted NGOs, and families who need timely
            support. We create simple pathways to move food from donors to people with dignity, speed, and care.
          </p>
          <Link className="maroon-pill" to="/find-food">Find Food</Link>
          {/* <div className="seed-row" /> */}
        </div>
        <div className="story-image" aria-label="FoodBridge distribution center" />
      </section>

      <section className="store-promo">
        <button className="slider-arrow left"><ChevronLeft /></button>
        <div className="store-copy">
          <p className="script-title">Show up for your city!</p>
          <h2>Treat your community and help us rescue more food. Every action moves meals back to local tables.</h2>
          <Link to="/donate-food">Donate Now</Link>
        </div>
        <div className="store-preview">
          <div className="store-orange">
            <h3>Welcome to FoodBridge Partner Hub</h3>
            <p>Donation drives, pickup teams, verified NGOs, and citywide service programs.</p>
            <span>Start Now</span>
          </div>
          <div className="store-photo" />
          <div className="store-tile green">Give directly to families</div>
          <div className="store-tile dark">Volunteer route kits</div>
        </div>
        <button className="slider-arrow right"><ChevronRight /></button>
        <div className="slider-dots"><span /><span /><span /></div>
      </section>

      <section className="feature-cards">
        {[
          ['Volunteer Opportunities', 'Help collect, sort, and deliver food to nearby communities.', '/volunteer', 'volunteer'],
          ['Find Food', 'Locate active food support, distribution partners, and assistance requests.', '/find-food', 'find'],
          ['Programs', 'Coordinate recurring donation programs with NGOs, hostels, events, and restaurants.', '/resources', 'programs']
        ].map(([title, text, path, image]) => (
          <article className="feature-card" key={title}>
            <div className={`feature-image ${image}`} />
            <h3>{title}</h3>
            <p>{text}</p>
            <Link to={path}>Learn More</Link>
          </article>
        ))}
      </section>

      <section className="facts-band">
        <div className="team-photo" />
        <div className="fact-grid">
          {[
            ['For every surplus donation posted early, more meals can be delivered safely.', 'FOOD RESCUE FACT #26', 'orange'],
            ['1 in 4 urban families may need short-term meal support during a difficult month.', 'COMMUNITY FACT #102', 'green'],
            ['Verified partners make distribution faster, safer, and more accountable.', 'NETWORK FACT #78', 'orange']
          ].map(([title, label, tone]) => (
            <article className={`fact-card ${tone}`} key={label}>
              <Star size={52} fill="currentColor" />
              <h3>{title}</h3>
              <strong>{label}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="latest-news">
        <h2 className="script-title">Latest News</h2>
        <div className="news-grid">
          <article className="news-card">
            <div className="news-logo">FoodBridge<br />Network</div>
            <div><h3>Serving Hope: Summer 2026</h3><Link to="/events">Read More</Link></div>
          </article>
          <article className="news-card">
            <div className="news-logo">FoodBridge<br />Network</div>
            <div><h3>From Surplus Shelves to Neighbors' Tables</h3><p>Local partners are opening reliable food rescue windows across the city...</p><Link to="/resources">Read More</Link></div>
          </article>
        </div>
        <Link className="blog-button" to="/resources">Check Out Our Blog</Link>
      </section>

      <Link className="back-top" to="/">↑</Link>
    </main>
  );
}
