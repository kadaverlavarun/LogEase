import React, { useState, useEffect } from 'react';
import { User, Role } from './types';
import { getCurrentUser, logout } from './services/authService';
import Login from './components/Login';
import DriverRegister from './components/DriverRegister';
import CustomerRegister from './components/CustomerRegister';
import DriverDashboard from './components/DriverDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import TripHistory from './components/TripHistory';
import Header from './components/Header';

type View = 'login' | 'register' | 'register_customer' | 'dashboard' | 'trip_history';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('login');
  
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setView('dashboard');
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('dashboard');
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setView('login');
  };

  const renderContent = () => {
    if (!currentUser) {
      switch (view) {
        case 'login':
          return <Login 
            onLogin={handleLogin} 
            onSwitchToRegister={() => setView('register')} 
            onSwitchToCustomerRegister={() => setView('register_customer')}
          />;
        case 'register':
          return <DriverRegister onRegisterSuccess={() => setView('login')} onSwitchToLogin={() => setView('login')} />;
        case 'register_customer':
          return <CustomerRegister onRegisterSuccess={() => setView('login')} onSwitchToLogin={() => setView('login')} />;
        default:
          return <Login 
            onLogin={handleLogin} 
            onSwitchToRegister={() => setView('register')} 
            onSwitchToCustomerRegister={() => setView('register_customer')}
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