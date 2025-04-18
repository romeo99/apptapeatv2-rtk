import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  writeBatch,
  query,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadImage } from './uploadService';
import type { InventoryItem } from '../types/firebase';

export async function createInventoryItem(
  restaurantId: string,
  itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  imageFile?: File
): Promise<string> {
  try {
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }

    let imageUrl;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}/inventory`);
    }

    const inventoryRef = collection(db, 'restaurants', restaurantId, 'inventory');
    
    const inventoryData = {
      ...itemData,
      image: imageUrl,
      quantity: Number(itemData.quantity) || 0,
      optimalStock: Number(itemData.optimalStock) || 0,
      price: Number(itemData.price) || 0,
      linkedItems: itemData.linkedItems || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    };

    const docRef = await addDoc(inventoryRef, inventoryData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating inventory item:', error);
    throw error;
  }
}

export async function updateInventoryItem(
  itemId: string,
  restaurantId: string,
  updates: Partial<InventoryItem>,
  imageFile?: File
): Promise<void> {
  try {
    let imageUrl = updates.image;

    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }

    if (imageFile) {
      imageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}/inventory`);
    }

    const itemRef = doc(db, 'restaurants', restaurantId, 'inventory', itemId);
    await updateDoc(itemRef, {
      ...updates,
      ...(imageUrl && { image: imageUrl }),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
}

export async function deleteInventoryItem(restaurantId: string, itemId: string): Promise<void> {
  try {
    if (!restaurantId || !itemId) {
      throw new Error('Invalid item ID format');
    }
    await deleteDoc(doc(db, 'restaurants', restaurantId, 'inventory', itemId));
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
}

export async function adjustStock(
  restaurantId: string,
  itemId: string,
  adjustment: number
): Promise<void> {
  try {
    if (!restaurantId || !itemId) {
      throw new Error('Invalid item ID format');
    }
    const itemRef = doc(db, 'restaurants', restaurantId, 'inventory', itemId);
    await updateDoc(itemRef, {
      quantity: adjustment,
      lastUpdated: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    throw error;
  }
}

export async function deductInventoryFromOrder(restaurantId: string, orderItems: any[]): Promise<void> {
  try {
    if (!restaurantId || !orderItems?.length) return;

    const inventoryRef = collection(db, 'restaurants', restaurantId, 'inventory');
    const snapshot = await getDocs(inventoryRef);
    
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    const inventoryItems = new Map(snapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }]));
    const deductions = new Map<string, number>();

    // Calculate deductions for each inventory item
    for (const [docId, inventoryItem] of inventoryItems.entries()) {
      const linkedItems = inventoryItem.linkedItems || [];
      
      for (const linkedItem of linkedItems) {
        const orderItem = orderItems.find(item => item.id === linkedItem.menuItemId);
        if (!orderItem) continue;

        const deduction = Number(orderItem.quantity) * Number(linkedItem.quantityPerItem);
        const currentDeduction = deductions.get(docId) || 0;
        deductions.set(docId, currentDeduction + deduction);
      }
    }

    // Apply deductions in batch
    for (const [docId, deduction] of deductions.entries()) {
      if (deduction <= 0) continue;

      const docRef = doc(inventoryRef, docId);
      const inventoryItem = inventoryItems.get(docId);
      if (!inventoryItem) continue;

      const currentQuantity = Number(inventoryItem.quantity) || 0;
      const newQuantity = Math.max(0, currentQuantity - deduction);

      if (currentQuantity !== newQuantity) {
        batch.update(docRef, {
          quantity: newQuantity,
          lastUpdated: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    if (deductions.size > 0) {
      await batch.commit();
    }

  } catch (error) {
    console.error('Error deducting inventory:', error);
    throw error;
  }
}