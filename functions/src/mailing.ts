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

  /* const formatItems = (items: any[]) => {
    return items.map(item => `
      <div style="margin-bottom:5px;">
        <div style="display:flex;justify-content:space-between;font-size:15px;">
          <div style="max-width:70%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex: 1;">
            ${item.quantity} x ${item.name}
          </div>
          <div style="flex: 1; text-align: right;"><strong>${item.price}€</strong></div>
        </div>
        ${item.remarks ? `<p style="font-size:13px;padding-left:10px;">${item.remarks}</p>` : ""}
        ${item.sections && item.sections.length > 0 ? `
          <div style="padding-left:10px;font-size:13px;">
            <strong>COMPOSITION DU MENU</strong><br />
            ${item.sections.map((ing: any) =>
      `<span style="padding-left:10px;font-size:12px;">${ing.name}: ${ing.choice}<br /></span>`
    ).join("")}
          </div>` : ""}
        ${item.excludedIngredients && item.excludedIngredients.length > 0 ? `
          <div style="padding-left:10px;font-size:13px;">
            <strong>INGRÉDIENTS EXCLUS</strong><br />
            ${item.excludedIngredients.map((ing: string, idx: number) =>
      `${ing}${idx < item.excludedIngredients.length - 1 ? ',' : ''} `
    ).join("")}
          </div>` : ""}
      </div>
    `).join("");
  }; */

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;border:1px solid #eee;padding:20px;border-radius:8px;">
    <h2 style="text-align:center;margin-bottom:10px;">Confirmation de commande</h2>
    <p style="text-align:center;margin-top:0;font-size:14px;color:#555;">Numéro de commande</p>
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:22px;font-weight:bold;color:#2ecc71;">#${order.orderNumber}</div>
    </div>

    <div style="border:1px solid #ddd;padding:15px;border-radius:6px;margin-bottom:20px;">
      <h3 style="margin-top:0;font-size:16px;">Détails de la commande</h3>
      ${order.items.map((item: any) => `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div style="flex:1;">
            <div style="font-weight:bold;font-size:15px;">${item.name}</div>
            <div style="font-size:14px;color:#555;">Quantité : ${item.quantity}</div>
          </div>
          <div style="font-weight:bold;font-size:15px;">${parseFloat(item.price).toFixed(2)} €</div>
        </div>
      `).join("")}
    </div>

    <div style="border-top:1px solid #eee;padding-top:10px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;font-size:15px;margin-bottom:5px;">
        <span>Sous-total</span>
        <span>${parseFloat(order.subtotal).toFixed(2)} €</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:15px;margin-bottom:5px;">
        <span>Frais de service</span>
        <span>${parseFloat(order.serviceFees || 0).toFixed(2)} €</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;">
        <span>Total</span>
        <span>${parseFloat(order.total).toFixed(2)} €</span>
      </div>
    </div>
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