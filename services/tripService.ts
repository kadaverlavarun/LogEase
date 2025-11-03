import { Ride, RideStatus, Trip, Location, User } from '../types';
import { locationService } from './locationService';
import { getDrivers } from './authService';
import { db } from './authService';
import { collection, doc, addDoc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs, limit, orderBy } from 'firebase/firestore';


const MOCK_LOCATIONS = {
  customer: { lat: 34.0522, lng: -118.2437, address: "Union Station, Los Angeles" },
  driver: { lat: 34.0622, lng: -118.2537, address: "Dodger Stadium, Los Angeles" },
  destination: { lat: 33.9416, lng: -118.4085, address: "LAX Airport, Los Angeles" },
};

const _tryToAssignQueuedRides = async () => {
    const q = query(collection(db, "rides"), where("status", "==", RideStatus.REQUESTED), orderBy("id"), limit(1));
    const requestSnapshot = await getDocs(q);

    if (requestSnapshot.empty) return;

    const rideToAssign = { id: requestSnapshot.docs[0].id, ...requestSnapshot.docs[0].data() } as Ride;

    const allDrivers = await getDrivers();

    const activeRidesQuery = query(collection(db, "rides"), where("status", "in", [RideStatus.ACCEPTED, RideStatus.IN_PROGRESS]));
    const activeRidesSnapshot = await getDocs(activeRidesQuery);
    const busyDriverIds = new Set(activeRidesSnapshot.docs.map(doc => doc.data().driverId));
    
    const availableDrivers = allDrivers.filter(d => !busyDriverIds.has(d.id));

    if (!availableDrivers.length) return;

    const driverForRide = availableDrivers[0];
    const rideRef = doc(db, "rides", rideToAssign.id);
    await updateDoc(rideRef, {
        status: RideStatus.ACCEPTED,
        driverId: driverForRide.id,
        isConfirmedByDriver: false
    });
};

export const getRideForDriver = async (driverId: string): Promise<Ride | null> => {
  const q = query(
    collection(db, "rides"), 
    where("driverId", "==", driverId),
    where("status", "in", [RideStatus.ACCEPTED, RideStatus.IN_PROGRESS]),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const rideDoc = querySnapshot.docs[0];
    return { id: rideDoc.id, ...rideDoc.data() } as Ride;
  }
  return null;
};

export const getRideForCustomer = async (customerId: string): Promise<Ride | null> => {
  const q = query(
    collection(db, "rides"),
    where("customerId", "==", customerId),
    where("status", "in", [RideStatus.REQUESTED, RideStatus.ACCEPTED, RideStatus.IN_PROGRESS]),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const rideDoc = querySnapshot.docs[0];
    return { id: rideDoc.id, ...rideDoc.data() } as Ride;
  }
  return null;
};

export const acceptRide = async (ride: Ride): Promise<Ride> => {
  const rideRef = doc(db, "rides", ride.id);
  const updatedRide = { ...ride, isConfirmedByDriver: true };
  await updateDoc(rideRef, { isConfirmedByDriver: true });
  return updatedRide;
};

const simulateDriverAcceptance = (rideId: string) => {
    // Step 1: Assign a driver after a delay
    setTimeout(async () => {
        const rideRef = doc(db, "rides", rideId);
        const rideSnap = await getDoc(rideRef);

        if (!rideSnap.exists() || rideSnap.data().status !== RideStatus.REQUESTED) {
            return;
        }

        const allDrivers = await getDrivers();
        const activeRidesQuery = query(collection(db, "rides"), where("status", "in", [RideStatus.ACCEPTED, RideStatus.IN_PROGRESS]));
        const activeRidesSnapshot = await getDocs(activeRidesQuery);
        const busyDriverIds = new Set(activeRidesSnapshot.docs.map(doc => doc.data().driverId));
        let availableDrivers = allDrivers.filter(d => !busyDriverIds.has(d.id));
        
        if (availableDrivers.length === 0 && allDrivers.length > 0) {
            availableDrivers = [allDrivers[Math.floor(Math.random() * allDrivers.length)]];
        }

        if (availableDrivers.length > 0) {
            const driverForRide = availableDrivers[0];
            await updateDoc(rideRef, {
                status: RideStatus.ACCEPTED,
                driverId: driverForRide.id,
                isConfirmedByDriver: false
            });

            // Step 2: Simulate the driver accepting the ride
            setTimeout(async () => {
                const currentRideSnap = await getDoc(rideRef);
                if (currentRideSnap.exists() && !currentRideSnap.data().isConfirmedByDriver) {
                     await updateDoc(rideRef, { isConfirmedByDriver: true });
                }
            }, 3000 + Math.random() * 2000);
        }
    }, 2000 + Math.random() * 2000);
};

export const requestRide = async (customer: User): Promise<Ride> => {
  const newRideData = {
    id: `ride_${Date.now()}`, status: RideStatus.REQUESTED, customerId: customer.id, driverId: null,
    customerLocation: MOCK_LOCATIONS.customer,
    driverLocation: MOCK_LOCATIONS.driver,
    destination: MOCK_LOCATIONS.destination,
    startTime: null, endTime: null, isConfirmedByDriver: false,
    arrivedAtPickup: false, otp: null,
  };
  const rideRef = await addDoc(collection(db, "rides"), newRideData);
  const newRide = { ...newRideData, id: rideRef.id };
  await setDoc(doc(db, "rides", rideRef.id), newRide); // Set with ID field

  simulateDriverAcceptance(newRide.id);
  
  return newRide;
};

