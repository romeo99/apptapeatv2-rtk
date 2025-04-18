import { 
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';

export async function addToFavorites(restaurantId: string) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be authenticated');

    const favoriteRef = doc(db, 'users', user.uid, 'favorites', restaurantId);
    await setDoc(favoriteRef, {
      restaurantId,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
}

export async function removeFromFavorites(restaurantId: string) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be authenticated');

    const favoriteRef = doc(db, 'users', user.uid, 'favorites', restaurantId);
    await deleteDoc(favoriteRef);
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
}

export async function getFavorites() {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const favoritesRef = collection(db, 'users', user.uid, 'favorites');
    const snapshot = await getDocs(favoritesRef);
    
    return snapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
}