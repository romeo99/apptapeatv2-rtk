import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Order } from '../types/firebase';

export function useOrderHistory(restaurantId: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query orders collection with simple orderBy
      const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
      const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        try {
          const ordersData = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              updatedAt: doc.data().updatedAt?.toDate() || new Date()
            }))
            // Filter completed/cancelled orders in memory instead of in query
            .filter(order => ['completed', 'cancelled'].includes(order.status)) as Order[];

          setOrders(ordersData);
          setLoading(false);
        } catch (err) {
          console.error('Error processing orders:', err);
          setError('Erreur lors du traitement des commandes');
          setLoading(false);
        }
      }, (err) => {
        console.error('Error fetching orders:', err);
        setError('Erreur lors du chargement des commandes');
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up orders listener:', err);
      setError('Erreur lors de l\'initialisation');
      setLoading(false);
    }
  }, [restaurantId]);

  return {
    orders,
    loading,
    error
  };
}