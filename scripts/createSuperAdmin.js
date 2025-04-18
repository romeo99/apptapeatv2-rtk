const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createSuperAdmin() {
  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: 'superadmin@tapeat.fr',
      password: 'SuperAdmin123!',
      displayName: 'Super Admin'
    });

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: 'superadmin@tapeat.fr',
      displayName: 'Super Admin',
      role: 'superadmin',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('SuperAdmin created successfully:', userRecord.uid);
    process.exit(0);
  } catch (error) {
    console.error('Error creating superadmin:', error);
    process.exit(1);
  }
}

createSuperAdmin();