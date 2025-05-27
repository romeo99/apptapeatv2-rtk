import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Loyalty } from '../types/firebase';

export async function createLoyalty(restaurantId: string, data: Omit<Loyalty, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const loyaltiesRef = collection(db, 'restaurants', restaurantId, 'loyalties');
    const docRef = await addDoc(loyaltiesRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating loyalty:', error);
    throw error;
  }
}

export async function updateLoyalty(restaurantId: string, loyaltyId: string, data: Partial<Loyalty>) {
  try {
    const loyaltyRef = doc(db, 'restaurants', restaurantId, 'loyalties', loyaltyId);
    await updateDoc(loyaltyRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating loyalty:', error);
    throw error;
  }
}

export async function deleteLoyalty(restaurantId: string, loyaltyId: string) {
  try {
    await deleteDoc(doc(db, 'restaurants', restaurantId, 'loyalties', loyaltyId));
  } catch (error) {
    console.error('Error deleting loyalty:', error);
    throw error;
  }
}

export async function getActiveLoyalties(restaurantId: string) {
  try {
    if (!restaurantId) return [];

    const loyaltiesRef = collection(db, 'restaurants', restaurantId, 'loyalties');
    const q = query(
      loyaltiesRef,
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);

    const loyalties = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        value: data.value,
        point: data.point,
        status: data.status,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
      } as Loyalty;
    });

    return loyalties[0];
  } catch (error) {
    console.error('Error getting active loyalties:', error);
    throw error;
  }
}

export async function getAllLoyalties(restaurantId: string) {
  try {
    const loyaltiesRef = collection(db, 'restaurants', restaurantId, 'loyalties');
    const snapshot = await getDocs(loyaltiesRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      description: doc.data().description,
      value: doc.data().value,
      point: doc.data().point,
      status: doc.data().status,
      createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date(),
      updatedAt: doc.data().updatedAt ? doc.data().updatedAt.toDate() : new Date()
    })) as Loyalty[];
  } catch (error) {
    console.error('Error getting all loyalties:', error);
    throw error;
  }
}