
import React, { useState, useEffect, useCallback } from 'react';
import { User, Ride, RideStatus, Location, LocationUpdate } from '../types';
import * as tripService from '../services/tripService';
import { locationService } from '../services/locationService';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import MapDisplay from './MapDisplay';
import Spinner from './ui/Spinner';

interface DriverDashboardProps {
  user: User;
}

const formatEta = (seconds: number | null): string | null => {
    if (seconds === null || seconds < 0) return null;
    if (seconds <= 1) return '< 1 min'; // Handle the final second
    if (seconds < 60) return '< 1 min';
    return `${Math.ceil(seconds / 60)} min`;
};

const DriverDashboard: React.FC<DriverDashboardProps> = ({ user }) => {
  const [assignedRide, setAssignedRide] = useState<Ride | null>(null);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  const fetchData = useCallback(() => {
    try {
      const driverRide = tripService.getRideForDriver(user.id);
      // Deep comparison is tricky, so we check key properties that change
      if (driverRide?.id !== assignedRide?.id || driverRide?.status !== assignedRide?.status || driverRide?.arrivedAtPickup !== assignedRide?.arrivedAtPickup) {
        setAssignedRide(driverRide);
      }
    } catch (e) {
      console.error("Failed to fetch data:", e);
      setError("Could not load ride data.");
    } finally {
      setIsLoading(false);
    }
  }, [user.id, assignedRide?.id, assignedRide?.status, assignedRide?.arrivedAtPickup]);

  // Effect for polling ride status and managing location subscription
  useEffect(() => {
    fetchData();
    const pollInterval = setInterval(fetchData, 2000);
    const unsubscribeLocation = locationService.subscribe((update: LocationUpdate) => {
        setDriverLocation(update.location);
        setEta(update.etaSeconds);
    });

    return () => {
      clearInterval(pollInterval);
      unsubscribeLocation();
      locationService.stopTracking(); // Stop all tracking on unmount
    };
  }, [fetchData]);

  // Effect to manage the type of location tracking (idle vs. trip)
  useEffect(() => {
    if (!assignedRide) {
      locationService.startIdleTracking();
    }
  }, [assignedRide]);

  // This effect manages the entire automated trip lifecycle once a ride is accepted.
  useEffect(() => {
    if (!assignedRide || !assignedRide.isConfirmedByDriver) {
      return; // Do nothing if there's no ride or it's not confirmed yet
    }

    let cleanup = () => {};

    if (assignedRide.status === RideStatus.ACCEPTED && !assignedRide.arrivedAtPickup) {
      const onPickupComplete = () => {
        setAssignedRide(tripService.driverArrivedAtPickup(assignedRide));
      };
      locationService.startTracking(assignedRide, onPickupComplete);
      cleanup = () => locationService.stopTracking();
    } else if (assignedRide.status === RideStatus.IN_PROGRESS) {
      const onDropoffComplete = () => {
        tripService.endTrip(assignedRide);
        setAssignedRide(null); // Ride is over
      };
      locationService.startTracking(assignedRide, onDropoffComplete);
      cleanup = () => locationService.stopTracking();
    }
    
    return cleanup;
  }, [assignedRide]);


  const handleAcceptRide = () => {
    if (!assignedRide) return;
    setIsAccepting(true);
    setAssignedRide(tripService.acceptRide(assignedRide));
    setIsAccepting(false);
  };
  
  const handleRejectRide = () => {
    if (!assignedRide) return;
    tripService.rejectRide(assignedRide);
    setAssignedRide(null);
  };
  
  const handleStartTripWithOtp = () => {
    if (!assignedRide) return;
    setOtpError('');

    const result = tripService.verifyOtpAndStartTrip(assignedRide, otpInput);
    if (result.success && result.ride) {
      setAssignedRide(result.ride);
      setOtpInput('');
    } else {
      setOtpError('Incorrect OTP. Please try again.');
    }
  };

  const renderRideOffer = () => {
    if (!assignedRide) return null;
    const { distanceKm, earnings } = tripService.estimateRideDetails(assignedRide);
    return (
        <Card>
            <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">New Ride Offer</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">A new ride is available for you to accept.</p>
                <div className="mt-4 space-y-3 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pickup</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{assignedRide.customerLocation.address}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Destination</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{assignedRide.destination.address}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Est. Distance: <span className="text-gray-800 dark:text-gray-100 font-bold">{distanceKm} km</span></p>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Est. Earnings: <span className="text-green-600 dark:text-green-400 font-bold">₹{earnings}</span></p>
                    </div>
                </div>
                <div className="mt-6 flex space-x-4">
                    <Button onClick={handleAcceptRide} className="w-full bg-green-600 hover:bg-green-700" disabled={isAccepting}>
                        {isAccepting ? "Accepting..." : "Accept Ride"}
                    </Button>
                    <Button onClick={handleRejectRide} className="w-full bg-red-600 hover:bg-red-700">
                        Reject
                    </Button>
                </div>
            </div>
        </Card>
    );
  }
  
  const renderOtpScreen = () => {
    return (
        <Card>
            <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Arrived at Pickup</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1 mb-4">
                    Please collect the 4-digit OTP from the customer to start the trip.
                </p>
                <div className="space-y-4">
                    <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 4-digit OTP"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        maxLength={4}
                        label="One-Time Password (OTP)"
                    />
                    {otpError && <p className="text-sm text-red-600 dark:text-red-400">{otpError}</p>}
                </div>
                <div className="mt-6">
                    <Button onClick={handleStartTripWithOtp} className="w-full">
                        Verify OTP & Start Trip
                    </Button>
                </div>
            </div>
        </Card>
    );
  }


  const renderActiveTrip = () => {
    if (!assignedRide || !driverLocation) return null;

    if (assignedRide.status === RideStatus.ACCEPTED && assignedRide.arrivedAtPickup) {
        return renderOtpScreen();
    }

    let title = '';
    let description = '';
    const etaDisplay = formatEta(eta);

    switch (assignedRide.status) {
      case RideStatus.ACCEPTED:
        title = "On the way to Pickup";
        description = `Heading to pickup point: ${assignedRide.customerLocation.address}`;
        break;
      case RideStatus.IN_PROGRESS:
        title = "Trip In Progress";
        description = `Destination: ${assignedRide.destination.address}`;
        break;
    }

    return (
      <Card>
        <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1 mb-4">
              {description}
              {etaDisplay && (
                <span className="font-semibold text-blue-600 dark:text-blue-400 ml-2">
                  (ETA: {etaDisplay})
                </span>
              )}
            </p>
            <MapDisplay ride={assignedRide} currentDriverLocation={driverLocation} />
            <div className="mt-6 text-center">
                <div className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 italic">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Simulating trip progress automatically...
                </div>
            </div>
        </div>
      </Card>
    );
  };

  const renderWaitingForRide = () => (
    <Card>
      <div className="p-6">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="text-center py-8">
            <div className="text-5xl mb-4">😌</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">You are online and available.</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Waiting for a new ride assignment.</p>
        </div>
         <div className="mt-2">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">Your Live Location</h4>
            {driverLocation ? (
                <MapDisplay currentDriverLocation={driverLocation} />
            ) : (
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">Initializing map...</p>
                </div>
            )}
        </div>
      </div>
    </Card>
  );
  
  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center py-10"><Spinner /></div>;
    }
    if (!assignedRide) {
      return renderWaitingForRide();
    }
    if (assignedRide.status === RideStatus.ACCEPTED && !assignedRide.isConfirmedByDriver) {
      return renderRideOffer();
    }
    return renderActiveTrip();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Driver Dashboard</h2>
      {renderContent()}
    </div>
  );
};

export default DriverDashboard;
