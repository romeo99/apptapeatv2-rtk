import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function initializeFirebaseData() {
  try {
    // Vérifier si le restaurant par défaut existe (uniquement pour le développement)
    const restaurantRef = doc(db, 'restaurants', 'default-restaurant');
    const restaurantDoc = await getDoc(restaurantRef);

    // Si le restaurant par défaut n'existe pas et que nous sommes en développement
    if (!restaurantDoc.exists() && import.meta.env.DEV) {
      console.log('Mode développement : pas de données initiales');
    }
  } catch (error) {
    console.error('Error checking Firebase data:', error);
    throw error;
  }
}