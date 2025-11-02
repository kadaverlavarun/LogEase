
import { Ride, RideStatus, Location, LocationUpdate } from '../types';

type LocationUpdateSubscriber = (update: LocationUpdate) => void;

const subscribers: Set<LocationUpdateSubscriber> = new Set();
let trackingInterval: number | null = null;
let idleTrackingInterval: number | null = null;
let currentRide: Ride | null = null;
let progress = 0; // Represents driver's progress on a trip leg, from 0 to 1

// A base location for idle simulation
const baseIdleLocation: Location = { lat: 34.0622, lng: -118.2537, address: "Dodger Stadium, Los Angeles" };
let idleDirection = 1; // To control the back-and-forth movement

const notify = (update: LocationUpdate) => {
  subscribers.forEach(callback => callback(update));
};

const subscribe = (callback: LocationUpdateSubscriber): (() => void) => {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
};

const stopTracking = () => {
  if (trackingInterval) clearInterval(trackingInterval);
  if (idleTrackingInterval) clearInterval(idleTrackingInterval);
  trackingInterval = null;
  idleTrackingInterval = null;
  currentRide = null;
  progress = 0;
};

const startIdleTracking = () => {
    stopTracking(); // Ensure no other tracking is active
    let currentIdleLng = baseIdleLocation.lng;

    idleTrackingInterval = window.setInterval(() => {
        // Simulate a small back-and-forth movement
        currentIdleLng += 0.001 * idleDirection;
        if (currentIdleLng > baseIdleLocation.lng + 0.02 || currentIdleLng < baseIdleLocation.lng - 0.02) {
            idleDirection *= -1; // Reverse direction
        }
        notify({ location: { ...baseIdleLocation, lng: currentIdleLng }, etaSeconds: null });
    }, 1500);
}

const startTracking = (ride: Ride, onComplete: () => void) => {
  stopTracking(); // Stop any existing tracking, including idle tracking
  currentRide = ride;
  progress = 0;

  trackingInterval = window.setInterval(() => {
    if (!currentRide) {
      stopTracking();
      return;
    }
    
    progress = Math.min(progress + 0.1, 1);

    let startLoc: Location, endLoc: Location;

    if (currentRide.status === RideStatus.ACCEPTED) {
      startLoc = currentRide.driverLocation;
      endLoc = currentRide.customerLocation;
    } else if (currentRide.status === RideStatus.IN_PROGRESS) {
      startLoc = currentRide.customerLocation;
      endLoc = currentRide.destination;
    } else {
      stopTracking();
      return;
    }
    
    const newLat = startLoc.lat + (endLoc.lat - startLoc.lat) * progress;
    const newLng = startLoc.lng + (endLoc.lng - startLoc.lng) * progress;
    const newLocation: Location = { ...startLoc, lat: newLat, lng: newLng };
    
    const etaSeconds = Math.round(((1 - progress) / 0.1) * 1.5);
    notify({ location: newLocation, etaSeconds });
    
    if (progress >= 1) {
      onComplete();
      stopTracking();
    }
  }, 1500);
};

export const locationService = {
  subscribe,
  startTracking,
  startIdleTracking,
  stopTracking,
};
