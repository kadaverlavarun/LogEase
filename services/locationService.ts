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

// --- New additions for Nearby Drivers Simulation ---

interface SimulatedDriver {
  id: number;
  location: Location;
  target: { lat: number, lng: number };
}

let nearbyDrivers: SimulatedDriver[] = [];
let nearbyDriversInterval: number | null = null;
const nearbyDriversSubscribers: Set<(locations: Location[]) => void> = new Set();
const MAP_BOUNDS = {
  minLat: 34.03, maxLat: 34.07,
  minLng: -118.28, maxLng: -118.20,
};

const getRandomLocationInBounds = (): { lat: number, lng: number } => {
  return {
    lat: MAP_BOUNDS.minLat + Math.random() * (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat),
    lng: MAP_BOUNDS.minLng + Math.random() * (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng),
  };
};

const notifyNearbyDrivers = () => {
  const locations = nearbyDrivers.map(d => d.location);
  nearbyDriversSubscribers.forEach(cb => cb(locations));
};

const subscribeToNearbyDrivers = (callback: (locations: Location[]) => void): (() => void) => {
  nearbyDriversSubscribers.add(callback);
  return () => {
    nearbyDriversSubscribers.delete(callback);
  };
};

const stopNearbyDriversSimulation = () => {
  if (nearbyDriversInterval) clearInterval(nearbyDriversInterval);
  nearbyDriversInterval = null;
  nearbyDrivers = [];
};

const startNearbyDriversSimulation = (count: number) => {
  stopNearbyDriversSimulation();

  if (count === 0) return;

  // Initialize drivers
  for (let i = 0; i < count; i++) {
    const startPos = getRandomLocationInBounds();
    nearbyDrivers.push({
      id: i,
      location: { ...startPos, address: '' },
      target: getRandomLocationInBounds(),
    });
  }
  
  notifyNearbyDrivers(); // Initial notification

  nearbyDriversInterval = window.setInterval(() => {
    nearbyDrivers.forEach(driver => {
      const vectorLat = driver.target.lat - driver.location.lat;
      const vectorLng = driver.target.lng - driver.location.lng;
      
      // Move 5% of the remaining distance each tick
      driver.location.lat += vectorLat * 0.05;
      driver.location.lng += vectorLng * 0.05;

      // If close enough to target, get a new one
      const distSq = vectorLat**2 + vectorLng**2;
      if (distSq < 0.000001) { // Close enough threshold
          driver.target = getRandomLocationInBounds();
      }
    });

    notifyNearbyDrivers();
  }, 1000);
};


export const locationService = {
  subscribe,
  startTracking,
  startIdleTracking,
  stopTracking,
  // New exports
  subscribeToNearbyDrivers,
  startNearbyDriversSimulation,
  stopNearbyDriversSimulation,
};