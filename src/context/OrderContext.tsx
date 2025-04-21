import { collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { sendOrderNotification } from '../services/notificationService';
import { createOrder as createFirebaseOrder } from '../services/orderService';
import type { Order } from '../types/firebase';
import { useAuth } from './AuthContext';
import { useRestaurantContext } from './RestaurantContext';

interface OrderContextType {
  orders: Order[];
  loading: boolean;
  error: string | null;
  getDeliveryOrders: () => Order[];
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  createOrder: (
    restaurantId: string,
    orderData: {
      items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
        image?: string;
        menuOptions?: any;
      }>;
      type: 'dine_in' | 'takeaway' | 'delivery';
      subtotal: number;
      tax: number;
      total: number;
      paymentMethod: string;
      scheduledTime?: { date: string; time: string } | null;
      delivery?: {
        name: string;
        address: string;
        phone: string;
      };
    }
  ) => Promise<string>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { restaurant } = useRestaurantContext();
  const [lastUpdatedOrder, setLastUpdatedOrder] = useState<{ id: string; status: string } | null>(null);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      if (!restaurant?.id) throw new Error('Restaurant ID is required');
      if (!orderId) throw new Error('Order ID is required');

      const orderRef = doc(db, 'restaurants', restaurant.id, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const orderData = orderDoc.data();
      const updates: any = {
        status,
        updatedAt: serverTimestamp(),
        lastStatusUpdate: new Date().toISOString(),
        statusUpdatedAt: serverTimestamp(),
        visibleInDashboard: true // Ensure order is visible in dashboard when status changes
      };

      // If order is cash payment and status changes to preparing, mark as paid
      if (orderData.paymentMethod === 'cash' &&
        orderData.paymentStatus === 'pending' &&
        status === 'preparing') {
        updates.paymentStatus = 'paid';
        updates.paymentConfirmedAt = serverTimestamp();
        updates.paymentConfirmedAt = serverTimestamp();
      }
      await updateDoc(orderRef, updates);

      // Log pour le débogage
      console.log(`Order ${orderId} status updated to ${status} with payment status ${updates.paymentStatus || orderData.paymentStatus}`);
      // Log pour le débogage
      console.log(`Order ${orderId} status updated to ${status} with payment status ${updates.paymentStatus || orderData.paymentStatus}`);

      // Envoyer une notification au client si l'ordre a un userId
      // Envoyer une notification au client si l'ordre a un userId
      const order = orders.find(o => o.id === orderId);
      if (order?.userId) {
        await sendOrderNotification(order.userId, orderId, status);
      }
      return;
    } catch (err) {
      console.error('Error updating order status:', err);
      throw new Error('Failed to update order status');
    }
  };
  useEffect(() => {
    if (!restaurant?.id) return;

    const q = query(
      collection(db, 'restaurants', restaurant.id, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        restaurantId: restaurant.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Order[];

      // Envoyer des notifications pour les changements de statut
      if (user?.uid) {
        ordersData.forEach(order => {
          const oldOrder = orders.find(o => o.id === order.id);
          // Vérifier si c'est une mise à jour différente de la dernière
          if (oldOrder &&
            oldOrder.status !== order.status &&
            (!lastUpdatedOrder ||
              lastUpdatedOrder.id !== order.id ||
              lastUpdatedOrder.status !== order.status)) {
            setLastUpdatedOrder({ id: order.id, status: order.status });
            sendOrderNotification(user.uid, order.id, order.status);
          }
        });
      }

      setOrders(ordersData);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching orders:', err);
      setError('Erreur lors du chargement des commandes');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurant?.id, user?.uid, lastUpdatedOrder]);

  const createOrder = async (restaurantId: string, orderData: any) => {
    try {
      return await createFirebaseOrder(restaurantId, orderData);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const getDeliveryOrders = () => {
    return orders.filter(order =>
      order.type === 'delivery' &&
      ['pending', 'confirmed'].includes(order.status)
    );
  };
  return (
    <OrderContext.Provider value={{
      orders,
      loading,
      error,
      getDeliveryOrders,
      createOrder,
      updateOrderStatus
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrderContext() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderContext must be used within OrderProvider');
  }
  return context;
}