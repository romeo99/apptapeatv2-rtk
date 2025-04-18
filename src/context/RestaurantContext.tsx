import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../config/firebase';
import type { MenuItem, Restaurant } from '../types/firebase';
import type { Category, } from '../types/index';
import { useAuth } from './AuthContext';

interface RestaurantContextType {
  restaurant: Restaurant | null;
  themeColor: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => Promise<void>;
  categories: Category[];
  menu: MenuItem[];
  loading: boolean;
  error: string | null;
  updateRestaurantInfo: (data: Partial<Restaurant>) => Promise<void>;
  updateOptions: (options: any) => Promise<void>;
  updateLocalMenu: (item: MenuItem) => void;
  updateCategoryOrder: (categories: Category[]) => Promise<void>;
  updateMenuItemsOrder: (items: MenuItem[], categoryId: string) => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [themeColor, setThemeColor] = useState('#10B981');
  const restaurantId = searchParams.get('restaurantId') || user?.uid;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isOpen, setIsOpenState] = useState<boolean>(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setIsOpen = async (open: boolean) => {
    try {
      if (!restaurant?.id) return;

      setIsOpenState(open);

      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        isOpen: open,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating restaurant status:', err);
      setIsOpenState(!open);
      throw err;
    }
  };

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      setError('Restaurant ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Loading data for restaurant:', restaurantId);

      // Listen to restaurant document
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      const unsubscribeRestaurant = onSnapshot(restaurantRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setRestaurant({ id: doc.id, ...data } as Restaurant);
          setThemeColor(data.theme?.primaryColor || '#10B981');
          setIsOpenState(data.isOpen ?? true);
          console.log('Restaurant data loaded:', data);
        } else {
          setError('Restaurant not found');
          setLoading(false);
        }
      });

      // Listen to categories subcollection
      const categoriesRef = collection(db, 'restaurants', restaurantId, 'categories');
      const categoriesQuery = query(categoriesRef, orderBy('order'));

      const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
        const categoriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        setCategories(categoriesData);
        console.log('Categories loaded:', categoriesData);
      });

      // Listen to menuItems subcollection
      const menuRef = collection(db, 'restaurants', restaurantId, 'menuItems');
      const menuQuery = query(menuRef, orderBy('order', 'asc'));

      const unsubscribeMenu = onSnapshot(menuQuery, (snapshot) => {
        const menuData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as MenuItem[];
        setMenu(menuData);
        console.log('Menu items loaded:', menuData);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching menu:', error);
        setError('Erreur lors du chargement du menu');
        setLoading(false);
      });

      return () => {
        unsubscribeRestaurant();
        unsubscribeCategories();
        unsubscribeMenu();
      };
    } catch (err) {
      console.error('Error setting up listeners:', err);
      setError('Erreur lors du chargement des données');
      setLoading(false);
    }
  }, [restaurantId]);

  const updateRestaurantInfo = async (data: Partial<Restaurant>) => {
    if (!restaurant?.id) throw new Error('Restaurant non trouvé');

    const restaurantRef = doc(db, 'restaurants', restaurant.id);
    await updateDoc(restaurantRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  };

  const updateOptions = async (options: any) => {
    if (!restaurant?.id) throw new Error('Restaurant non trouvé');

    const restaurantRef = doc(db, 'restaurants', restaurant.id);
    await updateDoc(restaurantRef, {
      ...options,
      updatedAt: serverTimestamp()
    });

    setRestaurant(prev => prev ? { ...prev, ...options } : null);
  };

  const updateLocalMenu = (updatedItem: MenuItem) => {
    setMenu(prev => prev.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    ));
  };

  const updateCategoryOrder = async (updatedCategories: Category[]) => {
    if (!restaurant?.id) return;
    const batch = writeBatch(db);
    updatedCategories.forEach((category, index) => {
      if (category.id) {
        const categoryRef = doc(db, 'restaurants', restaurant.id, 'categories', category.id);
        batch.update(categoryRef, { order: index });
      }
    });
    await batch.commit();
  };

  const updateMenuItemsOrder = async (items: MenuItem[], categoryId: string) => {
    if (!restaurant?.id) return;
    const batch = writeBatch(db);
    items.forEach((item, index) => {
      if (item.id) {
        const itemRef = doc(db, 'restaurants', restaurant.id, 'menuItems', item.id);
        batch.update(itemRef, { order: index });
      }
    });
    await batch.commit();
  };

  return (
    <RestaurantContext.Provider
      value={{
        restaurant,
        themeColor,
        isOpen,
        setIsOpen,
        categories,
        menu,
        loading,
        error,
        updateRestaurantInfo,
        updateOptions,
        updateLocalMenu,
        updateCategoryOrder,
        updateMenuItemsOrder
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurantContext() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurantContext must be used within a RestaurantProvider');
  }
  return context;
}