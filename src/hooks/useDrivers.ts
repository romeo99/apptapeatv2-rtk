import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { useRestaurantContext } from '../context/RestaurantContext';
import { registerUser } from '../services/authService';
import { generatePassword } from '../utils/passwordGenerator';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: 'scooter' | 'bike' | 'car';
  vehicleNumber: string;
  zone: string;
  status: 'available' | 'busy' | 'offline';
  restaurantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function useDrivers() {
  const { restaurant } = useRestaurantContext();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant?.id) return;

    const driversRef = collection(db, 'restaurants', restaurant.id, 'drivers');
    const unsubscribe = onSnapshot(driversRef, (snapshot) => {
      const driversData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Driver[];
      setDrivers(driversData);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching drivers:', err);
      setError('Erreur lors du chargement des livreurs');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurant?.id]);

  const addDriver = async (data: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Generate a random password
      const password = generatePassword();

      if (!restaurant?.id) throw new Error('Restaurant ID is required');

      const driverUser = await registerUser({
        email: data.email,
        password: password,
        phone: data.phone,
        firstName: '',
        lastName: data.name,
      }, true);

      await setDoc(doc(db, 'restaurants', restaurant.id, 'drivers', driverUser.uid), {
        ...data,
        restaurantId: restaurant.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send password reset email
      await sendPasswordResetEmail(auth, data.email);
    } catch (err) {
      console.error('Error adding driver:', err);
      throw err;
    }
  };

  const updateDriver = async (driverId: string, data: Partial<Driver>) => {
    try {
      if (!restaurant?.id) throw new Error('Restaurant ID is required');

      const driverRef = doc(db, 'restaurants', restaurant.id, 'drivers', driverId);
      await updateDoc(driverRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating driver:', err);
      throw err;
    }
  };

  const deleteDriver = async (driverId: string) => {
    try {
      if (!restaurant?.id) throw new Error('Restaurant ID is required');

      await deleteDoc(doc(db, 'restaurants', restaurant.id, 'drivers', driverId));
    } catch (err) {
      console.error('Error deleting driver:', err);
      throw err;
    }
  };

  return {
    drivers,
    loading,
    error,
    addDriver,
    updateDriver,
    deleteDriver
  };
}