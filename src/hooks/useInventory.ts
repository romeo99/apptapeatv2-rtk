import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { InventoryItem } from '../types/firebase';
import {
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustStock
} from '../services/inventoryService';

export function useInventory(restaurantId: string) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'restaurants', restaurantId, 'inventory'),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          quantity: Number(doc.data().quantity || 0),
          optimalStock: Number(doc.data().optimalStock || 0),
          price: Number(doc.data().price || 0),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
          lastUpdated: doc.data().lastUpdated?.toDate?.() || new Date()
        })) as InventoryItem[];
        
        setInventory(items);
        setLoading(false);
        setError(null);
      },
      error: (err) => {
        console.error('Error fetching inventory:', err);
        setError('Failed to fetch inventory');
        setLoading(false);
        setInventory([]);
      }
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const addItem = async (
    itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
    imageFile?: File
  ): Promise<void> => {
    try {
      if (!restaurantId) throw new Error('Restaurant ID is required');
      await createInventoryItem(restaurantId, itemData, imageFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
      throw err;
    }
  };

  const updateItem = async (
    itemId: string,
    updates: Partial<InventoryItem>,
    imageFile?: File
  ) => {
    try {
      if (!restaurantId) throw new Error('Restaurant ID is required');
      await updateInventoryItem(itemId, restaurantId, updates, imageFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      throw err;
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      if (!restaurantId) throw new Error('Restaurant ID is required');
      await deleteInventoryItem(restaurantId, itemId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      throw err;
    }
  };

  const updateStock = async (itemId: string, newQuantity: number) => {
    try {
      if (!restaurantId) throw new Error('Restaurant ID is required');
      await adjustStock(restaurantId, itemId, newQuantity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
      throw err;
    }
  };

  return {
    inventory,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    updateStock
  };
}