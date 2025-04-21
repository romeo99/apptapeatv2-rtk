import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

admin.initializeApp();

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: functions.config().smtp?.user || process.env.SMTP_USER,
    pass: functions.config().smtp?.pass || process.env.SMTP_PASS
  }
});

// Template d'email personnalisé
const getEmailTemplate = (code: string, firstName: string = '') => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .code { 
      background-color: #f3f4f6;
      padding: 20px;
      text-align: center;
      border-radius: 10px;
      font-size: 32px;
      letter-spacing: 5px;
      margin: 20px 0;
    }
    .footer { color: #6b7280; font-size: 14px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://tapeat.fr/logo.png" alt="TapEat" height="50">
    </div>
    
    <h1>Bienvenue sur TapEat${firstName ? `, ${firstName}` : ''} !</h1>
    <p>Voici votre code de vérification :</p>
    
    <div class="code">${code}</div>
    
    <p>Ce code expirera dans 10 minutes.</p>
    
    <div class="footer">
      <p>Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.</p>
      <p>© ${new Date().getFullYear()} TapEat. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
`;

export const sendVerificationCode = functions.https.onCall(async (data, context) => {
  const { email, firstName } = data;
  
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    await admin.firestore().collection('verificationCodes').doc(email).set({
      code,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 10 * 60 * 1000)
    });

    await transporter.sendMail({
      from: '"TapEat" <noreply@tapeat.fr>',
      to: email,
      subject: 'Votre code de vérification TapEat',
      html: getEmailTemplate(code, firstName)
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw new functions.https.HttpsError('internal', 'Error sending verification code');
  }
});

// Handle order status changes
export const handleOrderStatusChange = functions.firestore
  .document('restaurants/{restaurantId}/orders/{orderId}')
  .onUpdate(async (change, context) => {
    try {
      const newValue = change.after.data();
      const previousValue = change.before.data();

      // Check if status has changed from 'awaiting_payment' to 'pending'
      if (previousValue.status === 'awaiting_payment' && newValue.status === 'pending' && 
          newValue.paymentStatus === 'paid' && newValue.stripeSessionId) {
        
        console.log(`Order ${context.params.orderId} payment confirmed, updating status`);
        
        // The payment was confirmed through the Stripe webhook
        // We need to handle any additional logic here
      }

      return true;
    } catch (error) {
      console.error('Error in order status change handler:', error);
      return false;
    }
  });

// Webhook listener for Stripe payment completion
export const stripeWebhookListener = functions.https.onRequest(async (req, res) => {
  try {
    // Verify Stripe signature
    const stripe = require('stripe')(functions.config().stripe.secret_key);
    
    // Get the signature sent by Stripe
    const signature = req.headers['stripe-signature'];
    const endpointSecret = functions.config().stripe.webhook_secret;
    
    // Validate the request
    if (!signature || !endpointSecret) {
      console.error('Missing Stripe signature or endpoint secret');
      return res.status(400).send('Missing stripe signature or endpoint secret');
    }
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, signature, endpointSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle successful checkout completion
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Get order and restaurant IDs from metadata
      const { orderId, restaurantId } = session.metadata || {};
      
      // Ensure we have the necessary data
      if (!orderId || !restaurantId) {
        console.error('Missing orderId or restaurantId in session metadata');
        return res.status(400).send('Incomplete metadata');
      }
      
      // Update the order status
      try {
        const orderRef = admin.firestore().collection('restaurants').doc(restaurantId).collection('orders').doc(orderId);
        await orderRef.update({
          status: 'pending',          // Change from 'awaiting_payment' to 'pending' to make it visible
          paymentStatus: 'paid',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Order ${orderId} updated to paid and visible status`);
      } catch (err) {
        console.error(`Error updating order ${orderId}:`, err);
        return res.status(500).send('Error updating order');
      }
    }
    
    // Return success
    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing error:', error);
    res.status(500).send('Webhook processing error');
  }
});

// Export Stripe functions
export * from './stripe';

// Apple Pay domain verification endpoint
export const applePayDomainAssociation = functions.https.onRequest(async (req, res) => {
  try {
    // Path to the domain association file
    const filePath = path.join(__dirname, '../public/.well-known/apple-developer-merchantid-domain-association');
    
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Set the content type and send the file
    res.set('Content-Type', 'text/plain');
    res.status(200).send(fileContent);
  } catch (error) {
    console.error('Error serving Apple Pay domain association file:', error);
    res.status(500).send('Error serving domain association file');
  }
});