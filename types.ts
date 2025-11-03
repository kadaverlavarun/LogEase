export enum Role {
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
  // FIX: Add CUSTOMER role
  CUSTOMER = 'CUSTOMER',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  // FIX: Make properties optional to support different user roles
  phoneNumber?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  gstNumber?: string;
}

export interface Location {
  lat: number;
  lng: number;
  // FIX: Add optional address property
  address?: string;
}

export interface Trip {
  id: string;
  driverId: string;
  driverName: string;
  vehicleNumber: string;
  startTime: number;
  startLocation: Location;
  endTime: number | null;
  endLocation: Location | null;
  durationMinutes: number | null;
  status: 'ACTIVE' | 'COMPLETED';
  // FIX: Add missing properties for trip analytics
  earnings: number;
  distanceKm: number;
}

// FIX: Add missing types for customer ride feature
export enum RideStatus {
  IDLE = 'IDLE',
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface Ride {
  id: string;
  customerId: string;
  driverId: string | null;
  status: RideStatus;
  customerLocation: Location;
  driverLocation: Location | null;
  destination: Location;
  otp?: string;
  arrivedAtPickup?: boolean;
  isConfirmedByDriver?: boolean;
}

export interface LocationUpdate {
  location: Location;
  etaSeconds: number | null;
}