import React, { useState } from 'react';
import { login } from '../services/authService';
import { User } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';

interface LoginProps {
  onLogin: (user: User) => void;
  onSwitchToRegister: () => void;
  onSwitchToCustomerRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister, onSwitchToCustomerRegister }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Artificial delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = login(name, password);

    if (user) {
      onLogin(user);
    } else {
      setError('Invalid credentials. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <div className="p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">Welcome Back to LogEase</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-6">Login to your account</p>
          <form onSubmit={handleLogin}>
            {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm">{error}</p>}
            <div className="space-y-4">
              <Input
                id="name"
                type="text"
                placeholder="e.g., 'driver', 'alice', 'charlie'"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                label="Name"
              />
              <Input
                id="password"
                type="password"
                placeholder="Password is 'password123' for all mock users"
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
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you a driver?{' '}
              <button onClick={onSwitchToRegister} className="font-medium text-blue-600 hover:text-blue-500 dark:hover:text-blue-400">
                Register here
              </button>
            </p>
             <p className="text-sm text-gray-600 dark:text-gray-400">
              New customer?{' '}
              <button onClick={onSwitchToCustomerRegister} className="font-medium text-blue-600 hover:text-blue-500 dark:hover:text-blue-400">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;