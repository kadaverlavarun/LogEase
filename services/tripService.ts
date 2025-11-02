
import { Ride, RideStatus, Trip, Location, User } from '../types';
import { locationService } from './locationService';
import { getDrivers } from './authService';

const RIDE_REQUESTS_KEY = 'logease_ride_requests';
const IN_PROGRESS_RIDES_KEY = 'logease_in_progress_rides';
const TRIPS_KEY = 'logease_trips';

// Mock locations
const MOCK_LOCATIONS = {
  customer: { lat: 34.0522, lng: -118.2437, address: "Union Station, Los Angeles" },
  driver: { lat: 34.0622, lng: -118.2537, address: "Dodger Stadium, Los Angeles" },
  destination: { lat: 33.9416, lng: -118.4085, address: "LAX Airport, Los Angeles" },
};

// --- Storage Helper Functions ---
const getRideRequestsFromStorage = (): Ride[] => {
  const ridesJson = localStorage.getItem(RIDE_REQUESTS_KEY);
  return ridesJson ? JSON.parse(ridesJson) : [];
};
const saveRideRequestsToStorage = (rides: Ride[]) => {
  localStorage.setItem(RIDE_REQUESTS_KEY, JSON.stringify(rides));
};
const getInProgressRidesFromStorage = (): Record<string, Ride> => {
  const ridesJson = localStorage.getItem(IN_PROGRESS_RIDES_KEY);
  return ridesJson ? JSON.parse(ridesJson) : {};
};
const saveInProgressRidesToStorage = (rides: Record<string, Ride>) => {
  localStorage.setItem(IN_PROGRESS_RIDES_KEY, JSON.stringify(rides));
};
// ---

const _assignRide = (ride: Ride, driver: User) => {
    const inProgressRides = getInProgressRidesFromStorage();
    const updatedRide: Ride = { ...ride, status: RideStatus.ACCEPTED, driverId: driver.id, isConfirmedByDriver: false };
    inProgressRides[updatedRide.id] = updatedRide;
    saveInProgressRidesToStorage(inProgressRides);
};

const _tryToAssignQueuedRides = () => {
    let requests = getRideRequestsFromStorage();
    if (!requests.length) return;

    const allDrivers = getDrivers();
    const inProgressRides = getInProgressRidesFromStorage();
    const busyDriverIds = new Set(Object.values(inProgressRides).map(r => r.driverId));
    const availableDrivers = allDrivers.filter(d => !busyDriverIds.has(d.id));

    if (!availableDrivers.length) return;
    
    // Match available drivers to pending requests
    while(requests.length > 0 && availableDrivers.length > 0) {
        const rideToAssign = requests.shift()!;
        const driverForRide = availableDrivers.shift()!;
        _assignRide(rideToAssign, driverForRide);
    }
    
    saveRideRequestsToStorage(requests); // Save the updated list of requests
};


const initializeMockRides = () => {
  // Clear all ride-related storage on startup for a clean state
  localStorage.removeItem(RIDE_REQUESTS_KEY);
  localStorage.removeItem(IN_PROGRESS_RIDES_KEY);
};

initializeMockRides();

export const getRideForDriver = (driverId: string): Ride | null => {
  const inProgressRides = getInProgressRidesFromStorage();
  return Object.values(inProgressRides).find(r => r.driverId === driverId) || null;
};

export const getRideForCustomer = (customerId: string): Ride | null => {
  const rideInRequests = getRideRequestsFromStorage().find(r => r.customerId === customerId);
  if (rideInRequests) return rideInRequests;

  const rideInProgress = Object.values(getInProgressRidesFromStorage()).find(r => r.customerId === customerId);
  return rideInProgress || null;
};

export const requestRide = (customer: User): Ride => {
  const newRide: Ride = {
    id: `ride_${Date.now()}`, status: RideStatus.REQUESTED, customerId: customer.id, driverId: null,
    customerLocation: MOCK_LOCATIONS.customer,
    driverLocation: MOCK_LOCATIONS.driver,
    destination: MOCK_LOCATIONS.destination,
    startTime: null, endTime: null, isConfirmedByDriver: false,
    arrivedAtPickup: false, otp: null,
  };
  const requests = getRideRequestsFromStorage();
  requests.push(newRide);
  saveRideRequestsToStorage(requests);
  
  // Attempt to assign the new ride immediately
  _tryToAssignQueuedRides();
  
  // Return the ride's current state (it might have been accepted)
  return getRideForCustomer(customer.id)!;
};

export const acceptRide = (ride: Ride): Ride => {
  const inProgressRides = getInProgressRidesFromStorage();
  if (!inProgressRides[ride.id]) return ride;
  
  const updatedRide: Ride = { ...ride, isConfirmedByDriver: true };
  inProgressRides[updatedRide.id] = updatedRide;
  saveInProgressRidesToStorage(inProgressRides);
  return updatedRide;
};

