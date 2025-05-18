import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { generatePassword } from '../utils/passwordGenerator';

interface StaffMember {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'staff';
  status: 'active' | 'inactive';
  restaurantId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function createStaffMember(restaurantId: string, data: Omit<StaffMember, 'id' | 'role' | 'createdAt' | 'updatedAt'>) {
  try {
    // Generate a random password
    const password = generatePassword();

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, password);
    const user = userCredential.user;

    // Create user document in users collection
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: 'staff',
      restaurantId,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    //Enregistrement du membre du personnel dans la collection des restaurants
    const staffRef = doc(db, 'restaurants', restaurantId, 'staff', user.uid);
    await setDoc(staffRef, {
      uid: user.uid,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: 'staff',
      status: 'active',
      restaurantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Send password reset email
    await sendPasswordResetEmail(auth, data.email);

    return {
      id: user.uid,
      email: data.email,
      password // Return password for printing
    };
  } catch (error) {
    console.error('Error creating staff member:', error);
    throw error;
  }
}

export async function updateStaffMember(restaurantId: string, staffId: string, updates: Partial<StaffMember>) {
  try {
    const staffRef = doc(db, 'restaurants', restaurantId, 'staff', staffId);
    await updateDoc(staffRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating staff member:', error);
    throw error;
  }
}

export async function deleteStaffMember(restaurantId: string, staffId: string) {
  try {
    await deleteDoc(doc(db, 'restaurants', restaurantId, 'staff', staffId));
  } catch (error) {
    console.error('Error deleting staff member:', error);
    throw error;
  }
}

export async function getStaffMembers(restaurantId: string) {
  try {
    const staffRef = collection(db, 'restaurants', restaurantId, 'staff');
    const q = query(staffRef, where('role', '==', 'staff'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as StaffMember[];
  } catch (error) {
    console.error('Error getting staff members:', error);
    throw error;
  }
}

export async function getStaffMember(restaurantId: string, staffId: string) {
  try {
    const staffRef = doc(db, 'restaurants', restaurantId, 'staff', staffId);
    const docSnap = await getDoc(staffRef);

    if (!docSnap.exists()) {
      throw new Error('Staff member not found');
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate(),
      updatedAt: docSnap.data().updatedAt?.toDate()
    } as StaffMember;
  } catch (error) {
    console.error('Error getting staff member:', error);
    throw error;
  }
}