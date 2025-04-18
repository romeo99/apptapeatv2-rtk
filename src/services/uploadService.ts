import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export async function uploadImage(file: File, path: string): Promise<string> {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image');
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('L\'image ne doit pas dépasser 5MB');
    }

    // Create a unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'png';
    const fileName = `${timestamp}.${extension}`;
    const fullPath = `${path}/${fileName}`;

    // Create storage reference
    const storageRef = ref(storage, fullPath);

    // Upload file with metadata
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: { uploadedAt: new Date().toISOString() }
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Échec de l\'upload de l\'image: ' + error);
  }
}