export const rejectRide = async (ride: Ride) => {
  const rideRef = doc(db, "rides", ride.id);
  await updateDoc(rideRef, {
      status: RideStatus.REQUESTED,
      driverId: null,
      isConfirmedByDriver: false,
      arrivedAtPickup: false,
      otp: null
  });
  _tryToAssignQueuedRides();
};

export const driverArrivedAtPickup = async (ride: Ride): Promise<Ride> => {
  const rideRef = doc(db, "rides", ride.id);
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const updatedRide = { ...ride, arrivedAtPickup: true, otp: otp };
  await updateDoc(rideRef, { arrivedAtPickup: true, otp: otp });
  return updatedRide;
};

export const verifyOtpAndStartTrip = async (ride: Ride, submittedOtp: string): Promise<{ success: boolean; ride?: Ride }> => {
  const rideRef = doc(db, "rides", ride.id);
  const rideSnap = await getDoc(rideRef);
  
  if (!rideSnap.exists()) {
    return { success: false };
  }
  
  // For the demo ride, accept any 4-digit number as OTP.
  const isDemoRide = ride.customerId === 'customer_demo_123';
  const isValidOtp = isDemoRide
    ? /^\d{4}$/.test(submittedOtp) // For the demo, check if it's a 4-digit number
    : rideSnap.data().otp === submittedOtp; // Original check for real rides

  if (!isValidOtp) {
    return { success: false };
  }

  const startedRide = await startTrip(ride);
  return { success: true, ride: startedRide };
};

export const startTrip = async (ride: Ride): Promise<Ride> => {
  const rideRef = doc(db, "rides", ride.id);
  const updatedRide = { ...ride, status: RideStatus.IN_PROGRESS, startTime: Date.now() };
  await updateDoc(rideRef, { status: RideStatus.IN_PROGRESS, startTime: Date.now() });
  return updatedRide;
};

export const endTrip = async (ride: Ride): Promise<Trip> => {
  const endTime = Date.now();
  const distanceKm = Math.floor(Math.random() * 25) + 5;
  const earnings = distanceKm * 12 + 50;
  const newTrip: Trip = {
    id: `trip_${ride.id}`, driverId: ride.driverId!, customerId: ride.customerId,
    startTime: ride.startTime!, endTime: endTime, distanceKm: distanceKm,
    earnings: parseFloat(earnings.toFixed(2)),
    startAddress: ride.customerLocation.address, endAddress: ride.destination.address,
  };

  await addDoc(collection(db, "trips"), newTrip);
  
  const rideRef = doc(db, "rides", ride.id);
  await deleteDoc(rideRef);

  locationService.stopTracking();
  
  _tryToAssignQueuedRides();

  return newTrip;
};

export const cancelRide = async (ride: Ride) => {
  const rideRef = doc(db, "rides", ride.id);
  await deleteDoc(rideRef);

  if (ride.driverId) {
    _tryToAssignQueuedRides();
  }
  
  locationService.stopTracking();
};

export const getTripsForDriver = async (driverId: string): Promise<Trip[]> => {
  const q = query(collection(db, "trips"), where("driverId", "==", driverId));
  const querySnapshot = await getDocs(q);
  const trips: Trip[] = [];
  querySnapshot.forEach((doc) => {
    trips.push({ id: doc.id, ...doc.data() } as Trip);
  });
  return trips;
};

export const getNearbyDriversCount = (): number => {
    return Math.floor(Math.random() * 8) + 2;
};

export const estimateRideDetails = (ride: Ride): { distanceKm: number, earnings: number } => {
    const hash = (s: string) => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
    const combinedHash = Math.abs(hash(ride.customerLocation.address) + hash(ride.destination.address));
    const distanceKm = 5 + (combinedHash % 20);
    const earnings = distanceKm * 12 + 50;
    return { distanceKm, earnings: parseFloat(earnings.toFixed(2)) };
}

export const createDemoRideForDriver = async (driver: User): Promise<Ride | null> => {
    // Check if driver already has an active ride to avoid creating duplicates
    const existingRide = await getRideForDriver(driver.id);
    if (existingRide) {
        return null; // Don't create a ride if one exists
    }

    const mockCustomer = {
        id: 'customer_demo_123',
        name: 'Demo Customer',
    };

    const newRideData = {
        status: RideStatus.ACCEPTED,
        customerId: mockCustomer.id,
        driverId: driver.id,
        customerLocation: MOCK_LOCATIONS.customer,
        driverLocation: MOCK_LOCATIONS.driver, 
        destination: MOCK_LOCATIONS.destination,
        startTime: null,
        endTime: null,
        isConfirmedByDriver: false,
        arrivedAtPickup: false,
        otp: null,
    };
    
    const rideRef = await addDoc(collection(db, "rides"), newRideData);
    const newRide = { ...newRideData, id: rideRef.id };
    await setDoc(doc(db, "rides", rideRef.id), newRide);
    
    return newRide;
};