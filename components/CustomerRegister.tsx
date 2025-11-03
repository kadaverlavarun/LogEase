import React, { useState } from 'react';
import { registerCustomer } from '../services/authService';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';

interface CustomerRegisterProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

const CustomerRegister: React.FC<CustomerRegisterProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // FIX: Pass email to registerCustomer function.
    const result = await registerCustomer(name, email, password);
    if (result.success) {
      setSuccess(result.message + ' You will be redirected to login shortly.');
      setTimeout(() => {
        onRegisterSuccess();
      }, 2000);
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <div className="p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">Customer Registration</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-6">Create your customer account</p>
          <form onSubmit={handleRegister}>
            {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm">{error}</p>}
            {success && <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-sm">{success}</p>}
            <div className="space-y-4">
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                label="Name"
              />
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
                placeholder="Choose a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                label="Password"
              />
            </div>
            <div className="mt-6">
              <Button type="submit" className="w-full" disabled={isLoading || !!success}>
                {isLoading ? 'Registering...' : 'Register'}
              </Button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button onClick={onSwitchToLogin} className="font-medium text-blue-600 hover:text-blue-500 dark:hover:text-blue-400">
                Login here
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CustomerRegister;