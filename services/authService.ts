import { User, Role } from '../types';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, getDocs } from "firebase/firestore";

// Firebase configuration and initialization
const firebaseConfig = {
  apiKey: "AIzaSyBrvNYsEv7KTZ90ObRUG60LuDxXj8rzsOM",
  authDomain: "elog-42217.firebaseapp.com",
  projectId: "elog-42217",
  storageBucket: "elog-42217.firebasestorage.app",
  messagingSenderId: "856474718279",
  appId: "1:856474718279:web:30158f6d36ad8501cc6162",
  measurementId: "G-J21PRTZSRN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const registerDriver = async (name: string, email: string, password: string, phoneNumber: string, vehicleNumber: string, licenseNumber: string): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName: name });

    const newUser: User = {
      id: user.uid,
      name,
      email,
      role: Role.DRIVER,
      phoneNumber,
      vehicleNumber,
      licenseNumber,
    };
    
    const firestoreData: Omit<User, 'id' | 'gstNumber'> = {
        name, email, role: Role.DRIVER, phoneNumber, vehicleNumber, licenseNumber
    };

    await setDoc(doc(db, "users", user.uid), firestoreData);

    return { success: true, message: 'Registration successful!', user: newUser };
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: 'An account with this email already exists.' };
    }
    return { success: false, message: error.message };
  }
};

export const registerAdmin = async (name: string, email: string, password: string, gstNumber: string): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName: name });

    const newUser: User = {
      id: user.uid,
      name,
      email,
      role: Role.ADMIN,
      gstNumber,
    };
    
    const firestoreData: Omit<User, 'id' | 'phoneNumber' | 'vehicleNumber' | 'licenseNumber'> = {
        name, email, role: Role.ADMIN, gstNumber
    };

    await setDoc(doc(db, "users", user.uid), firestoreData);

    return { success: true, message: 'Registration successful!', user: newUser };
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: 'An account with this email already exists.' };
    }
    return { success: false, message: error.message };
  }
};


// FIX: Add missing registerCustomer function
export const registerCustomer = async (name: string, email: string, password: string): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName: name });

    const newUser: User = {
      id: user.uid,
      name,
      email,
      role: Role.CUSTOMER,
    };
    
    await setDoc(doc(db, "users", user.uid), {
        name, email, role: Role.CUSTOMER
    });

    return { success: true, message: 'Registration successful!', user: newUser };
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: 'An account with this email already exists.' };
    }
    return { success: false, message: error.message };
  }
};

export const login = async (email: string, password: string): Promise<{ user: User | null; error?: string }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userProfile = await getUserProfile(userCredential.user);
    if (!userProfile) {
        return { user: null, error: "Your account exists, but we couldn't load your profile. Please contact support." };
    }
    return { user: userProfile };
  } catch (error: any) {
    console.error("Firebase login error:", error);
    if (error.code === 'auth/invalid-credential') {
      return { user: null, error: 'Invalid email or password. Please check your credentials and try again.' };
    }
    return { user: null, error: 'An unexpected error occurred during login. Please try again later.' };
  }
};

export const logout = async () => {
  await signOut(auth);
};

export const getUserProfile = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    const docRef = doc(db, "users", firebaseUser.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: firebaseUser.uid, ...docSnap.data() } as User;
    } else {
        console.error("No such user profile in Firestore!");
        return null;
    }
}

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const getAllUsers = async (): Promise<User[]> => {
    const q = query(collection(db, "users"));
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as User);
    });
    return users;
};