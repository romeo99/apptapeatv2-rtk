import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useRestaurantContext } from '../context/RestaurantContext';
import type { Order } from '../types/firebase';

export function useLiveOrders() {
  const { restaurant } = useRestaurantContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant?.id) return;

    const ordersRef = collection(db, 'restaurants', restaurant.id, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching live orders:', err);
      setError('Erreur lors du chargement des commandes');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurant?.id]);

  const updateOrderStatus = async (orderId: string, status: Order['status'], additionalData?: any) => {
    try {
      if (!restaurant?.id) throw new Error('Restaurant ID is required');

      const orderRef = doc(db, 'restaurants', restaurant.id, 'orders', orderId);
      const historyRef = collection(db, 'restaurants', restaurant.id, 'history');

      // Update order status
      await updateDoc(orderRef, {
        status,
        ...additionalData,
        updatedAt: serverTimestamp()
      });

      // If order is completed or cancelled, move it to history
      if (status === 'completed' || status === 'cancelled') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          // Add to history
          await addDoc(historyRef, {
            ...order,
            status,
            ...additionalData,
            createdAt: order.createdAt,
            completedAt: new Date(),
            updatedAt: serverTimestamp()
          });

          // Delete from live orders
          await deleteDoc(orderRef);
        }
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      throw err;
    }
  };

  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!restaurant?.id) throw new Error('Restaurant ID is required');

      const ordersRef = collection(db, 'restaurants', restaurant.id, 'orders');
      const docRef = await addDoc(ordersRef, {
        ...orderData,
        restaurantId: restaurant.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (err) {
      console.error('Error creating order:', err);
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