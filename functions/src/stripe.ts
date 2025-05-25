/* eslint-disable @typescript-eslint/no-explicit-any */
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import Stripe from 'stripe';

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2025-01-27.acacia',
});

const db = admin.firestore();

interface CartItem {
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface PaymentSessionRestaurant {
  restaurantId: string;
  stripeAccountId: string;
  amount: number;
  items: CartItem[];
  deliveryFees: number;
  isDelivery: boolean;
}

interface PaymentSession {
  id: string;
  restaurants: PaymentSessionRestaurant[];
  status: 'pending' | 'completed' | 'failed';
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  userId: string;
  checkoutSessionId: string;
}

export const createCheckoutSession = functions.https.onCall(async (data, context) => {

  const { restaurants, successUrl, cancelUrl, fees, method, userFistname } = data;

  const userId = userFistname;

  try {
    // Validate all restaurants first
    await Promise.all(
      restaurants.map(async (restaurant: { items: any[]; restaurantId: string; amount: any; stripeAccountId: any }) => {
        const restaurantRef = db.doc('restaurants/' + restaurant.restaurantId);
        const restaurantDoc = await restaurantRef.get();

        if (!restaurantDoc.exists) {
          throw new functions.https.HttpsError('not-found', `Restaurant ${restaurant.restaurantId} not found`);
        }
        const data = restaurantDoc.data();
        if (!data?.stripeAccountId) {
          throw new functions.https.HttpsError('failed-precondition', `Restaurant ${restaurant.restaurantId} is not setup for payments`);
        }
        // Add stripeAccountId to the restaurant data for later use
        restaurant.stripeAccountId = data.stripeAccountId;
      }),
    );

    const paymentSessionRef = db.collection('paymentSessions').doc();
    const paymentSession: PaymentSession = {
      id: paymentSessionRef.id,
      restaurants,
      status: 'pending',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      userId,
      checkoutSessionId: '',
    };

    const isDelivery = restaurants.some((restaurant: any) => restaurant.isDelivery);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: [method],
      allow_promotion_codes: true,
      mode: 'payment',
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      payment_intent_data: {
        transfer_group: paymentSessionRef.id,
      },
      metadata: {
        paymentSessionId: paymentSessionRef.id,
        userId,
      },
      line_items: [
        ...restaurants.flatMap((restaurant: { items: any[] }) =>
          restaurant.items.map((item: { name: any; image: any; price: number; quantity: any }) => ({
            price_data: {
              currency: 'eur',
              product_data: {
                name: item.name,
                images: [item.image],
              },
              unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
          })),
        ),
        // Add delivery fees as a separate line item
        ...(isDelivery
          ? [{
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Frais de livraison',
                description: 'Frais de livraison pour la commande',
              },
              unit_amount: Math.round(
                restaurants.reduce((total: number, restaurant: any) => total + restaurant.deliveryFees, 0) * 100
              ),
            },
            quantity: 1,
          }]
          : []),
        // Add service fees as a separate line item
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Frais de service',
              description: 'Frais de service et de traitement',
            },
            unit_amount: Math.round(restaurants.reduce((total: number, restaurant: any) => total + restaurant.amount, 0) * fees * 100),
          },
          quantity: 1,
        },
      ],
    });

    // Update payment session with checkout session ID
    paymentSession.checkoutSessionId = session.id;
    await paymentSessionRef.set(paymentSession);

    return { sessionId: session.id };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new functions.https.HttpsError('internal', 'Unable to create checkout session');
  }
});

export const createStripeConnectAccount = functions.https.onCall(async (data, context) => {

  const { restaurantId } = data;
  if (!restaurantId) {
    throw new functions.https.HttpsError('invalid-argument', 'Restaurant ID is required');
  }

  try {
    // Get restaurant data from Firestore
    const restaurantDoc = await db.doc(`restaurants/${restaurantId}`).get();
    if (!restaurantDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Restaurant not found');
    }

    const restaurantData = restaurantDoc.data();

    // Create a Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR',
      email: restaurantData?.email,
      business_type: 'company',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Update restaurant document with Stripe account ID
    await db.doc(`restaurants/${restaurantId}`).update({
      stripeAccountId: account.id,
      stripeAccountStatus: 'pending',
    });

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${functions.config().app.url}/admin/settings/stripe-connect?refresh=true`,
      return_url: `${functions.config().app.url}/admin/settings/stripe-connect?success=true`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    throw new functions.https.HttpsError('internal', 'Error creating Stripe Connect account');
  }
});

export const createDriverStripeConnectAccount = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { driverId } = data;
  if (!driverId) {
    throw new functions.https.HttpsError('invalid-argument', 'Driver ID is required');
  }

  try {
    // Get driver data from Firestore
    const driverDoc = await db.doc(`users/${driverId}`).get();
    if (!driverDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Driver not found');
    }

    const driverData = driverDoc.data();

    // Create a Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR',
      email: driverData?.email,
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Update driver document with Stripe account ID
    await db.doc(`users/${driverId}`).update({
      stripeAccountId: account.id,
      stripeAccountStatus: 'pending',
    });

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${functions.config().app.url}/driver/profile/stripe-connect?refresh=true`,
      return_url: `${functions.config().app.url}/driver/profile/stripe-connect?success=true`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    throw new functions.https.HttpsError('internal', 'Error creating Stripe Connect account');
  }
});

