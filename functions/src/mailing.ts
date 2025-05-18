import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';

// Configuration de l'email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: 'amelesusu@gmail.com',
    pass: 'msai kfwk pvph oilp',
  },
});

export const sendOrderConfirmation = functions.https.onCall(async (data, context) => {
  /* if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
  } */

  const { to, subject, order } = data;

  if (!to || !subject || !order) {
    throw new functions.https.HttpsError('invalid-argument', 'Champs requis manquants');
  }

  const deliveryRow = order.type === 'delivery'
    ? `
    <tr>
      <td style="text-align:left;">Frais de livraison</td>
      <td style="text-align:right;">${parseFloat(order.deliveryFees || 0).toFixed(2)} €</td>
    </tr>
  `
    : '';

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;border:1px solid #eee;padding:20px;border-radius:8px;">
    <h2 style="text-align:center;margin-bottom:10px;">Confirmation de commande</h2>
    <p style="text-align:center;margin-top:0;font-size:14px;color:#555;">Numéro de commande</p>
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:22px;font-weight:bold;color:#2ecc71;">#${order.orderNumber}</div>
    </div>

    <div style="border:1px solid #ddd;padding:15px;border-radius:6px;margin-bottom:20px;">
      <h3 style="margin-top:0;font-size:16px;">Détails de la commande</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${order.items.map((item: any) => `
          <tr>
            <td style="padding:8px 0;">
              <div style="font-weight:bold;font-size:15px;">${item.name}</div>
              <div style="font-size:14px;color:#555;">Quantité : ${item.quantity}</div>
            </td>
            <td style="text-align:right;font-weight:bold;font-size:15px;padding:8px 0;">
              ${parseFloat(item.price).toFixed(2)} €
            </td>
          </tr>
        `).join("")}
      </table>
    </div>

    <table style="width:100%;font-size:15px;margin-bottom:5px;">
    <tr>
      <td style="text-align:left;">Sous-total</td>
      <td style="text-align:right;">${parseFloat(order.subtotal).toFixed(2)} €</td>
    </tr>
    ${deliveryRow}
    <tr>
      <td style="text-align:left;">Frais de service</td>
      <td style="text-align:right;">${parseFloat(order.serviceFees || 0).toFixed(2)} €</td>
    </tr>
    <tr style="font-weight:bold;font-size:16px;">
      <td style="text-align:left;">Total</td>
      <td style="text-align:right;">${parseFloat(order.total).toFixed(2)} €</td>
    </tr>
  </table>
  </div>
`;

  const mailOptions = {
    from: 'amelesusu@gmail.com',
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Erreur d’envoi email:', error);
    throw new functions.https.HttpsError('internal', 'Erreur lors de l’envoi de l’e-mail');
  }
});