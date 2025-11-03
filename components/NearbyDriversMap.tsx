import React from 'react';
import { Location } from '../types';

interface NearbyDriversMapProps {
  driverLocations: Location[];
}

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

const MAP_BOUNDS = {
  minLat: 34.03, maxLat: 34.07,
  minLng: -118.28, maxLng: -118.20,
};

const getPositionOnMap = (location: Location) => {
  const latRange = MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat;
  const lngRange = MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng;
  
  const top = latRange > 0 ? ((MAP_BOUNDS.maxLat - location.lat) / latRange) * 100 : 50;
  const left = lngRange > 0 ? ((location.lng - MAP_BOUNDS.minLng) / lngRange) * 100 : 50;
  
  return {
    top: `${Math.max(0, Math.min(100, top))}%`,
    left: `${Math.max(0, Math.min(100, left))}%`,
  };
};

const NearbyDriversMap: React.FC<NearbyDriversMapProps> = ({ driverLocations }) => {
  return (
    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 relative overflow-hidden my-4">
      <div 
        className="absolute inset-0 bg-map-pattern opacity-20"
      ></div>

      {/* Customer Icon (static in the center) */}
      <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
        <div className="flex flex-col items-center">
            <div className="p-2 bg-green-500 rounded-full shadow-lg">
                <UserIcon className="w-6 h-6 text-white"/>
            </div>
            <span className="text-xs font-semibold mt-1 bg-gray-800 bg-opacity-70 text-white px-2 py-1 rounded">
                You
            </span>
        </div>
      </div>
      
      {/* Driver Icons */}
      {driverLocations.map((loc, index) => (
        <div
          key={index}
          className="absolute -translate-y-1/2 -translate-x-1/2"
          style={{ 
            ...getPositionOnMap(loc),
            transition: 'top 1s linear, left 1s linear',
          }}
        >
          <div className="p-1.5 bg-blue-500 rounded-full shadow-lg">
            <TruckIcon className="w-5 h-5 text-white"/>
          </div>
        </div>
      ))}

      <style>{`
        .bg-map-pattern {
          background-image: linear-gradient(rgba(0,0,0,.03) 2px, transparent 2px), linear-gradient(90deg, rgba(0,0,0,.03) 2px, transparent 2px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
};

export default NearbyDriversMap;
