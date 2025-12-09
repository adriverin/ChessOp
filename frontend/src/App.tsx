import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Train } from './pages/Train';
import { OpeningDrill } from './pages/OpeningDrill';
import { Openings } from './pages/Openings';
import { Profile } from './pages/Profile';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="train" element={<Train />} />
            <Route path="drill" element={<OpeningDrill />} />
            <Route path="openings" element={<Openings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
