import { DetailPage } from '../components/DetailPage.jsx';

export default function About() {
  return (
    <DetailPage
      hero={{
        eyebrow: 'About Us',
        title: 'A practical platform for food rescue operations',
        text: 'FoodBridge connects surplus meals, verified volunteers, NGOs, recipients, and admins in one accountable workflow.',
        tone: 'red',
        image: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&w=1400&q=85'
      }}
      navItems={[
        { id: 'project-objective', label: 'Mission and vision' },
        { id: 'how-platform-works', label: 'How it works' },
        { id: 'our-mission', label: 'Our mission' },
        { id: 'partnerships', label: 'Partnerships' }
      ]}
      sections={[
        {
          id: 'project-objective',
          title: 'Built to reduce avoidable food waste',
          image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=1000&q=85',
          text: [
            'FoodBridge Network exists to make community food distribution more predictable. Donors post surplus food, NGOs accept useful donations, volunteers move pickups, recipients request help, and admins keep the system trustworthy.',
            'The goal is simple: move safe food from places with surplus to people and partners who can use it.'
          ]
        },
        {
          id: 'how-platform-works',
          title: 'Our Mission',
          reverse: true,
          image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1000&q=85',
          text: ['Connect people, resources, and food through a trusted platform that reduces waste and improves local access to nutritious meals.']
        },
        {
          id: 'our-mission',
          title: 'Our Vision',
          image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=1000&q=85',
          text: ['A stronger community where surplus food is handled safely, support requests are dignified, and every verified partner can respond faster.']
        },
        {
          id: 'partnerships',
          title: 'Partnerships make the network stronger',
          image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1000&q=85',
          text: [
            'FoodBridge is designed for collaboration between donors, NGOs, volunteers, recipients, and administrators.',
            'Each partner sees only the work they need to do, while the platform keeps the full chain organized and traceable.'
          ]
        }
      ]}
      values={[
        { title: 'Collaboration', text: 'The network works when every role contributes clearly.' },
        { title: 'Respect', text: 'Recipient dignity and partner trust guide every workflow.' },
        { title: 'Innovation', text: 'Digital coordination helps reduce delays and waste.' },
        { title: 'Service', text: 'Every feature exists to move food to people in need.' }
      ]}
    />
  );
}
