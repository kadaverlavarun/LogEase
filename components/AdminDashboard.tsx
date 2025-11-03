import React, { useState, useEffect, useMemo } from 'react';
import { Trip } from '../types';
import * as tripService from '../services/tripService';
import Card from './ui/Card';
import Button from './ui/Button';
import Spinner from './ui/Spinner';

const isTripDelayed = (trip: Trip): boolean => {
    // A trip is considered delayed if it's active for more than 4 hours
    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
    return trip.status === 'ACTIVE' && (Date.now() - trip.startTime) > FOUR_HOURS_MS;
};

const AdminDashboard: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [trips, setTrips] = useState<Trip[]>([]);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const allTrips = await tripService.getAllTrips();
                setTrips(allTrips);
            } catch (error) {
                console.error("Failed to fetch trips:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh data every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const handleExportCsv = () => {
        const headers = ['Trip ID', 'Driver Name', 'Vehicle No', 'Status', 'Start Time', 'End Time', 'Duration (Minutes)', 'Delivered To', 'Distance (km)', 'Earnings (₹)'];
        
        const rows = trips.map(t => [
            t.id,
            `"${(t.driverName || '').replace(/"/g, '""')}"`,
            t.vehicleNumber,
            t.status,
            new Date(t.startTime).toLocaleString(),
            t.endTime ? new Date(t.endTime).toLocaleString() : 'N/A',
            t.durationMinutes ?? 'N/A',
            `"${(t.endLocation?.address || 'N/A').replace(/"/g, '""')}"`,
            t.distanceKm?.toFixed(1) ?? 'N/A',
            t.earnings?.toFixed(2) ?? 'N/A',
        ].join(','));
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `logease_trips_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const analytics = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const activeTrips = trips.filter(t => t.status === 'ACTIVE').length;
        const completedTrips = trips.filter(t => t.status === 'COMPLETED');
        const completedToday = completedTrips.filter(t => t.endTime! >= startOfToday).length;
        
        const totalDuration = completedTrips.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
        const avgDuration = completedTrips.length > 0 ? (totalDuration / completedTrips.length).toFixed(0) : 0;

        return { activeTrips, completedToday, avgDuration };
    }, [trips]);
    
    return (
        <div className="max-w-7xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Fleet Activity Dashboard</h2>
                <div className="mt-4 md:mt-0">
                    <Button onClick={handleExportCsv} disabled={trips.length === 0}>
                        Export to Excel
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center">
              <Card className="p-6">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Trips</p>
                  <p className="mt-1 text-3xl font-semibold text-blue-600 dark:text-blue-400">{analytics.activeTrips}</p>
              </Card>
              <Card className="p-6">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Today</p>
                  <p className="mt-1 text-3xl font-semibold text-green-600 dark:text-green-400">{analytics.completedToday}</p>
              </Card>
              <Card className="p-6">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Trip Duration</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{analytics.avgDuration} mins</p>
              </Card>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Driver</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vehicle</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Start Time</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">End Time</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Duration</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Delivered To</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <tr><td colSpan={7} className="text-center py-10"><div className="flex justify-center items-center"><Spinner /> <span className="text-gray-500 dark:text-gray-400 ml-2">Loading Trips...</span></div></td></tr>
                            ) : trips.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">No trips found.</td></tr>
                            ) : (
                                trips.map(trip => {
                                    const delayed = isTripDelayed(trip);
                                    const duration = trip.status === 'ACTIVE' 
                                        ? `${Math.round((Date.now() - trip.startTime) / 60000)} mins (Ongoing)`
                                        : trip.durationMinutes ? `${trip.durationMinutes} mins` : '-';
                                    
                                    return (
                                        <tr key={trip.id} className={delayed ? "bg-red-50 dark:bg-red-900/20" : ""}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {trip.status === 'ACTIVE' ? (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Active</span>
                                                    ) : (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                                                    )}
                                                    {delayed && <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 animate-pulse">Delayed</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{trip.driverName || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{trip.vehicleNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(trip.startTime).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{trip.endTime ? new Date(trip.endTime).toLocaleString() : 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{duration}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{trip.endLocation?.address || 'N/A'}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AdminDashboard;