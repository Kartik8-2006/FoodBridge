import { DetailPage } from '../components/DetailPage.jsx';

export default function Volunteer() {
  return (
    <DetailPage
      hero={{
        eyebrow: 'Become Volunteer',
        title: 'Move food quickly, safely, and locally',
        text: 'Volunteers complete the bridge between surplus food and the communities that need it.',
        tone: 'gray',
        image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1400&q=85'
      }}
      navItems={[
        { id: 'volunteer-signup', label: 'Volunteer signup' },
        { id: 'nearby-pickups', label: 'Nearby pickups' },
        { id: 'assigned-deliveries', label: 'Assigned deliveries' },
        { id: 'completed-deliveries', label: 'Completed deliveries' }
      ]}
      sections={[
        {
          id: 'volunteer-signup',
          title: 'Join with availability and transport details',
          image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1000&q=85',
          text: [
            'Volunteer profiles help FoodBridge understand when you are available, how far you can travel, and whether you can transport larger donations.',
            'After signup, your dashboard becomes the place to accept tasks and update pickup status.'
          ],
          cta: { label: 'Join as volunteer', to: '/signup' }
        },
        {
          id: 'nearby-pickups',
          title: 'Accept nearby pickups that match your schedule',
          reverse: true,
          image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1000&q=85',
          bullets: [
            'Review pickup window, quantity, address, and safe-before time.',
            'Accept only tasks you can complete within the listed time.',
            'Follow donor instructions and keep food handling safe.'
          ]
        },
        {
          id: 'assigned-deliveries',
          title: 'Keep every delivery visible',
          image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1000&q=85',
          text: [
            'Assigned deliveries show pickup and destination context so NGOs can prepare for handoff.',
            'Status updates reduce phone calls and help coordinators know which donations are still moving.'
          ]
        },
        {
          id: 'completed-deliveries',
          title: 'Completed tasks build trust across the network',
          reverse: true,
          image: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&w=1000&q=85',
          text: [
            'Completion history helps FoodBridge understand route reliability, response time, and partner coverage.',
            'Every completed delivery creates a clearer operating picture for future food rescue.'
          ]
        }
      ]}
      values={[
        { title: 'Reliability', text: 'Accept tasks only when you can complete them.' },
        { title: 'Safety', text: 'Follow handling guidance for every donation.' },
        { title: 'Speed', text: 'Fast status updates keep food moving.' },
        { title: 'Service', text: 'Each route supports real families and partners.' }
      ]}
    />
  );
}
