import React, { useState, useEffect } from 'react';
import { User, Trip, Location } from '../types';
import * as tripService from '../services/tripService';
import Card from './ui/Card';
import Button from './ui/Button';
import Spinner from './ui/Spinner';

interface DriverDashboardProps {
  user: User;
}

const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
        }), 
        reject
      );
    }
  });
};

const StartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="10 8 16 12 10 16 10 8" />
  </svg>
);

const StopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <rect x="9" y="9" width="6" height="6" />
    </svg>
);

const DriverDashboard: React.FC<DriverDashboardProps> = ({ user }) => {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActiveTrip = async () => {
      try {
        const trip = await tripService.getActiveTripForDriver(user.id);
        setActiveTrip(trip);
      } catch (e) {
        setError('Failed to load trip status. Please refresh.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActiveTrip();
  }, [user.id]);

  const handleStartTrip = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const location = await getCurrentLocation();
      const newTrip = await tripService.startNewTrip(user, location);
      setActiveTrip(newTrip);
    } catch (err: any) {
      setError(`Failed to start trip: ${err.message}`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndTrip = async () => {
    if (!activeTrip) return;
    setIsSubmitting(true);
    setError('');
    try {
      const location = await getCurrentLocation();
      await tripService.endCurrentTrip(activeTrip.id, location);
      setActiveTrip(null);
    } catch (err: any) {
      setError(`Failed to end trip: ${err.message}`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-10"><Spinner /></div>;
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="p-6 md:p-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome, {user.name}!</h2>
                <p className="text-gray-500 dark:text-gray-400">Vehicle: {user.vehicleNumber}</p>
            </div>
            {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md my-6 text-sm">{error}</p>}
            
            {activeTrip ? (
                <div className="mt-8 text-center">
                    <div className="p-6 bg-blue-50 dark:bg-gray-700 rounded-lg">
                        <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200">Trip is Active</h3>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                            Started at: {new Date(activeTrip.startTime).toLocaleTimeString()}
                        </p>
                    </div>
                    <Button 
                        onClick={handleEndTrip} 
                        disabled={isSubmitting} 
                        className="w-full mt-6 !bg-red-600 hover:!bg-red-700 h-20 text-2xl"
                    >
                        {isSubmitting ? <Spinner/> : <StopIcon className="w-8 h-8 mr-3"/>}
                        End Trip
                    </Button>
                </div>
            ) : (
                <div className="mt-8 text-center">
                     <div className="p-6 bg-green-50 dark:bg-gray-700 rounded-lg">
                        <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">You are ready to go!</h3>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                           Click the button below to start a new trip.
                        </p>
                    </div>
                    <Button 
                        onClick={handleStartTrip} 
                        disabled={isSubmitting}
                        className="w-full mt-6 !bg-green-600 hover:!bg-green-700 h-20 text-2xl"
                    >
                        {isSubmitting ? <Spinner/> : <StartIcon className="w-8 h-8 mr-3"/>}
                        Start Trip
                    </Button>
                </div>
            )}

        </div>
      </Card>
    </div>
  );
};

export default DriverDashboard;
