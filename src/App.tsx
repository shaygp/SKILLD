import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/Home';
import { ProfilePage } from './pages/Profile';
import { SearchPage } from './pages/Search';
import { AboutPage } from './pages/About';
import { ActivityPage } from './pages/Activity';
import { AttestationsPage } from './pages/Attestations';
import { AgentsPage } from './pages/Agents';

export default function App() {
  return (
    <div className="min-h-full">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/attestations" element={<AttestationsPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/:domain" element={<ProfilePage />} />
      </Routes>
    </div>
  );
}
