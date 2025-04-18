/* eslint-disable @typescript-eslint/no-explicit-any */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
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
  /* if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  } */

  const { restaurants, successUrl, cancelUrl, fees, orderId } = data;
  //const userId = context.auth.uid;
  const userId = '123'; // For testing purposes

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

    // Get the order to determine the payment method
    let paymentMethod = 'card';
    if (orderId && restaurants[0].restaurantId) {
      try {
        const orderRef = db.doc(`restaurants/${restaurants[0].restaurantId}/orders/${orderId}`);
        const orderDoc = await orderRef.get();
        if (orderDoc.exists) {
          const orderData = orderDoc.data();
          paymentMethod = orderData?.paymentMethod || 'card';
        }
      } catch (err) {
        console.warn('Error getting order payment method:', err);
      }
    }

    const paymentSessionRef = db.collection('paymentSessions').doc();
    const paymentSession = {
      id: paymentSessionRef.id,
      restaurants,
      status: 'pending',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      userId,
      checkoutSessionId: '',
    };

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethod === 'apple_pay' ? ['card', 'apple_pay'] : ['card'],
      allow_promotion_codes: true,
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      payment_intent_data: {
        transfer_group: paymentSessionRef.id,
      },
      metadata: {
        paymentSessionId: paymentSessionRef.id,
        userId,
        orderId,
        restaurantId: restaurants[0].restaurantId
      },
      line_items: [
        ...restaurants.flatMap((restaurant) => restaurant.items.map((item) => ({
          price_data: {
            currency: 'eur',
            product_data: {
              name: item.name,
              images: [item.image],
            },
            unit_amount: Math.round(item.price * 100), // Convert to cents
          },
          quantity: item.quantity,
        }))),
        // Add service fees as a separate line item
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Frais de service',
              description: 'Frais de service et de traitement',
            },
            unit_amount: Math.round(restaurants.reduce((total, restaurant) => total + restaurant.amount, 0) * fees * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
    });

    // Update payment session with checkout session ID
    paymentSession.checkoutSessionId = session.id;
    await paymentSessionRef.set(paymentSession);

    // Also update the original order with the session ID for tracking
    const restaurantId = restaurants[0].restaurantId;
    
    if (orderId && restaurantId) {
      await db.doc(`restaurants/${restaurantId}/orders/${orderId}`).update({
        stripeSessionId: session.id,
        updatedAt: admin.firestore.Timestamp.now(),
        // Preserve the original payment method
        paymentMethod: paymentMethod
      });
    }

    return { sessionId: session.id };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new functions.https.HttpsError('internal', 'Unable to create checkout session');
  }
});


export const createStripeConnectAccount = functions.https.onCall(async (data, context) => {
  /* if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  } */

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

export const handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = functions.config().stripe.webhook_secret;

  if (!sig || !endpointSecret) {
    console.error('Missing stripe signature or endpoint secret');
    res.status(400).send('Missing stripe signature or endpoint secret');
    return;
  }

  try {
    const event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { paymentSessionId, orderId, restaurantId } = session.metadata;

      // Si nous avons directement l'orderId dans les métadonnées, mettons à jour cette commande
      if (orderId && restaurantId) {
        try {
          // Mettre directement à jour l'ordre dans la collection du restaurant
          const orderRef = db.collection('restaurants').doc(restaurantId).collection('orders').doc(orderId);
         
         // Vérifier d'abord si la commande existe
         const orderDoc = await orderRef.get();
         if (!orderDoc.exists) {
           console.error(`Order ${orderId} not found in restaurant ${restaurantId}`);
           res.status(404).send('Order not found');
           return;
         }

         // Vérifier si la commande a déjà été traitée
         const orderData = orderDoc.data();
         if (orderData?.paymentStatus === 'paid') {
           console.log(`Order ${orderId} already marked as paid, skipping update`);
           res.json({ received: true, status: 'already_processed' });
           return;
         }

          await orderRef.update({
            status: 'pending', // Assure que la commande est visible dans le dashboard
            paymentStatus: 'paid',
            paymentMethod: session.payment_method_types?.[0] || 'card', // Update with actual payment method used
            paymentConfirmed: true,
            paymentConfirmedAt: admin.firestore.FieldValue.serverTimestamp(),
           updatedAt: admin.firestore.Timestamp.now(),
           paymentProcessedAt: admin.firestore.Timestamp.now(),
           stripePaymentId: session.payment_intent || session.id
          });
          
         // Enregistrer l'événement de paiement dans un sous-collection pour l'audit
         await orderRef.collection('paymentEvents').add({
           type: 'payment_completed',
           provider: 'stripe',
           sessionId: session.id,
           paymentIntentId: session.payment_intent,
           amount: session.amount_total / 100, // Convertir les centimes en euros
           currency: session.currency,
           timestamp: admin.firestore.FieldValue.serverTimestamp(),
           metadata: session.metadata
         });

          console.log(`Order ${orderId} updated to paid status and activated in restaurant ${restaurantId} - Webhook processed successfully`);
          res.json({ received: true });
          return;
        } catch (error) {
          console.error('Error updating order directly:', error);
          // Continuer avec le flux normal si la mise à jour directe échoue
        }
      }

      // Ensure idempotency - check if payment was already processed
      const paymentSessionRef = db.collection('paymentSessions').doc(paymentSessionId);
      const paymentSessionSnap = await paymentSessionRef.get();
      const paymentSession = paymentSessionSnap.data();

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

        // Create orders for each restaurant
        const orderRefs = paymentSession.restaurants.map((restaurant) => {
          const orderRef = db.collection('orders').doc();
          const order = {
            id: orderRef.id,
            userId: paymentSession.userId,
            restaurantId: restaurant.restaurantId,
            items: restaurant.items,
            amount: restaurant.amount,
            status: 'pending', // Now the order becomes visible to restaurant admin
            paymentStatus: 'paid', // Mark as paid
            paymentSessionId,
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
          };
          transaction.set(orderRef, order);
          
          // Also update the original order document - activate it in the dashboard
          db.collection('restaurants')
            .doc(restaurant.restaurantId)
            .collection('orders')
            .where('stripeSessionId', '==', session.id)
            .get()
            .then(snapshot => {
              if (!snapshot.empty) {
                snapshot.docs.forEach(doc => {
                  db.collection('restaurants')
                    .doc(restaurant.restaurantId)
                    .collection('orders')
                    .doc(doc.id)
                    .update({
                      status: 'pending',  // Changed from 'awaiting_payment' to make it visible
                      paymentStatus: 'paid',
                      updatedAt: admin.firestore.Timestamp.now(),
                    });
                });
              }
            })
            .catch(err => {
              console.error('Error updating original order:', err);
            });
          
          return orderRef;
        });

        return orderRefs;
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
        })
      );
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Don't expose internal error details in production
    res.status(400).send('Webhook Error');
  }
});