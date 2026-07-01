import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
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
        <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
        <Route path="/reset-password" element={<AuthPage mode="reset" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = decodeURIComponent(location.hash.replace('#', ''));
      const timer = setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

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
