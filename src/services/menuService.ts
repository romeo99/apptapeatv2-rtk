import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadImage } from './uploadService';
import type { MenuItem, ComboSection } from '../types/firebase';

export async function createMenuItem(
  restaurantId: string, 
  itemData: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>,
  imageFile?: File
): Promise<string> {
  try {
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }

    let imageUrl = itemData.image;

    if (imageFile) {
      imageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}/menuItems`);
    }

    const menuRef = collection(db, 'restaurants', restaurantId, 'menuItems');
    const docRef = await addDoc(menuRef, {
      ...itemData,
      restaurantId,
      order: 0,
      image: imageUrl,
      status: 'available',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating menu item:', error);
    throw error;
  }
}

export async function updateMenuItem(
  itemId: string,
  restaurantId: string,
  updates: Partial<MenuItem>,
  imageFile?: File
): Promise<void> {
  try {
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }

    let imageUrl = updates.image;

    if (imageFile) {
      imageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}/menuItems`);
    }

    const cleanedUpdates = { ...updates };

    // Clean and validate sections data if present
    if (updates.sections) {
      cleanedUpdates.sections = updates.sections.map(section => ({
        id: section.id,
        name: section.name,
        required: Boolean(section.required),
        maxChoices: Number(section.maxChoices) || 1,
        icon: section.icon || null,
        image: section.image || null,
        items: section.items.map(item => ({
          id: item.id,
          name: item.name,
          price: Number(item.price) || 0,
          image: item.image || null,
          included: Boolean(item.included)
        }))
      }));
    }

    const itemRef = doc(db, 'restaurants', restaurantId, 'menuItems', itemId);
    await updateDoc(itemRef, {
      ...cleanedUpdates,
      ingredients: Array.isArray(updates.ingredients) ? updates.ingredients.filter(Boolean) : [],
      ...(imageUrl && { image: imageUrl }),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error;
  }
}

export async function deleteMenuItem(itemId: string, restaurantId: string): Promise<void> {
  try {
    if (!restaurantId?.trim()) {
      throw new Error('Restaurant ID is required');
    }
    if (!itemId?.trim()) {
      throw new Error('Menu item ID is required');
    }
    
    const menuItemRef = doc(db, 'restaurants', restaurantId, 'menuItems', itemId);
    await deleteDoc(menuItemRef);
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw new Error('Failed to delete menu item. Please try again.');
  }
}

export async function createCombo(
  restaurantId: string,
  comboData: {
    name: string;
    description: string;
    price: number;
    mainProductId: string;
    mainProduct: any;
    sections: ComboSection[];
    categoryId: string;
    status?: 'available' | 'out_of_stock' | 'hidden';
    image?: string;
  },
  imageFile?: File
): Promise<string> {
  try {
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }

    let imageUrl = comboData.image;

    if (imageFile) {
      imageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}/menuItems`);
    }

    // Si aucune image n'est fournie, utiliser l'image du produit principal
    if (!imageUrl && comboData.mainProduct) {
      imageUrl = comboData.mainProduct.image;
    }

    const menuRef = collection(db, 'restaurants', restaurantId, 'menuItems');
    
    const comboToCreate = {
      name: comboData.name,
      description: comboData.description,
      price: comboData.price,
      mainProductId: comboData.mainProductId,
      sections: comboData.sections.map(section => ({
        id: section.id,
        name: section.name,
        required: section.required,
        icon: section.icon || null,
        items: section.items.map(item => ({
          id: item.id,
          name: item.name,
          price: Number(item.price) || 0,
          image: item.image || null,
          included: Boolean(item.included)
        }))
      })),
      categoryId: comboData.categoryId,
      image: imageUrl,
      isCombo: true,
      status: comboData.status || 'available',
      restaurantId,
      order: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(menuRef, comboToCreate);
    return docRef.id;
  } catch (error) {
    console.error('Error creating combo:', error);
    throw error;
  }
}

export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
  try {
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }

    const menuRef = collection(db, 'restaurants', restaurantId, 'menuItems');
    const q = query(menuRef, orderBy('order', 'asc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as MenuItem[];
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
}