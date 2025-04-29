import {
  addDoc,
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const createOrder = async (restaurantId: string, orderData: {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    remarks?: string;
    menuOptions?: any;
    sections: { name: string, choice: string, included: boolean }
    excludedIngredients?: string[];
  }>;
  type: 'dine_in' | 'takeaway' | 'delivery';
  subtotal: number;
  total: number;
  paymentMethod: string;
  message?: string;
  customerName?: string;
  orderNumber?: string;
  scheduledTime?: { date: string; time: string } | null;
  delivery?: {
    name: string;
    address: string;
    phone: string;
  };
}) => {

  try {
    // Vérifier que toutes les données nécessaires sont présentes
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }

    if (!orderData || !orderData.items || !Array.isArray(orderData.items)) {
      throw new Error('Invalid order data: items array is required');
    }

    if (!orderData.paymentMethod?.trim()) {
      throw new Error('Le moyen de paiement est requis');
    }

    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantDoc = await getDoc(restaurantRef);

    if (!restaurantDoc.exists()) {
      throw new Error('Restaurant not found');
    }

    const restaurantInfo = {
      name: restaurantDoc.data()?.name || 'Restaurant',
      logo: restaurantDoc.data()?.logo || restaurantDoc.data()?.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      id: restaurantId
    };


    // Get table number if present
    const orderTypeData = localStorage.getItem('orderType');
    let orderType = { type: 'takeaway', table: '' };
    let tableNumber = null;

    try {
      if (orderTypeData) {
        orderType = JSON.parse(orderTypeData);
        if (orderType.table) {
          tableNumber = String(orderType.table);
        }
      }
      // Handle register mode
      const isRegisterMode = new URLSearchParams(window.location.search).get('mode') === 'register';
      if (isRegisterMode) {
        orderType.type = 'dine_in';
        orderType.table = 'caisse';
      }
    } catch (e) {
      console.error('Error parsing order type:', e);
    }

    // Nettoyer les données pour éviter les valeurs undefined
    //const cleanedOrderData = JSON.parse(JSON.stringify(orderData));

    const cleanedItems = orderData.items.map(item => ({
      id: item.id,
      name: item.name?.trim() || 'Article',
      price: Number(item.price) || 0,
      quantity: Math.max(1, Number(item.quantity) || 1),
      image: item.image || null,
      remarks: typeof item.remarks === 'string' ? item.remarks.trim() || null : null,
      sections: Array.isArray(item.sections) ? item.sections.map(section => ({
        name: String(section.name || ''),
        choice: String(section.choice || ''),
        included: Boolean(section.included)
      })) : null,
      menuOptions: item.menuOptions ? {
        drink: item.menuOptions.drink || null,
        side: item.menuOptions.side || null,
        sauces: Array.isArray(item.menuOptions.sauces) ? item.menuOptions.sauces : []
      } : null,
      excludedIngredients: Array.isArray(item.excludedIngredients) ? item.excludedIngredients : [],
    }));

    // Generate order number
    const counterRef = doc(db, 'restaurants', restaurantId, 'settings', 'orderCounters');
    const counterDoc = await getDoc(counterRef);

    let counterData = counterDoc.exists() ? counterDoc.data() : { count: 0 };
    const nextCount = (counterData.count || 0) + 1;

    // Use appropriate prefix based on payment method
    const paymentMethodPrefix =
      orderData.paymentMethod === 'apple_pay' ? 'AP' :
        orderData.paymentMethod === 'google_pay' ? 'GP' :
          orderData.paymentMethod === 'cash' ? 'ESP' : 'CB';

    const orderNumber = `${paymentMethodPrefix}${nextCount}`;

    // Update the counter document
    await setDoc(counterRef, {
      count: nextCount,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Configurer le statut initial et le statut de paiement selon le mode de paiement
    let initialStatus;
    let paymentStatus;

    // Si paiement en espèces, l'ordre est immédiatement visible (pending)
    if (orderData.paymentMethod === 'cash') {
      initialStatus = 'pending';
      paymentStatus = 'pending';
    }
    // Si paiement par carte/Apple Pay/Google Pay, l'ordre est invisible jusqu'à confirmation Stripe
    else if (['card', 'apple_pay', 'google_pay'].includes(orderData.paymentMethod)) {
      initialStatus = 'awaiting_payment';  // Ne sera pas visible dans le dashboard
      paymentStatus = 'awaiting_payment';
    }
    // Fallback pour tout autre méthode de paiement
    else {
      initialStatus = 'pending';
      paymentStatus = 'pending';
    }

    const orderToCreate = {
      items: cleanedItems,
      restaurantId,
      restaurantInfo,
      paymentMethod: orderData.paymentMethod, // Ensure payment method is explicitly set
      type: orderType.type,
      ...(orderType.table && { table: orderType.table }),
      status: orderData.scheduledTime ? 'scheduled' : initialStatus,
      paymentStatus: paymentStatus,
      paymentAttemptTimestamp: serverTimestamp(),
      visibleInDashboard: orderData.paymentMethod === 'cash', // Visible uniquement pour les paiements en espèces
      subtotal: Math.max(0, Number(orderData.subtotal) || 0),
      total: Math.max(0, Number(orderData.total) || 0),
      orderNumber: orderData.orderNumber ?? orderNumber,
      ...(tableNumber && { table: tableNumber }),
      ...(orderData.scheduledTime && {
        scheduledTime: orderData.scheduledTime
      }),
      ...(orderData.delivery && {
        delivery: {
          name: String(orderData.delivery.name).trim(),
          address: String(orderData.delivery.address).trim(),
          phone: String(orderData.delivery.phone).trim()
        }
      }),
      ...(orderData.message && { message: orderData.message }),
      ...(orderData.customerName && { customerName: orderData.customerName }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    // Créer la commande
    const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
    const orderDoc = await addDoc(ordersRef, orderToCreate);

    console.log(`Order ${orderDoc.id} created with status ${initialStatus} and payment status ${paymentStatus}`);

    // If in register mode, don't save to user's orders
    const isRegisterMode = new URLSearchParams(window.location.search).get('mode') === 'register';
    if (isRegisterMode) {
      // Mark order as paid immediately in register mode
      await updateDoc(orderDoc, {
        paymentStatus: 'paid',
        updatedAt: serverTimestamp()
      });
      return orderDoc.id;
    }

    // Update restaurant stats in a transaction to avoid race conditions
    await runTransaction(db, async (transaction) => {
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      const restaurantDoc = await transaction.get(restaurantRef);

      if (!restaurantDoc.exists()) {
        throw new Error('Restaurant not found');
      }

      const currentStats = restaurantDoc.data()?.stats || {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        pendingOrders: 0,
        dailyRevenue: {},
        dailyOrders: {},
        paymentMethodBreakdown: {
          card: 0,
          cash: 0,
          apple_pay: 0
        },
        topProducts: []
      };

      const dateKey = new Date().toISOString().split('T')[0];
      const newStats = {
        totalRevenue: (currentStats.totalRevenue || 0) + orderToCreate.total,
        totalOrders: (currentStats.totalOrders || 0) + 1,
        averageOrderValue: ((currentStats.totalRevenue || 0) + orderToCreate.total) / ((currentStats.totalOrders || 0) + 1),
        pendingOrders: (currentStats.pendingOrders || 0) + 1,
        dailyRevenue: {
          ...currentStats.dailyRevenue,
          [dateKey]: ((currentStats.dailyRevenue || {})[dateKey] || 0) + orderToCreate.total
        },
        dailyOrders: {
          ...currentStats.dailyOrders,
          [dateKey]: ((currentStats.dailyOrders || {})[dateKey] || 0) + 1
        },
        paymentMethodBreakdown: {
          ...currentStats.paymentMethodBreakdown,
          [orderToCreate.paymentMethod]: ((currentStats.paymentMethodBreakdown || {})[orderToCreate.paymentMethod] || 0) + orderToCreate.total
        },
        topProducts: currentStats.topProducts || []
      };

      transaction.update(restaurantRef, {
        stats: newStats,
        updatedAt: serverTimestamp()
      });
    });

    // Update restaurant stats
    const statsDoc = await getDoc(restaurantRef);
    const currentStats = statsDoc.data()?.stats || {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      pendingOrders: 0,
      dailyRevenue: {},
      dailyOrders: {},
      paymentMethodBreakdown: {
        card: 0,
        cash: 0,
        apple_pay: 0
      },
      topProducts: []
    };

    const dateKey = new Date().toISOString().split('T')[0];

    await updateDoc(restaurantRef, {
      stats: {
        ...currentStats,
        totalRevenue: currentStats.totalRevenue + orderToCreate.total,
        totalOrders: currentStats.totalOrders + 1,
        averageOrderValue: (currentStats.totalRevenue + orderToCreate.total) / (currentStats.totalOrders + 1),
        pendingOrders: currentStats.pendingOrders + 1,
        dailyRevenue: {
          ...currentStats.dailyRevenue,
          [dateKey]: (currentStats.dailyRevenue[dateKey] || 0) + orderToCreate.total
        },
        dailyOrders: {
          ...currentStats.dailyOrders,
          [dateKey]: (currentStats.dailyOrders[dateKey] || 0) + 1
        },
        paymentMethodBreakdown: {
          ...currentStats.paymentMethodBreakdown,
          [orderToCreate.paymentMethod]: (currentStats.paymentMethodBreakdown[orderToCreate.paymentMethod] || 0) + orderToCreate.total
        }
      }
    });
    // If user is authenticated, save to their orders collection
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userOrderRef = doc(db, 'users', currentUser.uid, 'orders', orderDoc.id);
      await setDoc(userOrderRef, {
        ...orderToCreate,
        id: orderDoc.id
      });
    }

    return orderDoc.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const createFoodCourtOrder = async (foodCourtId: string, orderData: {
  restaurantOrders: Array<{
    restaurantId: string;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      image?: string;
      remarks?: string;
      menuOptions?: any;
      sections: { name: string, choice: string, included: boolean }
      excludedIngredients?: string[];
    }>;
    type: 'dine_in' | 'takeaway' | 'delivery';
    subtotal: number;
    total: number;
    paymentMethod: string;
    scheduledTime?: { date: string; time: string } | null;
    delivery?: {
      name: string;
      address: string;
      phone: string;
    };
  }>;
  type: 'dine_in' | 'takeaway' | 'delivery';
  subtotal: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  scheduledTime?: { date: string; time: string } | null;
  delivery?: {
    name: string;
    address: string;
    phone: string;
  };
}) => {
  try {
    if (!foodCourtId) {
      throw new Error('Food court ID is required');
    }

    if (!orderData || !orderData.restaurantOrders || !Array.isArray(orderData.restaurantOrders)) {
      throw new Error('Invalid order data: restaurantOrders array is required');
    }

    if (!orderData.paymentMethod?.trim()) {
      throw new Error('Le moyen de paiement est requis');
    }

    // Get food court info first
    const foodCourtDoc = await getDoc(doc(db, 'foodCourts', foodCourtId));

    if (!foodCourtDoc.exists()) {
      throw new Error('Food court invalide ou introuvable');
    }
    /* 
        // Nettoyer les données pour éviter les valeurs undefined
        const cleanedOrderData = JSON.parse(JSON.stringify(orderData));
    
        // Create an array to store all order IDs
        const orderIds: string[] = [];
    
        // Configurer le statut initial et le statut de paiement selon le mode de paiement
        let initialStatus;
        let paymentStatus;
    
        // Si paiement en espèces, l'ordre est immédiatement visible (pending)
        if (orderData.paymentMethod === 'cash') {
          initialStatus = 'pending';
          paymentStatus = 'pending';
        }
        // Si paiement par carte, l'ordre est invisible (awaiting_payment) jusqu'à confirmation Stripe
        else {
          initialStatus = 'awaiting_payment';  // Ne sera pas visible dans le dashboard
          paymentStatus = 'awaiting_payment';
        }
    
        // Create individual orders for each restaurant
        for (const restaurantOrder of cleanedOrderData.restaurantOrders) {
          const restaurantRef = doc(db, 'restaurants', restaurantOrder.restaurantId);
          const restaurantDoc = await getDoc(restaurantRef);
    
          if (!restaurantDoc.exists()) {
            throw new Error(`Restaurant ${restaurantOrder.restaurantId} not found`);
          }
    
          // Generate order number for each restaurant
          const counterRef = doc(db, 'restaurants', restaurantOrder.restaurantId, 'settings', 'orderCounters');
          const counterDoc = await getDoc(counterRef);
    
          let counterData = counterDoc.exists() ? counterDoc.data() : { count: 0 };
          const nextCount = (counterData.count || 0) + 1;
    
          // Generate order number based on payment method
          const prefix = orderData.paymentMethod === 'cash' ? 'ESP' : 'CB';
          const orderNumber = `${prefix}${nextCount}`;
    
          // Update the counter document
          await setDoc(counterRef, {
            count: nextCount,
            lastUpdated: serverTimestamp()
          }, { merge: true });
    
          const ordersRef = collection(db, 'restaurants', restaurantOrder.restaurantId, 'orders');
          const orderDoc = await addDoc(ordersRef, {
            orderNumber,
            items: restaurantOrder.items,
            status: initialStatus,
            foodCourtId,
            type: cleanedOrderData.type,
            paymentMethod: cleanedOrderData.paymentMethod,
            paymentStatus: paymentStatus,
            scheduledTime: cleanedOrderData.scheduledTime,
            delivery: cleanedOrderData.delivery,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
    
          orderIds.push(orderDoc.id);
    
          console.log(`Food court order created for restaurant ${restaurantOrder.restaurantId}: ${orderDoc.id}`);
        }
    
        // Create a master food court order
        const foodCourtOrdersRef = collection(db, 'foodCourts', foodCourtId, 'orders');
        await addDoc(foodCourtOrdersRef, {
          orderIds,
          status: initialStatus,
          ...cleanedOrderData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
    
        return orderIds; */

    // Save each restaurant order
    const restaurantOrderIds = await Promise.all(orderData.restaurantOrders.map(async (restaurantOrder) => {
      return createOrder(restaurantOrder.restaurantId, {
        ...restaurantOrder,
        type: orderData.type,
        subtotal: orderData.subtotal,
        total: orderData.total,
        paymentMethod: orderData.paymentMethod,
        scheduledTime: orderData.scheduledTime,
        delivery: orderData.delivery,
        customerName: orderData.customerName,
      });
    }));

    return restaurantOrderIds;
  } catch (error) {
    console.error('Error creating food court order:', error);
    throw error;
  }
};