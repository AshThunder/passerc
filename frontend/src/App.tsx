import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import ConversionPortal from './components/ConversionPortal';
import ConfidentialTransfer from './components/ConfidentialTransfer';
import Settings from './components/Settings';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/convert" element={<ConversionPortal />} />
            <Route path="/transfer" element={<ConfidentialTransfer />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </NotificationProvider>
  );
}

export default App;
