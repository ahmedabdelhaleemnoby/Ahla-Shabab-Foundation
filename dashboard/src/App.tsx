import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import Overview from './pages/Overview';
import Bookings from './pages/Bookings';
import Donations from './pages/Donations';
import Services from './pages/Services';
import Providers from './pages/Providers';
import Content from './pages/Content';
import UsersPage from './pages/Users';
import Reports from './pages/Reports';
import Roles from './pages/Roles';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/donations" element={<Donations />} />
        <Route path="/services" element={<Services />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/content" element={<Content />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
