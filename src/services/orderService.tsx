import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const createOrder = async (restaurantId: string, orderData: any) => {
  try {
    // Vérifier que toutes les données nécessaires sont présentes
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }
    
    if (!orderData || !orderData.items || !Array.isArray(orderData.items)) {
      throw new Error('Invalid order data: items array is required');
    }
    
    // Nettoyer les données pour éviter les valeurs undefined
    const cleanedOrderData = JSON.parse(JSON.stringify(orderData));
    
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantDoc = await getDoc(restaurantRef);

    if (!restaurantDoc.exists()) {
      throw new Error('Restaurant not found');
    }

    // Generate order number
    const counterRef = doc(db, 'restaurants', restaurantId, 'settings', 'orderCounters');
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

    const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
    const orderDoc = await addDoc(ordersRef, {
      ...cleanedOrderData,
      orderNumber,
      status: orderData.paymentMethod === 'cash' ? 'pending' : 'awaiting_payment',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return orderDoc.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const createFoodCourtOrder = async (foodCourtId: string, orderData: any) => {
  try {
    if (!foodCourtId) {
      throw new Error('Food court ID is required');
    }
    
    if (!orderData || !orderData.restaurantOrders || !Array.isArray(orderData.restaurantOrders)) {
      throw new Error('Invalid order data: restaurantOrders array is required');
    }
    
    // Nettoyer les données pour éviter les valeurs undefined
    const cleanedOrderData = JSON.parse(JSON.stringify(orderData));
    
    const foodCourtRef = doc(db, 'foodCourts', foodCourtId);
    const foodCourtDoc = await getDoc(foodCourtRef);

    if (!foodCourtDoc.exists()) {
      throw new Error('Food court not found');
    }

    // Create an array to store all order IDs
    const orderIds: string[] = [];

    // Set status based on payment method
    const initialStatus = orderData.paymentMethod === 'cash' ? 'pending' : 'awaiting_payment';

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
        paymentStatus: orderData.paymentMethod === 'cash' ? 'pending' : 'awaiting_payment',
        scheduledTime: cleanedOrderData.scheduledTime,
        delivery: cleanedOrderData.delivery,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      orderIds.push(orderDoc.id);
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

    return orderIds;
  } catch (error) {
    console.error('Error creating food court order:', error);
    throw error;
  }
};