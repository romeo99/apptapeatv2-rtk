import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { deductInventoryFromOrder } from '../services/inventoryService';
import type { Order } from '../types/firebase';

export function useOrders(restaurantId: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'restaurants', restaurantId, 'orders'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
          })) as Order[];

          setOrders(ordersData);
          setLoading(false);
        },
        (err) => {
          console.error('Error in real-time orders update:', err);
          setError('Erreur lors de la mise à jour en temps réel');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up orders listener:', err);
      setError('Failed to initialize orders');
      setLoading(false);
    }
  }, [restaurantId]);

  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!restaurantId) throw new Error('Restaurant ID is required');

      const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
      const docRef = await addDoc(ordersRef, {
        ...orderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (err) {
      console.error('Error creating order:', err);
      throw err;
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status: Order['status'],
    additionalData?: {
      paymentStatus?: 'pending' | 'paid';
      paymentMethod?: string;
      driverId?: string | null;
    }
  ) => {
    try {
      if (!restaurantId) throw new Error('Restaurant ID is required');

      const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId);
      await updateDoc(orderRef, {
        status,
        ...additionalData,
        updatedAt: serverTimestamp()
      });

      // If order is completed, deduct from inventory
      if (status === 'completed') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          await deductInventoryFromOrder(restaurantId, order.items);
        }
      }
    } catch (err) {
      console.error('Error updating order:', err);
      throw err;
    }
  };

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrderStatus
  };
}