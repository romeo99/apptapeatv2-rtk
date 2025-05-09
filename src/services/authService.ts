import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getCoordsFromAddress } from './locationService';
import { generateImpersonationToken } from './superadminService';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface RegisterRestaurantData {
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
}

export async function registerRestaurant(data: RegisterRestaurantData) {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Format d\'email invalide');
    }

    // Validate password length
    if (data.password.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères');
    }

    // Validate required fields
    const requiredFields = {
      name: 'Le nom du restaurant est requis',
      email: 'L\'email est requis',
      password: 'Le mot de passe est requis',
      address: 'L\'adresse est requise',
      phone: 'Le téléphone est requis'
    };

    for (const [field, message] of Object.entries(requiredFields)) {
      if (!data[field]?.trim()) {
        throw new Error(message);
      }
    }

    // Check if email already exists
    const emailCheck = await getDocs(
      query(collection(db, 'restaurants'), where('email', '==', data.email))
    );
    if (!emailCheck.empty) {
      throw new Error('Cette adresse email est déjà utilisée');
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;

    try {
      // Update user profile
      await updateProfile(user, {
        displayName: data.name
      });

      // Get coordinates for the address
      let location;
      try {
        location = await getCoordsFromAddress(data.address);
      } catch (err) {
        console.warn('Could not get coordinates:', err);
        location = { lat: 0, lng: 0 };
      }

      // Initialize batch
      const batch = writeBatch(db);

      // Initialize subcollections
      const collections = ['menu', 'categories', 'orders', 'staff', 'settings'];

      collections.forEach(collectionName => {
        const configRef = doc(collection(db, 'restaurants', user.uid, collectionName), '_config');
        batch.set(configRef, {
          initialized: true,
          createdAt: serverTimestamp()
        });
      });

      // Create user document
      const userRef = doc(db, 'users', user.uid);
      batch.set(userRef, {
        uid: user.uid,
        email: data.email,
        displayName: data.name,
        role: 'owner',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create restaurant document in Firestore
      const restaurantRef = doc(db, 'restaurants', user.uid);

      batch.set(restaurantRef, {
        id: user.uid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        location,
        ownerId: user.uid,
        isOpen: true,
        paymentMethods: ['card', 'cash'],
        serviceOptions: ['dine_in', 'takeaway'],
        status: 'pending_verification',
        stats: {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          pendingOrders: 0,
          dailyRevenue: {},
          dailyOrders: {},
          paymentMethodBreakdown: {
            card: 0,
            cash: 0,
            apple_pay: 0
          },
          topProducts: []
        },
        searchTerms: generateSearchTerms(data.name),
        orderCounters: {
          card: 0,
          cash: 0,
          apple_pay: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Commit all changes in batch
      await batch.commit();

      // Set default logo URL without uploading to S3
      await updateDoc(restaurantRef, {
        logoUrl: 'https://i.ibb.co/MsGnLJM/applogotapeat.png'
      });

      return user;
    } catch (error) {
      // If something fails after user creation, delete the user
      await user.delete();
      throw error;
    }
  } catch (error: any) {
    console.error('Error registering restaurant:', error);

    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Cette adresse email est déjà utilisée');
    }

    if (error.code === 'auth/invalid-email') {
      throw new Error('Format d\'email invalide');
    }

    if (error.code === 'auth/weak-password') {
      throw new Error('Le mot de passe est trop faible');
    }

    if (error.code === 'auth/network-request-failed') {
      throw new Error('Erreur de connexion. Veuillez vérifier votre connexion internet.');
    }

    throw new Error('Une erreur est survenue lors de l\'inscription');
  }
}

// Helper function to generate search terms
function generateSearchTerms(name: string): string[] {
  const terms = [];
  const text = name.toLowerCase();

  // Add full text
  terms.push(text);

  // Add each word
  text.split(/\s+/).forEach(word => {
    if (word.length > 1) {
      terms.push(word);
    }
  });

  // Add partial matches (minimum 2 characters)
  for (let i = 0; i < text.length - 1; i++) {
    terms.push(text.slice(0, i + 2));
  }

  return [...new Set(terms)];
}

export async function registerUser(data: RegisterData, isDriver: boolean = false) {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, {
      displayName: `${data.firstName} ${data.lastName}`
    });

    // Create user document in Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      ...isDriver && {
        role: 'driver',
        status: 'active'
      },
      displayName: `${data.firstName} ${data.lastName}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });

    return user;
  } catch (error: any) {
    console.error('Error registering user:', error);

    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Cette adresse email est déjà utilisée');
    }

    throw new Error('Une erreur est survenue lors de l\'inscription');
  }
}

export async function signIn(email: string, password: string) {
  try {
    if (!email?.trim() || !password?.trim()) {
      throw new Error('Email et mot de passe requis');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);


    const user = userCredential.user;

    // Store auth data in localStorage
    // Update last login timestamp
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        lastLoginDevice: navigator.userAgent
      });
    } catch (err) {
      console.warn('Could not update user last login:', err);
    }

    // First check if user is a restaurant owner
    const restaurantDoc = await getDoc(doc(db, 'restaurants', user.uid));
    if (restaurantDoc.exists()) {
      // Store role and restaurant ID in localStorage
      localStorage.setItem('userRole', 'owner');
      localStorage.setItem('restaurantId', user.uid);
      localStorage.setItem('authUser', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'owner',
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
      }));

      // Update restaurant last login
      try {
        await updateDoc(doc(db, 'restaurants', user.uid), {
          lastLoginAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Could not update restaurant last login:', err);
      }
      return { user, role: 'owner' };
    }

    // Then check if user is staff
    const staffQuery = query(
      collectionGroup(db, 'staff'),
      where('uid', '==', user.uid)
    );
    const staffSnapshot = await getDocs(staffQuery);
    if (!staffSnapshot.empty) { // Staff user
      // Store role and restaurant ID in localStorage
      localStorage.setItem('userRole', 'staff');
      const staffDoc = staffSnapshot.docs[0];
      const restaurantId = staffDoc.ref.parent.parent?.id;
      if (restaurantId) {
        localStorage.setItem('restaurantId', restaurantId);
        localStorage.setItem('authUser', JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: 'staff',
          restaurantId: restaurantId,
          expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 jours
        }));
        // Update staff last login
        await updateDoc(staffDoc.ref, {
          lastLoginAt: serverTimestamp()
        });
      }
      return {
        user,
        role: 'staff',
        restaurantId
      };
    }

    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    // Regular user
    return { user, role: userData?.role || 'user' };

  } catch (error: any) {
    console.error('Error signing in:', error);
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Erreur de connexion. Veuillez vérifier votre connexion internet.');
    }
    if (error.code === 'auth/wrong-password' ||
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/invalid-credential') {
      throw new Error('Email ou mot de passe incorrect');
    }
    throw new Error('Une erreur est survenue lors de la connexion');
  }
}

export async function signOut({ isAdmin = false, isDriver = false }: { isAdmin?: boolean; isDriver?: boolean }) {
  try {
    await firebaseSignOut(auth);
    // Clear auth data from localStorage
    localStorage.removeItem('authUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('restaurantId');

    if (isAdmin) {
      window.location.replace('/admin/login');
    } else if (isDriver) {
      window.location.replace('/driver/login');
    } else {
      window.location.reload();
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw new Error('Une erreur est survenue lors de la déconnexion');
  }
}

export async function sendPasswordResetCode(email: string): Promise<void> {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Adresse email invalide');
    }

    // Configure action code settings
    const actionCodeSettings = {
      url: `${window.location.origin}/reset-password`,
      handleCodeInApp: false // Set to false to use default email template
    };

    await sendPasswordResetEmail(auth, email, actionCodeSettings);
  } catch (error: any) {
    console.error('Error sending reset code:', error);

    if (error.code === 'auth/user-not-found') {
      throw new Error('Aucun compte associé à cette adresse email');
    }

    if (error.code === 'auth/invalid-email') {
      throw new Error('Adresse email invalide');
    }

    if (error.code === 'auth/too-many-requests') {
      throw new Error('Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.');
    }

    if (error.code === 'auth/unauthorized-continue-uri') {
      throw new Error('Configuration invalide. Veuillez contacter le support.');
    }

    throw new Error('Une erreur est survenue. Veuillez réessayer plus tard.');
  }
}

export async function impersonateRestaurant(restaurantId: string) {
  try {
    // Generate impersonation token
    const token = await generateImpersonationToken(restaurantId);

    // Store token in localStorage
    localStorage.setItem('impersonationToken', token);

    // Redirect to admin dashboard with token
    window.location.href = `/admin?token=${token}`;
  } catch (error) {
    console.error('Error impersonating restaurant:', error);
    throw error;
  }
}

export async function signInWithImpersonationToken(token: string) {
  try {
    // Decode token
    const decodedData = atob(token).split(':');
    if (decodedData.length !== 3) throw new Error('Invalid token format');

    const [type, restaurantId, timestamp] = decodedData;

    if (type !== 'impersonate') {
      throw new Error('Invalid token type');
    }

    // Check if token is expired (2 hours)
    const tokenTime = parseInt(timestamp, 10);
    if (Date.now() - tokenTime > 2 * 60 * 60 * 1000) {
      throw new Error('Token expired');
    }

    // Get restaurant data
    const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
    if (!restaurantDoc.exists()) {
      throw new Error('Restaurant not found');
    }

    const restaurantData = restaurantDoc.data();

    // Store impersonation data
    localStorage.setItem('impersonationData', JSON.stringify({
      restaurantId,
      expiresAt: tokenTime + (2 * 60 * 60 * 1000),
      restaurantName: restaurantData.name,
      email: restaurantData.email,
      role: 'owner'
    }));

    return {
      success: true,
      restaurantId,
      restaurantName: restaurantData.name,
      email: restaurantData.email
    };
  } catch (error) {
    console.error('Error signing in with impersonation token:', error);
    throw error;
  }
}

export function checkImpersonation() {
  try {
    const impersonationData = localStorage.getItem('impersonationData');
    if (!impersonationData) return null;

    const data = JSON.parse(impersonationData);

    // Check if expired
    if (Date.now() > data.expiresAt) {
      localStorage.removeItem('impersonationData');
      return null;
    }

    // Add auth data to simulate authenticated user
    if (!auth.currentUser) {
      auth.updateCurrentUser({
        uid: data.restaurantId,
        email: data.email,
        displayName: data.restaurantName,
        isAnonymous: false,
        emailVerified: true
      });
    }
    return data;
  } catch (error) {
    console.error('Error checking impersonation:', error);
    return null;
  }
}