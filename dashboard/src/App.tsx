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
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Inbox from './pages/Inbox';
import CmsHome from './pages/CmsHome';
import CmsMenu from './pages/CmsMenu';
import CmsPages from './pages/CmsPages';
import CmsMedia from './pages/CmsMedia';
import CmsForms from './pages/CmsForms';
import CmsTools from './pages/CmsTools';

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
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/cms/home" element={<CmsHome />} />
        <Route path="/cms/menu" element={<CmsMenu />} />
        <Route path="/cms/pages" element={<CmsPages />} />
        <Route path="/cms/media" element={<CmsMedia />} />
        <Route path="/cms/forms" element={<CmsForms />} />
        <Route path="/cms/tools" element={<CmsTools />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
