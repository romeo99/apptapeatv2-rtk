import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

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
