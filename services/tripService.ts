
// FIX: Import missing Ride and RideStatus types
import { Trip, User, Location, Ride, RideStatus } from '../types';
import { db } from './authService';
import { collection, doc, addDoc, getDoc, updateDoc, query, where, getDocs, limit, orderBy } from 'firebase/firestore';

/**
 * Gets the current active trip for a given driver.
 * @param driverId The ID of the driver.
 * @returns The active trip object or null if none exists.
 */
export const getActiveTripForDriver = async (driverId: string): Promise<Trip | null> => {
    const q = query(
        collection(db, "trips"),
        where("driverId", "==", driverId),
        where("status", "==", "ACTIVE"),
        limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const tripDoc = querySnapshot.docs[0];
        return { id: tripDoc.id, ...tripDoc.data() } as Trip;
    }
    return null;
};

/**
 * Creates a new trip document in Firestore when a driver starts a trip.
 * @param driver The user object for the driver.
 * @param startLocation The starting location coordinates.
 * @returns The newly created trip object.
 */
export const startNewTrip = async (driver: User, startLocation: Location): Promise<Trip> => {
    if (!driver.vehicleNumber) {
        throw new Error("Driver has no vehicle number assigned.");
    }
    const newTripData: Omit<Trip, 'id'> = {
        driverId: driver.id,
        driverName: driver.name,
        vehicleNumber: driver.vehicleNumber,
        startTime: Date.now(),
        startLocation,
        endTime: null,
        endLocation: null,
        durationMinutes: null,
        status: 'ACTIVE',
        // FIX: Initialize earnings and distance
        earnings: 0,
        distanceKm: 0,
    };
    const docRef = await addDoc(collection(db, "trips"), newTripData);
    return { id: docRef.id, ...newTripData };
};

/**
 * Updates an existing trip document when a driver ends a trip.
 * @param tripId The ID of the trip to end.
 * @param endLocation The ending location coordinates.
 * @returns The updated trip object.
 */
export const endCurrentTrip = async (tripId: string, endLocation: Location): Promise<Trip> => {
    const tripRef = doc(db, "trips", tripId);
    const tripSnap = await getDoc(tripRef);

    if (!tripSnap.exists()) {
        throw new Error("Trip not found!");
    }

    const tripData = tripSnap.data() as Omit<Trip, 'id'>;
    const endTime = Date.now();
    const durationMinutes = Math.round((endTime - tripData.startTime) / 60000);
    
    // FIX: Add mock calculation for distance and earnings
    const distanceKm = durationMinutes > 0 ? parseFloat((durationMinutes * 0.75 + Math.random() * 5).toFixed(1)) : 0;
    const earnings = distanceKm > 0 ? parseFloat((distanceKm * 2.5 + Math.random() * 10).toFixed(2)) : 0;

    // Add a mock address for demonstration purposes
    const mockAddresses = [
        "456 Oak Avenue, Springfield",
        "789 Pine Street, Metropolis",
        "101 Maple Drive, Gotham",
        "212 Birch Lane, Star City",
        "333 Elm Road, Central City",
        "555 Industrial Park, Sector 7",
        "888 Commerce Blvd, Downtown",
    ];
    const locationWithAddress: Location = {
        ...endLocation,
        address: mockAddresses[Math.floor(Math.random() * mockAddresses.length)]
    };


    await updateDoc(tripRef, {
        endTime,
        endLocation: locationWithAddress,
        status: 'COMPLETED',
        durationMinutes,
        distanceKm,
        earnings,
    });

    return { ...tripData, id: tripId, endTime, endLocation: locationWithAddress, status: 'COMPLETED', durationMinutes, distanceKm, earnings };
};

/**
 * Retrieves all trips from Firestore for the admin dashboard.
 * @returns An array of all trip objects, sorted by start time.
 */
export const getAllTrips = async (): Promise<Trip[]> => {
    const q = query(collection(db, "trips"), orderBy("startTime", "desc"));
    const querySnapshot = await getDocs(q);
    const trips: Trip[] = [];
    querySnapshot.forEach((doc) => {
        trips.push({ id: doc.id, ...doc.data() } as Trip);
    });
    return trips;
};

// FIX: Add missing function to get trips for a specific driver
export const getTripsForDriver = async (driverId: string): Promise<Trip[]> => {
    const q = query(
        collection(db, "trips"),
        where("driverId", "==", driverId),
        orderBy("startTime", "desc")
    );
    const querySnapshot = await getDocs(q);
    const trips: Trip[] = [];
    querySnapshot.forEach((doc) => {
        trips.push({ id: doc.id, ...doc.data() } as Trip);
    });
    return trips;
};

// FIX: Add dummy implementations for customer ride features to resolve compile errors
export const getRideForCustomer = async (customerId: string): Promise<Ride | null> => {
    console.log('getRideForCustomer called for', customerId);
    return null;
};

export const getNearbyDriversCount = (): number => {
    return Math.floor(Math.random() * 5) + 1;
};

export const requestRide = async (user: User): Promise<Ride> => {
    console.log('requestRide called for', user.id);
    const ride: Ride = {
        id: `ride_${Date.now()}`,
        customerId: user.id,
        driverId: null,
        status: RideStatus.REQUESTED,
        customerLocation: { lat: 34.0522, lng: -118.2437, address: "Los Angeles City Hall" },
        driverLocation: null,
        destination: { lat: 34.0622, lng: -118.2537, address: "Dodger Stadium" },
    };
    return ride;
};

export const cancelRide = async (ride: Ride): Promise<void> => {
    console.log('cancelRide called for ride', ride.id);
    return Promise.resolve();
};