export const rejectRide = (ride: Ride) => {
  const inProgressRides = getInProgressRidesFromStorage();
  delete inProgressRides[ride.id];
  saveInProgressRidesToStorage(inProgressRides);
  
  const rideRequests = getRideRequestsFromStorage();
  const rejectedRide: Ride = { ...ride, status: RideStatus.REQUESTED, driverId: null, isConfirmedByDriver: false, arrivedAtPickup: false, otp: null };
  rideRequests.unshift(rejectedRide); // Put the customer back at the front of the queue
  saveRideRequestsToStorage(rideRequests);
  
  _tryToAssignQueuedRides(); // Immediately try to find another driver
};

export const driverArrivedAtPickup = (ride: Ride): Ride => {
  const inProgressRides = getInProgressRidesFromStorage();
  if (!inProgressRides[ride.id]) return ride;

  const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4-digit OTP
  const updatedRide: Ride = { ...ride, arrivedAtPickup: true, otp: otp };
  
  inProgressRides[updatedRide.id] = updatedRide;
  saveInProgressRidesToStorage(inProgressRides);
  
  return updatedRide;
};

export const verifyOtpAndStartTrip = (ride: Ride, submittedOtp: string): { success: boolean; ride?: Ride } => {
  const inProgressRides = getInProgressRidesFromStorage();
  const storedRide = inProgressRides[ride.id];

  if (!storedRide || storedRide.otp !== submittedOtp) {
    return { success: false };
  }

  // OTP is correct, start the trip
  const startedRide = startTrip(storedRide);
  return { success: true, ride: startedRide };
};


export const startTrip = (ride: Ride): Ride => {
  const inProgressRides = getInProgressRidesFromStorage();
  if (!inProgressRides[ride.id]) return ride;

  const updatedRide: Ride = { ...ride, status: RideStatus.IN_PROGRESS, startTime: Date.now() };
  inProgressRides[updatedRide.id] = updatedRide;
  saveInProgressRidesToStorage(inProgressRides);
  return updatedRide;
};

export const endTrip = (ride: Ride): Trip => {
  const endTime = Date.now();
  const distanceKm = Math.floor(Math.random() * 25) + 5;
  const earnings = distanceKm * 12 + 50;
  const newTrip: Trip = {
    id: `trip_${ride.id}`, driverId: ride.driverId!, customerId: ride.customerId,
    startTime: ride.startTime!, endTime: endTime, distanceKm: distanceKm,
    earnings: parseFloat(earnings.toFixed(2)),
    startAddress: ride.customerLocation.address, endAddress: ride.destination.address,
  };

  const allTrips = getTripsForDriver(ride.driverId!);
  allTrips.push(newTrip);
  localStorage.setItem(`${TRIPS_KEY}_${ride.driverId}`, JSON.stringify(allTrips));
  
  const inProgressRides = getInProgressRidesFromStorage();
  delete inProgressRides[ride.id];
  saveInProgressRidesToStorage(inProgressRides);

  locationService.stopTracking();
  
  // Now that this driver is free, check if there are queued rides
  _tryToAssignQueuedRides();

  return newTrip;
};

export const cancelRide = (ride: Ride) => {
  if (ride.status === RideStatus.REQUESTED) {
    let requests = getRideRequestsFromStorage();
    requests = requests.filter(r => r.id !== ride.id);
    saveRideRequestsToStorage(requests);
  } else {
    // FIX: Corrected typo from getInProgressRidesFromstorage to getInProgressRidesFromStorage
    const inProgressRides = getInProgressRidesFromStorage();
    const driverId = inProgressRides[ride.id]?.driverId;
    delete inProgressRides[ride.id];
    saveInProgressRidesToStorage(inProgressRides);
    // If a driver was assigned, check for queued rides for them now
    if (driverId) {
        _tryToAssignQueuedRides();
    }
  }
  locationService.stopTracking();
};

export const getTripsForDriver = (driverId: string): Trip[] => {
  const tripsJson = localStorage.getItem(`${TRIPS_KEY}_${driverId}`);
  return tripsJson ? JSON.parse(tripsJson) : [];
};

export const getNearbyDriversCount = (): number => {
    return Math.floor(Math.random() * 8) + 2;
};

// Provides a non-persistent, deterministic estimation for display purposes.
export const estimateRideDetails = (ride: Ride): { distanceKm: number, earnings: number } => {
    const hash = (s: string) => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
    const combinedHash = Math.abs(hash(ride.customerLocation.address) + hash(ride.destination.address));
    const distanceKm = 5 + (combinedHash % 20); // 5 to 25 km
    const earnings = distanceKm * 12 + 50;
    return { distanceKm, earnings: parseFloat(earnings.toFixed(2)) };
}
