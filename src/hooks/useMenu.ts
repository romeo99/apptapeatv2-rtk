import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { MenuItem } from '../types/firebase';

export function useMenu(restaurantId: string) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'restaurants', restaurantId, 'menuItems'),
      orderBy('categoryId'),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const menuData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MenuItem[];
        setMenu(menuData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching menu:', err);
        setError('Failed to fetch menu items');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [restaurantId]);

  const createMenuItem = async (itemData: Omit<MenuItem, 'id'>) => {
    try {
      if (!restaurantId) throw new Error('Restaurant ID is required');

      const docRef = await addDoc(collection(db, 'restaurants', restaurantId, 'menuItems'), {
        ...itemData,
        restaurantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (err) {
      console.error('Error creating menu item:', err);
      throw err;
    }
  };

  const updateMenuItem = async (itemId: string, data: Partial<MenuItem>) => {
    try {
      if (!restaurantId) throw new Error('Restaurant ID is required');

      const itemRef = doc(db, 'restaurants', restaurantId, 'menuItems', itemId);
      await updateDoc(itemRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating menu item:', err);
      throw err;
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    try {
      if (!restaurantId) throw new Error('Restaurant ID is required');

      await deleteDoc(doc(db, 'restaurants', restaurantId, 'menuItems', itemId));
    } catch (err) {
      console.error('Error deleting menu item:', err);
      throw err;
    }
  };

  return {
    menu,
    loading,
    error,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem
  };
}