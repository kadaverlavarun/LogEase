import React from 'react';
import { Ride, RideStatus, Location } from '../types';

interface MapDisplayProps {
  ride?: Ride; // Ride is optional for idle view
  currentDriverLocation: Location;
}

const LocationPinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const TruckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 18H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v11" />
      <path d="M14 9h4l4 4v4h-8v-4h-4V9Z" />
      <circle cx="7.5" cy="18.5" r="2.5" />
      <circle cx="17.5" cy="18.5" r="2.5" />
    </svg>
  );

const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);


const MapDisplay: React.FC<MapDisplayProps> = ({ ride, currentDriverLocation }) => {
  
  const getDriverLeftPercent = () => {
    // Mode 1: Idle driver, moving around the center of the map
    if (!ride) {
        const minLng = -118.45; // Simulated map boundaries
        const maxLng = -118.20;
        const range = maxLng - minLng;
        const progress = range !== 0 ? (currentDriverLocation.lng - minLng) / range : 0.5;
        const clampedProgress = Math.max(0, Math.min(1, progress));
        // Animate between 30% and 70% of the map width for more visible movement
        return 30 + (clampedProgress * 40);
    }
    
    let progress = 0;
    // Mode 2, Leg 1: Driver is heading to the customer (25% to 50% on map)
    if (ride.status === RideStatus.ACCEPTED) {
        const { driverLocation, customerLocation } = ride;
        const totalDist = customerLocation.lng - driverLocation.lng;
        progress = totalDist !== 0 ? (currentDriverLocation.lng - driverLocation.lng) / totalDist : 0;
        const clampedProgress = Math.max(0, Math.min(1, progress));
        return 25 + (clampedProgress * 25);
    }
    // Mode 2, Leg 2: Driver is heading to the destination (50% to 75% on map)
    if (ride.status === RideStatus.IN_PROGRESS) {
        const { customerLocation, destination } = ride;
        const totalDist = destination.lng - customerLocation.lng;
        progress = totalDist !== 0 ? (currentDriverLocation.lng - customerLocation.lng) / totalDist : 0;
        const clampedProgress = Math.max(0, Math.min(1, progress));
        return 50 + (clampedProgress * 25);
    }
    // Default position when idle or requested
    return 25;
  };

  const driverLeftPercent = getDriverLeftPercent();
  
  // When a ride is active, calculate a pan offset to keep the driver centered.
  // Otherwise, the map is static.
  const panOffsetPercent = ride ? 50 - driverLeftPercent : 0;
  
  const panningContainerStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      height: '100%',
      width: '100%',
      left: `${panOffsetPercent}%`,
      transition: 'left 1.5s linear',
  };
  
  const backgroundStyle: React.CSSProperties = {
      backgroundPosition: `${-panOffsetPercent * 2}% 0`, // Multiply for a more noticeable parallax effect
      transition: 'background-position 1.5s linear',
  };


  return (
    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 h-64 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-map-pattern opacity-20"
        style={backgroundStyle}
      ></div>
      
      <div style={panningContainerStyle}>
        {ride && <div className="absolute top-1/2 left-1/4 w-1/2 h-px bg-gray-400 dark:bg-gray-500 border-t-2 border-dashed"></div>}

        {/* Driver Icon: Its left % is relative to the panning container */}
        <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" 
            style={{ left: `${driverLeftPercent}%` }}
        >
            <div className="flex flex-col items-center">
                <div className="p-2 bg-blue-500 rounded-full shadow-lg">
                    <TruckIcon className="w-6 h-6 text-white"/>
                </div>
                <span className="text-xs font-semibold mt-1 bg-gray-800 bg-opacity-70 text-white px-2 py-1 rounded">You</span>
            </div>
        </div>

        {/* Customer / Pickup Icon (only shows during a ride) */}
        {ride && (
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
                <div className="flex flex-col items-center">
                    <div className="p-2 bg-green-500 rounded-full shadow-lg">
                        <UserIcon className="w-6 h-6 text-white"/>
                    </div>
                    <span className="text-xs font-semibold mt-1 bg-gray-800 bg-opacity-70 text-white px-2 py-1 rounded">
                        {ride.status === RideStatus.IN_PROGRESS ? 'Pickup' : 'Customer'}
                    </span>
                </div>
            </div>
        )}

        {/* Destination Icon (only shows during a ride) */}
        {ride && (
            <div className="absolute top-1/2 left-[75%] -translate-y-1/2 -translate-x-1/2">
                <div className="flex flex-col items-center">
                <div className="p-2 bg-red-500 rounded-full shadow-lg">
                    <LocationPinIcon className="w-6 h-6 text-white"/>
                </div>
                <span className="text-xs font-semibold mt-1 bg-gray-800 bg-opacity-70 text-white px-2 py-1 rounded">Destination</span>
                </div>
            </div>
        )}
      </div>
      
      <style>{`
        .bg-map-pattern {
          background-image: linear-gradient(rgba(0,0,0,.03) 2px, transparent 2px), linear-gradient(90deg, rgba(0,0,0,.03) 2px, transparent 2px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
};

export default MapDisplay;