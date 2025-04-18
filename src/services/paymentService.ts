import { getFunctions, httpsCallable } from 'firebase/functions';
import { loadStripe, Stripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51PH7PV1LCdahk0ySP7Kcm127sOdgOuOKSBNxVuIegQhWgi0AvXL4NupqnQY0wDQPEo38AJi3wV9mrFdAzSLvFGXG00PttU7DHT');

interface PaymentIntentRequest {
  amount: number;
  orderId: string;
  restaurantId: string;
}

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export async function initializePayment(data: PaymentIntentRequest): Promise<PaymentIntentResponse> {
  try {
    const functions = getFunctions();
    const createPaymentIntent = httpsCallable<PaymentIntentRequest, PaymentIntentResponse>(
      functions, 
      'createPaymentIntent'
    );
    
    const result = await createPaymentIntent(data);
    return result.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

export async function confirmPayment(
  clientSecret: string,
  paymentMethod: 'card' | 'apple_pay' | 'google_pay'
): Promise<{ success: boolean; error?: string }> {
  try {
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe not loaded');

    let result;

    if (paymentMethod === 'card') {
      result = await stripe.confirmCardPayment(clientSecret);
    } else if (paymentMethod === 'apple_pay' || paymentMethod === 'google_pay') {
      result = await stripe.confirmPayment({
        clientSecret,
        payment_method: paymentMethod,
        return_url: `${window.location.origin}/order-confirmation`,
      });
    }

    if (result?.error) {
      throw result.error;
    }

    return { success: true };
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed'
    };
  }
}