import React, { useState } from 'react';
import { registerDriver, registerAdmin } from '../services/authService';
import { User, Role } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';

interface RegisterProps {
  onRegisterSuccess: (user: User) => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [role, setRole] = useState<Role>(Role.DRIVER);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [isCaptchaChecked, setIsCaptchaChecked] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!isCaptchaChecked) {
        setError('Please confirm you are not a robot.');
        return;
    }

    setIsLoading(true);
    setSuccess('');

    let result;
    if (role === Role.DRIVER) {
      result = await registerDriver(name, email, password, phoneNumber, vehicleNumber, licenseNumber);
    } else if (role === Role.ADMIN) {
      result = await registerAdmin(name, email, password, gstNumber);
    }


    if (result && result.success && result.user) {
      setSuccess(result.message + ' Redirecting to your dashboard...');
      setTimeout(() => {
        onRegisterSuccess(result.user!);
      }, 1500);
    } else {
      setError(result?.message || 'Registration failed. Please select a role and try again.');
      setIsLoading(false);
    }
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
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">{role.charAt(0) + role.slice(1).toLowerCase()} Registration</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-6">Create your LogEase account</p>
          <form onSubmit={handleRegister}>
            {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm">{error}</p>}
            {success && <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-sm">{success}</p>}
            
            <div className="space-y-4">
              <Input id="name" type="text" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} label="Full Name" required/>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} label="Email Address" required/>
              
              {role === Role.DRIVER && (
                <>
                    <Input id="phoneNumber" type="tel" placeholder="Your phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} label="Phone Number" required/>
                    <Input id="vehicleNumber" type="text" placeholder="e.g., MH 12 AB 3456" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} label="Vehicle Number" required/>
                    <Input id="licenseNumber" type="text" placeholder="e.g., MH1420110001234" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} label="License Number" required/>
                </>
              )}
              
              {role === Role.ADMIN && (
                <Input id="gstNumber" type="text" placeholder="e.g., 22AAAAA0000A1Z5" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} label="GST Number" required/>
              )}

              <Input id="password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} label="Password" required/>
              <Input id="confirmPassword" type="password" placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} label="Confirm Password" required/>
            </div>

            <div className="mt-6 flex items-center">
              <input
                id="captcha"
                name="captcha"
                type="checkbox"
                checked={isCaptchaChecked}
                onChange={(e) => setIsCaptchaChecked(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="captcha" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                I am not a robot
              </label>
            </div>

            <div className="mt-6">
              <Button type="submit" className="w-full" disabled={isLoading || !!success}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
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

export default Register;
