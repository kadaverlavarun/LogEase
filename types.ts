
export enum Role {
  CUSTOMER = 'CUSTOMER',
  DRIVER = 'DRIVER',
}

export interface User {
  id: string;
  name: string;
  role: Role;
  vehicleNumber?: string;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export enum RideStatus {
  IDLE = 'IDLE',
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface Ride {
  id: string;
  status: RideStatus;
  customerId: string;
  driverId: string | null;
  customerLocation: Location;
  driverLocation: Location;
  destination: Location;
  startTime: number | null;
  endTime: number | null;
  isConfirmedByDriver?: boolean;
  arrivedAtPickup?: boolean;
  otp?: string | null;
}

export interface Trip {
  id: string;
  driverId: string;
  customerId: string;
  startTime: number;
  endTime: number;
  distanceKm: number;
  earnings: number;
  startAddress: string;
  endAddress: string;
}

export interface LocationUpdate {
  location: Location;
  etaSeconds: number | null;
}
