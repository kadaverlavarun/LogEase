import React, { useState } from 'react';
import { login } from '../services/authService';
import { Role, User } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';

interface LoginProps {
  onLogin: (user: User) => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.DRIVER);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { user, error } = await login(email, password);

    if (user) {
      onLogin(user);
    } else {
      setError(error || 'Invalid credentials. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <div className="p-8">
          <div className="mb-6">
              <div className="flex rounded-md shadow-sm">
                <button
                  type="button"
                  onClick={() => setRole(Role.DRIVER)}
                  className={`relative inline-flex items-center justify-center w-1/2 px-4 py-2 rounded-l-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${role === Role.DRIVER ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                >
                  Driver
                </button>
                 <button
                  type="button"
                  onClick={() => setRole(Role.ADMIN)}
                  className={`-ml-px relative inline-flex items-center justify-center w-1/2 px-4 py-2 rounded-r-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${role === Role.ADMIN ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                >
                  Admin
                </button>
              </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">
            {role === Role.DRIVER
              ? 'Driver Portal Login'
              : 'Admin Portal Login'}
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
            Login to your {role === Role.DRIVER ? 'driver account' : 'admin portal'}
          </p>
          <form onSubmit={handleLogin}>
            {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm">{error}</p>}
            <div className="space-y-4">
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                label="Email"
              />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                label="Password"
              />
            </div>
            <div className="mt-6">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging In...' : 'Login'}
              </Button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <button onClick={onSwitchToRegister} className="font-medium text-blue-600 hover:text-blue-500 dark:hover:text-blue-400">
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;