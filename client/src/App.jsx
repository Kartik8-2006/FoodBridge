import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import About from './pages/About.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DonateFood from './pages/DonateFood.jsx';
import Events from './pages/Events.jsx';
import FindFood from './pages/FindFood.jsx';
import Home from './pages/Home.jsx';
import HowItWorks from './pages/HowItWorks.jsx';
import Resources from './pages/Resources.jsx';
import Volunteer from './pages/Volunteer.jsx';
import Contact from './pages/Contact.jsx';
import DashboardRouter from './pages/dashboards/DashboardRouter.jsx';

function PublicRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/find-food" element={<FindFood />} />
        <Route path="/donate-food" element={<DonateFood />} />
        <Route path="/volunteer" element={<Volunteer />} />
        <Route path="/ngos" element={<Resources type="ngos" />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/events" element={<Events />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/dashboard/:role"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />
      <Route path="/*" element={<PublicRoutes />} />
    </Routes>
  );
}
