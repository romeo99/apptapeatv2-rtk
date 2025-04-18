import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { SavedComboSection } from '../types/firebase';

export async function saveSectionTemplate(
  restaurantId: string, 
  section: Omit<SavedComboSection, 'id' | 'createdAt'>
): Promise<string> {
  try {
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }

    const sectionsRef = collection(db, 'restaurants', restaurantId, 'savedComboSections');
    
    // Check if a section with this label already exists
    const existingQuery = query(sectionsRef, where('label', '==', section.label));
    const existingDocs = await getDocs(existingQuery);
    
    if (!existingDocs.empty) {
      // Update existing section
      const existingDoc = existingDocs.docs[0];
      await updateDoc(doc(sectionsRef, existingDoc.id), {
        ...section,
        updatedAt: serverTimestamp()
      });
      return existingDoc.id;
    } else {
      // Create new section
      const docRef = await addDoc(sectionsRef, {
        ...section,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving section template:', error);
    throw error;
  }
}

export async function getSavedSections(restaurantId: string): Promise<SavedComboSection[]> {
  try {
    if (!restaurantId) {
      return [];
    }

    const sectionsRef = collection(db, 'restaurants', restaurantId, 'savedComboSections');
    const q = query(sectionsRef, orderBy('label'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as SavedComboSection[];
  } catch (error) {
    console.error('Error getting saved sections:', error);
    return [];
  }
}

export async function deleteSavedSection(restaurantId: string, sectionId: string): Promise<void> {
  try {
    if (!restaurantId || !sectionId) {
      throw new Error('Restaurant ID and section ID are required');
    }

    const sectionRef = doc(db, 'restaurants', restaurantId, 'savedComboSections', sectionId);
    await deleteDoc(sectionRef);
  } catch (error) {
    console.error('Error deleting saved section:', error);
    throw error;
  }
}