import React, { useState, useEffect } from 'react';
import { User, Role } from './types';
import { logout, auth, getUserProfile } from './services/authService';
import { onAuthStateChanged } from 'firebase/auth';
import Login from './components/Login';
import Register from './components/Register';
import DriverDashboard from './components/DriverDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import TripHistory from './components/TripHistory';
import Header from './components/Header';
import Spinner from './components/ui/Spinner';

type View = 'login' | 'register' | 'dashboard' | 'trip_history';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('login');
  const [authLoading, setAuthLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // If we are on the register page, let the component's success handler
      // manage the state transition to avoid race conditions.
      if (view === 'register') {
        setAuthLoading(false);
        return;
      }

      if (firebaseUser) {
        setAuthLoading(true);
        const userProfile = await getUserProfile(firebaseUser);
        if (userProfile) {
          setCurrentUser(userProfile);
          if (view !== 'trip_history') { // Don't redirect away from history on refresh
             setView('dashboard');
          }
        } else {
          // If user is authenticated but profile is missing, it's an invalid state.
          // This can happen if registration was interrupted. Safest action is to log out.
          console.warn("User is authenticated, but no profile was found in Firestore. Logging out.");
          await logout();
        }
        setAuthLoading(false);
      } else {
        setCurrentUser(null);
        setView('login');
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, [view]);

  const handleLogin = () => {
    setView('dashboard');
  };
  
  const handleRegisterSuccess = (user: User) => {
    setCurrentUser(user);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setView('login');
  };

  const renderContent = () => {
    if (authLoading) {
      return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    }
    
    if (!currentUser) {
      switch (view) {
        case 'login':
          return <Login 
            onLogin={handleLogin} 
            onSwitchToRegister={() => setView('register')} 
          />;
        case 'register':
          return <Register onRegisterSuccess={handleRegisterSuccess} onSwitchToLogin={() => setView('login')} />;
        default:
          return <Login 
            onLogin={handleLogin} 
            onSwitchToRegister={() => setView('register')} 
          />;
      }
    }

    if (view === 'trip_history' && currentUser.role === Role.DRIVER) {
       return <TripHistory />;
    }

    switch (currentUser.role) {
      case Role.DRIVER:
        return <DriverDashboard user={currentUser} />;
      case Role.CUSTOMER:
        return <CustomerDashboard user={currentUser} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Header 
        user={currentUser} 
        onLogout={handleLogout} 
        onNavigate={(v) => setView(v as View)}
        currentView={view}
      />
      <main className="p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;