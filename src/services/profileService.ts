import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';

interface ProfileUpdateData {
  displayName?: string;
  photoURL?: string;
}

export async function updateUserProfile(data: ProfileUpdateData): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilisateur non authentifié');

    // Update Firebase Auth profile
    await updateProfile(user, data);

    // Update Firestore user document
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error instanceof Error ? error : new Error('Erreur lors de la mise à jour du profil');
  }
}

export async function uploadUserPhoto(file: File): Promise<string> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilisateur non authentifié');

    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('L\'image ne doit pas dépasser 5MB');
    }

    // Create a reference to the storage location
    const fileExt = file.name.split('.').pop();
    const fileName = `users/${user.uid}/profile_photo_${Date.now()}.${fileExt}`;
    const storageRef = ref(storage, fileName);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const photoURL = await getDownloadURL(snapshot.ref);

    // Update user profile with new photo URL
    await updateProfile(user, { photoURL });

    // Update Firestore document
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      photoURL,
      updatedAt: serverTimestamp()
    });

    return photoURL;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error instanceof Error ? error : new Error('Erreur lors du téléchargement de la photo');
  }
}