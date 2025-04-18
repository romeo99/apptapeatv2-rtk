import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Restaurant, MenuItem, Category } from '../types/firebase';

export function useRestaurant(restaurantId: string) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        
        // Fetch restaurant details
        const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
        if (!restaurantDoc.exists()) {
          throw new Error('Restaurant not found');
        }
        setRestaurant({ id: restaurantDoc.id, ...restaurantDoc.data() } as Restaurant);

        // Fetch menu items
        const menuQuery = query(
          collection(db, 'menuItems'),
          where('restaurantId', '==', restaurantId)
        );
        const menuSnapshot = await getDocs(menuQuery);
        const menuItems = menuSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MenuItem[];
        setMenu(menuItems);

        // Fetch categories
        const categoriesQuery = query(
          collection(db, 'categories'),
          where('restaurantId', '==', restaurantId)
        );
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        setCategories(categoriesData.sort((a, b) => a.order - b.order));

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchRestaurant();
    }
  }, [restaurantId]);

  const getMenuItemsByCategory = (categoryId: string) => {
    return menu.filter(item => item.categoryId === categoryId);
  };

  const getCategoryById = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const getMenuItem = (menuItemId: string) => {
    return menu.find(item => item.id === menuItemId);
  };

  return {
    restaurant,
    menu,
    categories,
    loading,
    error,
    getMenuItemsByCategory,
    getCategoryById,
    getMenuItem
  };
}