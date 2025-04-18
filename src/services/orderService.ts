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
    
    // Use appropriate prefix based on payment method
    const paymentMethodPrefix = 
      cleanedOrderData.paymentMethod === 'apple_pay' ? 'AP' : 
      cleanedOrderData.paymentMethod === 'google_pay' ? 'GP' : 
      cleanedOrderData.paymentMethod === 'cash' ? 'ESP' : 'CB';
    
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
    if (cleanedOrderData.paymentMethod === 'cash') {
      initialStatus = 'pending';
      paymentStatus = 'pending';
    } 
    // Si paiement par carte/Apple Pay/Google Pay, l'ordre est invisible jusqu'à confirmation Stripe
    else if (['card', 'apple_pay', 'google_pay'].includes(cleanedOrderData.paymentMethod)) {
      initialStatus = 'awaiting_payment';  // Ne sera pas visible dans le dashboard
     paymentStatus = 'awaiting_payment'; 
    }
    // Fallback pour tout autre méthode de paiement
    else {
      initialStatus = 'pending';
      paymentStatus = 'pending';
    }
    
    // Créer la commande
    const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
    const orderDoc = await addDoc(ordersRef, {
      ...cleanedOrderData,
      paymentMethod: cleanedOrderData.paymentMethod, // Ensure payment method is explicitly set
      orderNumber,
      status: initialStatus,
      paymentStatus: paymentStatus,
     paymentAttemptTimestamp: serverTimestamp(),
     visibleInDashboard: orderData.paymentMethod === 'cash', // Visible uniquement pour les paiements en espèces
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`Order ${orderDoc.id} created with status ${initialStatus} and payment status ${paymentStatus}`);

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

    return orderIds;
  } catch (error) {
    console.error('Error creating food court order:', error);
    throw error;
  }
};