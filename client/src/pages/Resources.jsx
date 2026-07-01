import { DetailPage } from '../components/DetailPage.jsx';

const resourceSections = [
  {
    id: 'food-safety',
    title: 'Food safety rules for every role',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1000&q=85',
    bullets: [
      'Use safe-before times for cooked and perishable food.',
      'Keep allergen and storage notes visible to NGOs and volunteers.',
      'Decline food that is spoiled, unlabeled, or unsafe to transport.'
    ]
  },
  {
    id: 'donor-handbook',
    title: 'Donor handbook for usable posts',
    reverse: true,
    image: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&w=1000&q=85',
    text: [
      'Strong donation posts include quantity, meal estimate, pickup address, pickup window, safe-before time, and contact readiness.',
      'The better the post, the easier it is for verified partners to accept and move food safely.'
    ]
  },
  {
    id: 'volunteer-guide',
    title: 'Volunteer guide for safe handoffs',
    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1000&q=85',
    text: [
      'Volunteers should confirm pickup details, protect recipient dignity, follow storage instructions, and update delivery status as soon as each step is complete.',
      'Clear communication helps NGOs plan distribution and keeps donors informed.'
    ]
  },
  {
    id: 'reports-section',
    title: 'Reports turn activity into learning',
    reverse: true,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=85',
    text: [
      'FoodBridge reporting helps admins understand posted donations, accepted pickups, completed deliveries, support requests, and role participation.',
      'These insights identify service gaps and improve future coordination.'
    ]
  }
];

const ngoSections = [
  {
    id: 'ngo-registration',
    title: 'Register as a verified distribution partner',
    image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1000&q=85',
    text: [
      'NGOs provide organization details, contact person, service area, and registration information so FoodBridge can review operating readiness.',
      'Verification protects donors, volunteers, recipients, and the wider food rescue network.'
    ],
    cta: { label: 'Register NGO', to: '/signup' }
  },
  {
    id: 'ngo-donations',
    title: 'Claim donations that match your service area',
    reverse: true,
    image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=1000&q=85',
    bullets: [
      'Review quantity, safe-before time, diet type, pickup window, and donor notes.',
      'Coordinate volunteer pickup when transport support is needed.',
      'Update donation status so everyone sees progress.'
    ]
  },
  {
    id: 'beneficiaries',
    title: 'Serve beneficiaries with dignity and minimal data',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=85',
    text: [
      'FoodBridge focuses on household need, location, urgency, and service area instead of public exposure of recipient identity.',
      'NGOs can use requests and accepted donations to plan reliable distribution.'
    ]
  },
  {
    id: 'ngo-verification',
    title: 'Verification creates accountable coordination',
    reverse: true,
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1000&q=85',
    text: [
      'Admins review partner information and can approve or reject access based on platform requirements.',
      'Verified access keeps the operational network focused, traceable, and trusted.'
    ]
  }
];

export default function Resources({ type }) {
  const ngoPage = type === 'ngos';

  return (
    <DetailPage
      hero={ngoPage ? {
        eyebrow: 'NGO Partners',
        title: 'Verified partners make distribution reliable',
        text: 'NGOs turn rescued food into organized community support through trusted service areas.',
        tone: 'green',
        image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1400&q=85'
      } : {
        eyebrow: 'Resources',
        title: 'Guides for safer food rescue',
        text: 'Use FoodBridge resources to post better donations, move food safely, and protect community trust.',
        tone: 'gray',
        image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=85'
      }}
      navItems={ngoPage ? [
        { id: 'ngo-registration', label: 'Registration' },
        { id: 'ngo-donations', label: 'Donations' },
        { id: 'beneficiaries', label: 'Beneficiaries' },
        { id: 'ngo-verification', label: 'Verification' }
      ] : [
        { id: 'food-safety', label: 'Food safety' },
        { id: 'donor-handbook', label: 'Donor handbook' },
        { id: 'volunteer-guide', label: 'Volunteer guide' },
        { id: 'reports-section', label: 'Reports' }
      ]}
      sections={ngoPage ? ngoSections : resourceSections}
      values={[
        { title: 'Useful', text: 'Resources connect directly to real platform workflows.' },
        { title: 'Practical', text: 'Guidance is written for donors, NGOs, volunteers, and admins.' },
        { title: 'Safe', text: 'Every rule supports safer food movement.' },
        { title: 'Shared', text: 'Everyone works from the same operating language.' }
      ]}
    />
  );
}
