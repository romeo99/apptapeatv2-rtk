import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useRestaurantContext } from '../context/RestaurantContext';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: 'scooter' | 'bike' | 'car';
  vehicleNumber: string;
  zone: string;
  status: 'available' | 'busy' | 'offline';
  restaurantId: string;
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
      if (!restaurant?.id) throw new Error('Restaurant ID is required');
      
      await addDoc(collection(db, 'restaurants', restaurant.id, 'drivers'), {
        ...data,
        restaurantId: restaurant.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
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