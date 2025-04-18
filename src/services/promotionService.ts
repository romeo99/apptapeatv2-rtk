import { 
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Promotion } from '../types/firebase';

export async function createPromotion(restaurantId: string, data: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const promotionsRef = collection(db, 'restaurants', restaurantId, 'promotions');
    const docRef = await addDoc(promotionsRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating promotion:', error);
    throw error;
  }
}

export async function updatePromotion(restaurantId: string, promotionId: string, data: Partial<Promotion>) {
  try {
    const promotionRef = doc(db, 'restaurants', restaurantId, 'promotions', promotionId);
    await updateDoc(promotionRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating promotion:', error);
    throw error;
  }
}

export async function deletePromotion(restaurantId: string, promotionId: string) {
  try {
    await deleteDoc(doc(db, 'restaurants', restaurantId, 'promotions', promotionId));
  } catch (error) {
    console.error('Error deleting promotion:', error);
    throw error;
  }
}

export async function getActivePromotions(restaurantId: string) {
  try {
    if (!restaurantId) return [];

    const promotionsRef = collection(db, 'restaurants', restaurantId, 'promotions');
    const q = query(
      promotionsRef,
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);

    const promotions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Promotion[];

    return promotions;
  } catch (error) {
    console.error('Error getting active promotions:', error);
    throw error;
  }
}

export async function getAllPromotions(restaurantId: string) {
  try {
    const promotionsRef = collection(db, 'restaurants', restaurantId, 'promotions');
    const snapshot = await getDocs(promotionsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate(),
      endDate: doc.data().endDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Promotion[];
  } catch (error) {
    console.error('Error getting all promotions:', error);
    throw error;
  }
}