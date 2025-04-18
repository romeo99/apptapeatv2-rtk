import { 
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';

// ... existing code ...

export async function updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('Utilisateur non authentifié');
    }

    // Re-authenticate user before password change
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);

    // Update last password change timestamp in Firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      lastPasswordChange: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error('Error updating password:', error);
    
    if (error.code === 'auth/wrong-password') {
      throw new Error('Le mot de passe actuel est incorrect');
    }
    
    if (error.code === 'auth/weak-password') {
      throw new Error('Le nouveau mot de passe est trop faible');
    }
    
    throw new Error('Une erreur est survenue lors de la mise à jour du mot de passe');
  }
}

export async function getUserNotificationSettings() {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilisateur non authentifié');

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return {
        orderUpdates: true,
        promotions: true,
        newsletter: false
      };
    }

    const data = userDoc.data();
    return {
      orderUpdates: data.notificationSettings?.orderUpdates ?? true,
      promotions: data.notificationSettings?.promotions ?? true,
      newsletter: data.notificationSettings?.newsletter ?? false
    };
  } catch (error) {
    console.error('Error getting notification settings:', error);
    throw error;
  }
}

export async function updateNotificationSettings(settings: {
  orderUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
}) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilisateur non authentifié');

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      notificationSettings: settings,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
}