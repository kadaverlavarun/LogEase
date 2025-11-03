import React, { useState, useEffect, useCallback } from 'react';
import { User, Ride, RideStatus, Location, LocationUpdate } from '../types';
import * as tripService from '../services/tripService';
import { locationService } from '../services/locationService';
import Card from './ui/Card';
import Button from './ui/Button';
import MapDisplay from './MapDisplay';
import NearbyDriversMap from './NearbyDriversMap';

interface CustomerDashboardProps {
  user: User;
}

const SignalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12.556a10 10 0 0 1 18.528 0" />
      <path d="M5 15.556a6 6 0 0 1 12.528 0" />
      <path d="M8.5 18.5a2.5 2.5 0 0 1 5 0" />
      <path d="M12 22v-2" />
    </svg>
);

const formatEta = (seconds: number | null): string | null => {
    if (seconds === null || seconds < 0) return null;
    if (seconds <= 1) return '< 1 min';
    if (seconds < 60) return '< 1 min';
    return `${Math.ceil(seconds / 60)} min`;
};

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ user }) => {
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [nearbyDrivers, setNearbyDrivers] = useState(0);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [nearbyDriverLocations, setNearbyDriverLocations] = useState<Location[]>([]);

  const checkRideStatus = useCallback(async () => {
    const ride = await tripService.getRideForCustomer(user.id);
    setActiveRide(ride);
  }, [user.id]);

  useEffect(() => {
    checkRideStatus();
    const rideInterval = setInterval(checkRideStatus, 2000); // Poll for ride status changes

    const driverInterval = setInterval(() => {
      setNearbyDrivers(tripService.getNearbyDriversCount());
    }, 3000);

    // Initial fetch
    setNearbyDrivers(tripService.getNearbyDriversCount());

    return () => {
        clearInterval(rideInterval);
        clearInterval(driverInterval);
    }
  }, [checkRideStatus]);

  useEffect(() => {
    if (activeRide && (activeRide.status === RideStatus.ACCEPTED || activeRide.status === RideStatus.IN_PROGRESS)) {
      const unsubscribe = locationService.subscribe((update: LocationUpdate) => {
        setDriverLocation(update.location);
        setEta(update.etaSeconds);
      });
      return unsubscribe;
    } else {
      setDriverLocation(null);
      setEta(null);
    }
  }, [activeRide]);

  // New effect for nearby drivers simulation
  useEffect(() => {
    // If we have a non-zero number of drivers and no ride, start simulation
    if (nearbyDrivers > 0 && !activeRide) {
      locationService.startNearbyDriversSimulation(nearbyDrivers);
      const unsubscribe = locationService.subscribeToNearbyDrivers(setNearbyDriverLocations);
      
      return () => {
        unsubscribe();
        locationService.stopNearbyDriversSimulation();
      };
    } else {
      // Clean up if there are no drivers or if a ride becomes active
      locationService.stopNearbyDriversSimulation();
      setNearbyDriverLocations([]);
    }
  }, [nearbyDrivers, activeRide]);


  const handleRequestRide = async () => {
    setIsLoading(true);
    setError('');
    try {
      const newRide = await tripService.requestRide(user);
      setActiveRide(newRide);
    } catch (err) {
      setError('Failed to request a ride.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancelRide = async () => {
      setIsLoading(true);
      if (activeRide) {
        await tripService.cancelRide(activeRide);
        setActiveRide(null);
      }
      setIsLoading(false);
  }

  const renderContent = () => {
    if (!activeRide || activeRide.status === RideStatus.IDLE || activeRide.status === RideStatus.COMPLETED) {
      return (
        <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Ready to go somewhere?</h3>
            
            <NearbyDriversMap driverLocations={nearbyDriverLocations} />

            <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400 my-3">
                <SignalIcon className="w-5 h-5" />
                <p><span className="font-bold">{nearbyDrivers} drivers</span> nearby</p>
            </div>
            
            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">Request a ride to get started.</p>
            <Button onClick={handleRequestRide} disabled={isLoading}>
                {isLoading ? 'Requesting...' : 'Request Ride'}
            </Button>
        </div>
      );
    }

    let title = '';
    let description = '';
    let titleContent: React.ReactNode;
    const etaDisplay = formatEta(eta);
    const locationForMap = driverLocation || activeRide.driverLocation;
    let map = <MapDisplay ride={activeRide} currentDriverLocation={locationForMap} />;

    switch (activeRide.status) {
        case RideStatus.REQUESTED:
            title = "Finding you a driver...";
            description = "Please wait while we connect you with a nearby driver.";
            titleContent = (
                <div className="flex items-center justify-center">
                    <svg className="animate-spin mr-3 h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {title}
                </div>
            );
            break;
        case RideStatus.ACCEPTED:
            if (activeRide.arrivedAtPickup && activeRide.otp) {
                title = "Your driver has arrived!";
                description = "Please share the OTP below with your driver to start the trip.";
            } else if (!activeRide.isConfirmedByDriver) {
                title = "Driver Found!";
                description = "Waiting for your driver to confirm the ride. They will be on their way shortly.";
            } else {
                title = "Driver is on the way!";
                description = `Your driver is en route to your location: ${activeRide.customerLocation.address}`;
            }
            break;
        case RideStatus.IN_PROGRESS:
            title = "Enjoy your trip!";
            description = `On your way to: ${activeRide.destination.address}`;
            break;
    }
    
    if (!titleContent) {
        titleContent = title;
    }


    return (
        <>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 text-center">{titleContent}</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1 mb-4 text-center">
              {description}
              {etaDisplay && (
                <span className="font-semibold text-blue-600 dark:text-blue-400 ml-2">
                  (ETA: {etaDisplay})
                </span>
              )}
            </p>
            
            {activeRide.status === RideStatus.ACCEPTED && activeRide.arrivedAtPickup && activeRide.otp && (
                <div className="my-6 p-6 bg-blue-50 dark:bg-gray-700 rounded-lg text-center">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">YOUR ONE-TIME PASSWORD</p>
                    <p className="text-5xl font-bold tracking-widest text-blue-600 dark:text-blue-400 my-2">
                        {activeRide.otp}
                    </p>
                </div>
            )}

            {map}
            {activeRide.status !== RideStatus.IN_PROGRESS && (
                <div className="mt-6">
                    <Button onClick={handleCancelRide} disabled={isLoading} className="w-full bg-gray-500 hover:bg-gray-600">
                        {isLoading ? "Cancelling..." : "Cancel Ride"}
                    </Button>
                </div>
            )}
        </>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Customer Dashboard</h2>
      <Card>
        <div className="p-6">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {renderContent()}
        </div>
      </Card>
    </div>
  );
};

export default CustomerDashboard;