import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { availableIngredients } from '../data/ingredients';

interface Ingredient {
  id: string;
  name: string;
  icon: string;
}

export async function createIngredient(restaurantId: string, ingredient: Ingredient) {
  try {
    const ingredientRef = doc(db, 'restaurants', restaurantId, 'ingredients', ingredient.id);
    await setDoc(ingredientRef, {
      ...ingredient,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating ingredient:', error);
    throw error;
  }
}

export async function getIngredients(restaurantId: string) {
  try {
    const ingredientsRef = collection(db, 'restaurants', restaurantId, 'ingredients');
    const q = query(ingredientsRef, orderBy('name'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting ingredients:', error);
    throw error;
  }
}

export async function deleteIngredient(restaurantId: string, ingredientId: string) {
  try {
    await deleteDoc(doc(db, 'restaurants', restaurantId, 'ingredients', ingredientId));
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    throw error;
  }
}

export function searchIngredients(query: string) {
  // Convertir la requête en minuscules pour une recherche insensible à la casse
  const searchQuery = query.toLowerCase();
  
  // Filtrer les ingrédients qui correspondent à la recherche
  return availableIngredients.filter(ingredient => 
    ingredient.name.toLowerCase().includes(searchQuery)
  );
}