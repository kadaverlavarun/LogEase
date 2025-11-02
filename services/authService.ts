import { User, Role } from '../types';

const USERS_KEY = 'logease_users';
const CURRENT_USER_KEY = 'logease_current_user';

// Initialize with some mock users
const initializeMockUsers = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    const mockUsers: User[] = [
      { id: 'cust1', name: 'customer', role: Role.CUSTOMER },
      { id: 'cust2', name: 'alice', role: Role.CUSTOMER },
      { id: 'cust3', name: 'bob', role: Role.CUSTOMER },
      { id: 'driver1', name: 'driver', role: Role.DRIVER, vehicleNumber: 'DRV-001' },
      { id: 'driver2', name: 'charlie', role: Role.DRIVER, vehicleNumber: 'DRV-002' },
      { id: 'driver3', name: 'diana', role: Role.DRIVER, vehicleNumber: 'DRV-003' },
    ];
    const mockPasswords = {
      'customer': 'password123',
      'alice': 'password123',
      'bob': 'password123',
      'driver': 'password123',
      'charlie': 'password123',
      'diana': 'password123'
    };
    localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
    localStorage.setItem('logease_passwords', JSON.stringify(mockPasswords));
  }
};

initializeMockUsers();

const getStoredUsers = (): User[] => {
  const usersJson = localStorage.getItem(USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

const getStoredPasswords = (): Record<string, string> => {
  const passwordsJson = localStorage.getItem('logease_passwords');
  return passwordsJson ? JSON.parse(passwordsJson) : {};
}

export const registerDriver = (name: string, password: string, vehicleNumber: string): { success: boolean, message: string } => {
  const users = getStoredUsers();
  if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
    return { success: false, message: 'Driver name already exists.' };
  }
  if (users.some(u => u.vehicleNumber?.toLowerCase() === vehicleNumber.toLowerCase())) {
    return { success: false, message: 'Vehicle number is already registered.' };
  }

  const newUser: User = {
    id: `driver_${Date.now()}`,
    name,
    role: Role.DRIVER,
    vehicleNumber,
  };
  
  users.push(newUser);
  const passwords = getStoredPasswords();
  passwords[name] = password;

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem('logease_passwords', JSON.stringify(passwords));
  
  return { success: true, message: 'Registration successful!' };
};

export const registerCustomer = (name: string, password: string): { success: boolean, message: string } => {
  const users = getStoredUsers();
  if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
    return { success: false, message: 'Customer name already exists.' };
  }

  const newUser: User = {
    id: `cust_${Date.now()}`,
    name,
    role: Role.CUSTOMER,
  };

  users.push(newUser);
  const passwords = getStoredPasswords();
  passwords[name] = password;

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem('logease_passwords', JSON.stringify(passwords));

  return { success: true, message: 'Registration successful!' };
};

export const login = (name: string, password: string): User | null => {
  const users = getStoredUsers();
  const passwords = getStoredPasswords();

  const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());

  if (user && passwords[user.name] === password) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }
  return null;
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem(CURRENT_USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

export const getDrivers = (): User[] => {
    return getStoredUsers().filter(u => u.role === Role.DRIVER);
};