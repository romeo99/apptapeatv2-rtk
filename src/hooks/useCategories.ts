import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Category } from '../types/firebase';

export function useCategories(restaurantId: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'restaurants', restaurantId, 'categories'),
      orderBy('order')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const categoriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        })) as Category[];
        
        setCategories(categoriesData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching categories:', err);
        setError('Failed to fetch categories');
        setLoading(false);
        setCategories([]);
      }
    );

    return () => unsubscribe();
  }, [restaurantId]);

  return {
    categories,
    loading,
    error
  };
}