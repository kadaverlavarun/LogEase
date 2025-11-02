
import React from 'react';
import { User, Role } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (view: 'dashboard' | 'trip_history') => void;
  currentView: string;
}

const TruckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 18H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v11" />
    <path d="M14 9h4l4 4v4h-8v-4h-4V9Z" />
    <circle cx="7.5" cy="18.5" r="2.5" />
    <circle cx="17.5" cy="18.5" r="2.5" />
  </svg>
);


const Header: React.FC<HeaderProps> = ({ user, onLogout, onNavigate, currentView }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <TruckIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">LogEase</h1>
        </div>
        <nav className="flex items-center space-x-4">
          {user && user.role === Role.DRIVER && (
            <>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${currentView === 'dashboard' ? 'text-white bg-blue-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onNavigate('trip_history')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${currentView === 'trip_history' ? 'text-white bg-blue-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                Trip History
              </button>
            </>
          )}
          {user && (
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
