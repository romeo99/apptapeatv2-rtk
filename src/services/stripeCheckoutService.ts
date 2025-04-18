import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CartItem } from '../types';

interface CreateCheckoutSessionParams {
  restaurantId: string;
  items: CartItem[];
  total: number;
  orderId: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession({
  restaurantId,
  items,
  total,
  orderId,
  successUrl,
  cancelUrl
}: CreateCheckoutSessionParams): Promise<string> {
  try {
    // Récupérer les informations du restaurant
    const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
    if (!restaurantDoc.exists()) {
      throw new Error('Restaurant not found');
    }
    
    const restaurantData = restaurantDoc.data();
    const stripeSecretKey = restaurantData.stripeSecretKey;
    
    if (!stripeSecretKey) {
      throw new Error('Restaurant does not have a Stripe secret key configured');
    }

    // Préparer les données pour la requête Stripe Checkout
    const formData = new URLSearchParams();
    formData.append('success_url', `${successUrl}?session_id={CHECKOUT_SESSION_ID}`);
    formData.append('cancel_url', `${cancelUrl}?order_id=${orderId}`);
    formData.append('mode', 'payment');

    // Get the order to determine the payment method
    const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderDoc.data();
    const paymentMethod = orderData.paymentMethod;
    
    // Add appropriate payment method types
    if (paymentMethod === 'apple_pay') {
      formData.append('payment_method_types[]', 'card');
      formData.append('payment_method_types[]', 'apple_pay');
      console.log('Adding Apple Pay payment method');
    } else if (paymentMethod === 'google_pay') {
      formData.append('payment_method_types[]', 'card');
      console.log('Adding Google Pay payment method (via card)');
    } else {
      formData.append('payment_method_types[]', 'card');
      console.log('Adding Card payment method');
    }
    
    // Ajouter les items du panier
    items.forEach((item, index) => {
      formData.append(`line_items[${index}][price_data][currency]`, 'eur');
      formData.append(`line_items[${index}][price_data][product_data][name]`, item.name);
      if (item.image) {
        formData.append(`line_items[${index}][price_data][product_data][images][]`, item.image);
      }
      formData.append(`line_items[${index}][price_data][unit_amount]`, Math.round(item.price * 100).toString());
      formData.append(`line_items[${index}][quantity]`, item.quantity.toString());
    });
    
    // Ajouter les métadonnées
    formData.append('metadata[restaurant_id]', restaurantId);
    formData.append('metadata[order_id]', orderId);

    // Faire la requête à l'API Stripe
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Stripe API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const session = await response.json();
    
    // Mettre à jour la commande avec l'ID de session Stripe
    await updateDoc(orderRef, {
      stripeSessionId: session.id,
      paymentStatus: 'awaiting_payment',
      paymentAttemptedAt: serverTimestamp()
    });

    // Log pour le débogage
    console.log(`Checkout session created for order ${orderId}, stripe session ID: ${session.id}`);

    return session.url;
  } catch (error) {
    console.error('Error creating Stripe Checkout session:', error);
    
    // En cas d'erreur, mettre à jour la commande pour indiquer l'échec du paiement
    try {
      const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentStatus: 'failed',
        updatedAt: serverTimestamp()
      });
    } catch (updateError) {
      console.error('Error updating order status after payment failure:', updateError);
    }
    
    throw error;
  }
}