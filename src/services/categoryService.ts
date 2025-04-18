import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadImage } from './uploadService';
import type { Category } from '../types/firebase';

// Create category in restaurant subcollection
export async function createCategory(
  restaurantId: string,
  categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>,
  imageFile?: File
): Promise<string> {
  try {
    if (!restaurantId) throw new Error('Restaurant ID is required');

    let imageUrl = categoryData.image;

    if (imageFile) {
      imageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}/categories`);
    }

    const categoriesRef = collection(db, 'restaurants', restaurantId, 'categories');
    const q = query(categoriesRef, orderBy('order', 'desc'));
    const snapshot = await getDocs(q);
    const maxOrder = snapshot.docs.reduce((max, doc) => {
      const order = doc.data().order || 0;
      return order > max ? order : max;
    }, -1);

    const docRef = await addDoc(categoriesRef, {
      ...categoryData,
      image: imageUrl,
      restaurantId,
      order: maxOrder + 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

// Get categories from restaurant subcollection
export async function getCategories(restaurantId: string): Promise<Category[]> {
  try {
    const q = query(
      collection(db, 'restaurants', restaurantId, 'categories'),
      orderBy('order')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Update category in restaurant subcollection
export async function updateCategory(restaurantId: string, categoryId: string, updates: Partial<Category>, imageFile?: File): Promise<void> {
  try {
    if (!restaurantId) throw new Error('Restaurant ID is required');
    if (!categoryId) throw new Error('Category ID is required');

    let imageUrl = updates.image;

    if (imageFile) {
      imageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}/categories`);
    }

    const categoryRef = doc(db, 'restaurants', restaurantId, 'categories', categoryId);
    await updateDoc(categoryRef, {
      ...updates,
      ...(imageUrl && { image: imageUrl }),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating category:', error);
    throw error instanceof Error ? error : new Error('Failed to update category');
  }
}

export async function deleteCategory(categoryId: string, restaurantId: string): Promise<void> {
  try {
    if (!restaurantId) throw new Error('Restaurant ID is required');
    const categoryRef = doc(db, 'restaurants', restaurantId, 'categories', categoryId);
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

export async function updateCategoriesOrder(
  restaurantId: string,
  updates: Array<{ id: string; order: number }>
): Promise<void> {
  try {
    if (!restaurantId) throw new Error('Restaurant ID is required');
    const batch = writeBatch(db);

    updates.forEach(({ id, order }) => {
      const categoryRef = doc(db, 'restaurants', restaurantId, 'categories', id);
      batch.update(categoryRef, { 
        order,
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error updating categories order:', error);
    throw error;
  }
}

export async function updateMenuItemsOrder(
  restaurantId: string,
  categoryId: string,
  updates: Array<{ id: string; order: number }>
): Promise<void> {
  try {
    if (!restaurantId) throw new Error('Restaurant ID is required');
    const batch = writeBatch(db);

    updates.forEach(({ id, order }) => {
      const itemRef = doc(db, 'restaurants', restaurantId, 'menuItems', id);
      batch.update(itemRef, { 
        order,
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error updating menu items order:', error);
    throw error;
  }
}