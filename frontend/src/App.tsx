import { useEffect, useRef, type ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Train } from './pages/Train';
import { OpeningDrill } from './pages/OpeningDrill';
import { Openings } from './pages/Openings';
import { Curriculum } from './pages/Curriculum';
import { Profile } from './pages/Profile';
import { Pricing } from './pages/Pricing';
import { Subscription } from './pages/Subscription';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { Modal } from './components/Modal';
import { Help } from './pages/Help';
import { Settings } from './pages/Settings';

function RequireAuth({ children }: { children: ReactElement }) {
    const { user, loading } = useUser();
    const location = useLocation();
    const navigate = useNavigate();
    const didNavRef = useRef<string | null>(null);
    
    useEffect(() => {
        if (loading) return;
        if (user && user.is_authenticated) return;

        const target = location.pathname + location.search;
        // Prevent infinite loops if we already triggered nav for this exact path
        if (didNavRef.current === target) return;

        didNavRef.current = target;
        navigate("/login", {
            replace: true,
            state: { backgroundLocation: location, from: location },
        });
    }, [loading, user, location, navigate]);

    // Reset the ref when the location key changes (user navigated somewhere else intentionally)
    useEffect(() => {
        didNavRef.current = null;
    }, [location.key]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-500">Loading...</div>;
    }

    if (!user || !user.is_authenticated) {
        return null; // Navigation is handled in useEffect
    }

    return children;
}

function AppContent() {
    const location = useLocation();
    // Helper to determine background location for modal
    const state = location.state as { backgroundLocation?: Location };
    const backgroundLocation = state?.backgroundLocation || location;

    return (
        <>
            <Routes location={backgroundLocation}>
                <Route path="/" element={<Layout />}>
                    {/* Training Arena */}
                    <Route index element={<Train />} />
                    
                    {/* Protected Route */}
                    <Route path="dashboard" element={
                        <RequireAuth>
                            <Dashboard />
                        </RequireAuth>
                    } />
                    
                    <Route path="profile" element={
                        <RequireAuth>
                            <Profile />
                        </RequireAuth>
                    } />
                    
                    <Route path="subscription" element={
                        <RequireAuth>
                            <Subscription />
                        </RequireAuth>
                    } />
                    
                    <Route path="settings" element={
                        <RequireAuth>
                            <Settings />
                        </RequireAuth>
                    } />

                    {/* Free Tier / Optional Auth */}
                    <Route path="openings" element={<Openings />} />
                    <Route path="curriculum" element={<Curriculum />} />
                    <Route path="pricing" element={<Pricing />} />
                    <Route path="help" element={<Help />} />
                    
                    {/* Train/Drill: accessible, but saving requires auth. 
                        If they hit a 401/403 inside, component should handle it or they just can't save. 
                        Ideally we'd wrap save actions with auth check. */}
                    <Route path="train" element={<Train />} />
                    <Route path="drill" element={<OpeningDrill />} />
                </Route>
            </Routes>

            {/* Modal Routes */}
            {state?.backgroundLocation && (
                <Routes>
                    <Route path="/login" element={
                        <Modal>
                            <LoginPage />
                        </Modal>
                    } />
                    <Route path="/signup" element={
                        <Modal>
                            <SignupPage />
                        </Modal>
                    } />
                </Routes>
            )}
        </>
    );
}

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Router>
          <AppContent />
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
