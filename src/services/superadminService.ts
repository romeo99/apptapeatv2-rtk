import { signInWithEmailAndPassword, signOut as firebaseSignOut, sendPasswordResetEmail, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, getDocs, collection, query, where, deleteDoc, serverTimestamp, updateDoc, setDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export async function signInAsSuperAdmin(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Verify superadmin role
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists() || userDoc.data().role !== 'superadmin') {
      await firebaseSignOut(auth);
      throw new Error('Accès non autorisé');
    }

    return userCredential.user;
  } catch (error: any) {
    console.error('Error signing in as superadmin:', error);
    if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      throw new Error('Email ou mot de passe incorrect');
    }
    throw new Error('Une erreur est survenue lors de la connexion');
  }
}

export async function createSuperAdmin(data: { email: string; password: string; displayName: string }) {
  try {
    // Check if superadmin already exists
    const superadminQuery = await getDocs(query(collection(db, 'users'), where('role', '==', 'superadmin')));

    if (!superadminQuery.empty) {
      throw new Error('Un compte SuperAdmin existe déjà');
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);

    // Update profile
    await updateProfile(userCredential.user, {
      displayName: data.displayName,
    });

    // Create user document
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: data.email,
      displayName: data.displayName,
      role: 'superadmin',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Mark setup as complete
    await setDoc(doc(db, 'settings', 'superadmin'), {
      setupComplete: true,
      createdAt: serverTimestamp(),
    });

    return userCredential.user;
  } catch (error: any) {
    console.error('Error creating superadmin:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Cette adresse email est déjà utilisée');
    }
    throw error;
  }
}

export async function getAllRestaurants() {
  try {
    const restaurantsRef = collection(db, 'restaurants');
    const snapshot = await getDocs(restaurantsRef);

    const restaurants = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    return restaurants;
  } catch (error) {
    console.error('Error getting restaurants:', error);
    throw error;
  }
}

export async function getAllUsers() {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
}

export async function deleteRestaurant(restaurantId: string) {
  try {
    // Delete restaurant document
    await deleteDoc(doc(db, 'restaurants', restaurantId));

    // Delete all subcollections
    const subcollections = ['menu', 'orders', 'staff', 'reviews', 'settings'];
    for (const subcollection of subcollections) {
      const querySnapshot = await getDocs(collection(db, 'restaurants', restaurantId, subcollection));
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    throw error;
  }
}

export async function deleteUser(userId: string) {
  try {
    // Delete user document
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

export async function resetUserPassword(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('Utilisateur introuvable');
    }

    const userEmail = userDoc.data().email;
    if (!userEmail) {
      throw new Error("Email de l'utilisateur introuvable");
    }

    await sendPasswordResetEmail(auth, userEmail);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}

export async function updateRestaurantStatus(restaurantId: string, isOpen: boolean) {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    await updateDoc(restaurantRef, {
      isOpen,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating restaurant status:', error);
    throw error;
  }
}

export async function updateUserStatus(userId: string, status: 'active' | 'inactive') {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
}

export async function generateImpersonationToken(restaurantId: string): Promise<string> {
  try {
    // Get restaurant info to verify it exists
    const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
    if (!restaurantDoc.exists()) {
      throw new Error('Restaurant not found');
    }

    // Create impersonation token with expiration
    const token = {
      restaurantId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
      type: 'impersonation',
    };

    // Store token in Firestore
    const tokenRef = doc(collection(db, 'impersonationTokens'));
    await setDoc(tokenRef, {
      ...token,
      id: tokenRef.id,
      createdAt: serverTimestamp(),
    });

    return tokenRef.id;
  } catch (error) {
    console.error('Error generating impersonation token:', error);
    throw error;
  }
}

export async function validateImpersonationToken(tokenId: string): Promise<string | null> {
  try {
    const tokenDoc = await getDoc(doc(db, 'impersonationTokens', tokenId));
    if (!tokenDoc.exists()) {
      return null;
    }

    const token = tokenDoc.data();
    if (token.expiresAt < Date.now()) {
      return null;
    }

    return token.restaurantId;
  } catch (error) {
    console.error('Error validating impersonation token:', error);
    return null;
  }
}

export async function impersonateRestaurant(restaurantId: string, navigate: any) {
  try {
    // Get restaurant info
    const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
    if (!restaurantDoc.exists()) {
      throw new Error('Restaurant not found');
    }

    const restaurantData = restaurantDoc.data();

    // Store impersonation data
    localStorage.setItem(
      'impersonationData',
      JSON.stringify({
        restaurantId,
        restaurantName: restaurantData.name,
        email: restaurantData.email,
        expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
      }),
    );

    // Open admin dashboard in new tab
    window.open('/admin', '_blank');
  } catch (error) {
    console.error('Error impersonating restaurant:', error);
    throw error;
  }
}

interface ApplicationFeeSettings {
  value: number;
  updatedAt?: Date;
  updatedBy?: string;
}

export async function getApplicationFee(): Promise<number> {
  try {
    const settingsRef = doc(db, 'settings', 'applicationFee');
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      console.warn('Application fee settings not found, using default value of 1%');
      return 0.01; // Default to 1%
    }

    const feeSettings = settingsDoc.data() as ApplicationFeeSettings;
    
    // Validate fee value
    if (typeof feeSettings.value !== 'number' || feeSettings.value < 0 || feeSettings.value > 1) {
      console.error('Invalid application fee value:', feeSettings.value);
      return 0.01; // Default to 1% if invalid
    }

    return feeSettings.value;
  } catch (error) {
    console.error('Error getting application fee:', error);
    return 0.01; // Default to 1% on error
  }
}

export async function updateApplicationFee(newFee: number, userId: string): Promise<void> {
  if (typeof newFee !== 'number' || newFee < 0 || newFee > 1) {
    throw new Error('Invalid fee value. Must be between 0 and 1');
  }

  try {
    const settingsRef = doc(db, 'settings', 'applicationFee');
    await setDoc(settingsRef, {
      value: newFee,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
  } catch (error) {
    console.error('Error updating application fee:', error);
    throw error;
  }
}