export const handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = functions.config().stripe.webhook_secret;
  let event: Stripe.Event;

  if (!sig || !endpointSecret) {
    console.error('Missing stripe signature or endpoint secret');
    res.status(400).send('Missing stripe signature or endpoint secret');
    return;
  }

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (error) {
    console.error('Webhook error:', error);
    // Don't expose internal error details in production
    res.status(400).send('Webhook Error');
    return;
  }

  if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { paymentSessionId } = session.metadata!;

    // Ensure idempotency - check if payment was already processed
    const paymentSessionRef = db.collection('paymentSessions').doc(paymentSessionId);
    const paymentSessionSnap = await paymentSessionRef.get();
    const paymentSession = paymentSessionSnap.data() as PaymentSession;

    if (!paymentSessionSnap.exists) {
      throw new Error('Payment session not found');
    }

    if (paymentSession.status === 'completed') {
      console.log('Payment already processed, skipping');
      res.json({ received: true });
      return;
    }

    // Start a transaction to ensure atomic updates
    await db.runTransaction(async (transaction) => {
      // Update payment session status first
      transaction.update(paymentSessionRef, {
        status: 'completed',
        updatedAt: admin.firestore.Timestamp.now(),
      });

    });

    // After transaction succeeds, process Stripe transfers
    await Promise.all(
      paymentSession.restaurants.map(async (restaurant) => {
        try {
          await stripe.transfers.create({
            amount: Math.round(restaurant.amount * 100),
            currency: 'eur',
            destination: restaurant.stripeAccountId,
            transfer_group: paymentSessionId,
          });
        } catch (error) {
          console.error(`Failed to transfer to restaurant ${restaurant.restaurantId}:`, error);
          // Consider adding a retry mechanism or notification system here
        }
      }),
    );
  }

  res.json({ received: true });
});

export const retrieveCheckoutSession = functions.https.onCall(async (data, context) => {

  const { sessionId } = data;

  if (!sessionId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'L\'ID de la session est requis.'
    );
  }

  try {
    // Récupérer les détails de la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return {
      id: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de la session Stripe:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Une erreur est survenue lors de la récupération de la session Stripe.'
    );
  }
});

export const handleDriverPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { driverId, sessionId, restaurantId, orderId } = data;

  if (!driverId) {
    throw new functions.https.HttpsError('invalid-argument', 'Driver ID is required');
  }

  //Retrieve driver data from Firestore
  const driverRef = db.doc(`users/${driverId}`);
  const driverDoc = await driverRef.get();
  const driverData = driverDoc.data();
  if (!driverData?.stripeAccountId) {
    throw new functions.https.HttpsError('failed-precondition', 'Driver is not setup for payments');
  }

  if (!sessionId) {
    throw new functions.https.HttpsError('invalid-argument', 'Session ID is required');
  }

  // Retrieve order data from Firestore
  const orderRef = db.collection(`restaurants/${restaurantId}/orders`).doc(orderId);
  const orderDoc = await orderRef.get();
  const orderData = orderDoc.data();

  //Retrieve payment session data
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session) {
    throw new functions.https.HttpsError('not-found', 'Session not found');
  }
  //const { paymentSessionId } = session.metadata!;

  if (session.payment_status === 'paid') {
    try {
      await stripe.transfers.create({
        amount: Math.round(orderData!.deliveryFee * 100),
        currency: 'eur',
        destination: driverData.stripeAccountId,
        transfer_group: session.id,
      });

      return { success: true, message: 'Payment transferred to driver' };
    } catch (error: any) {
      console.error(`Failed to transfer to driver ${driverId}:`, error);
      throw new functions.https.HttpsError('internal', 'Stripe transfer failed');
    }
  } else {
    throw new functions.https.HttpsError('failed-precondition', 'Payment not completed');
  }
});