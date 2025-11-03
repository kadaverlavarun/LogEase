import React, { useState, useEffect } from 'react';
import { Trip } from '../types';
import { getTripsForDriver } from '../services/tripService';
import { getCurrentUser } from '../services/authService';
import { generateDailySummary } from '../services/geminiService';
import Card from './ui/Card';
import Button from './ui/Button';
import Spinner from './ui/Spinner';

const TripHistory: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      getTripsForDriver(user.uid).then(driverTrips => {
        setTrips(driverTrips);
        setIsLoadingTrips(false);
      });
    } else {
        setIsLoadingTrips(false);
    }
  }, []);

  const handleGenerateSummary = async () => {
    setIsLoadingSummary(true);
    setSummary('');
    // FIX: Only generate summary for completed trips to avoid errors.
    const completedTrips = trips.filter(trip => trip.status === 'COMPLETED');
    const result = await generateDailySummary(completedTrips);
    setSummary(result || ''); // Ensure summary is always a string to prevent .replace() on undefined
    setIsLoadingSummary(false);
  };
  
  const totalEarnings = trips.reduce((acc, trip) => acc + trip.earnings, 0);
  const totalDistance = trips.reduce((acc, trip) => acc + trip.distanceKm, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Trip History & Performance</h2>
          <div className="mt-4 md:mt-0">
             <Button onClick={handleGenerateSummary} disabled={isLoadingSummary || trips.length === 0}>
                {isLoadingSummary ? <><Spinner /> Generating...</> : 'Get AI Daily Summary'}
             </Button>
          </div>
      </div>

      {summary && (
        <Card className="mb-8">
            <div className="p-6 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }}></div>
        </Card>
      )}

      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Trips</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{trips.length}</p>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earnings</p>
                  <p className="mt-1 text-3xl font-semibold text-green-600 dark:text-green-400">₹{totalEarnings.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Distance</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{totalDistance.toFixed(1)} km</p>
              </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Duration</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Distance</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Earnings</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoadingTrips ? (
                    <tr><td colSpan={4} className="text-center py-8"><Spinner /></td></tr>
                ) : trips.length > 0 ? (
                  trips.map(trip => (
                    <tr key={trip.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{new Date(trip.startTime).toLocaleDateString()}</td>
                      {/* FIX: Use durationMinutes for safe rendering of trip duration */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{trip.durationMinutes ? `${trip.durationMinutes.toFixed(0)} mins` : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{trip.distanceKm.toFixed(1)} km</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">₹{trip.earnings.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">No trips found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TripHistory;