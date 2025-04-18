import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadImage } from './uploadService';
import { generateQRCode } from './qrCodeService';
import type { FoodCourt, FoodCourtRestaurant } from '../types/foodCourt';
import { getCoordsFromAddress } from './locationService';

export async function createFoodCourt(
  data: Omit<FoodCourt, 'id' | 'createdAt' | 'updatedAt' | 'qrCode'>,
  logoFile?: File,
  coverFile?: File
): Promise<string> {
  try {
    if (!data.name?.trim()) {
      throw new Error('Le nom est requis');
    }

    if (!data.location?.address?.trim()) {
      throw new Error('L\'adresse est requise');
    }

    // Upload images if provided
    let logoUrl = data.logo;
    let coverUrl = data.coverImage;

    if (logoFile) {
      logoUrl = await uploadImage(logoFile, 'foodCourts/logos');
    }
    if (coverFile) {
      coverUrl = await uploadImage(coverFile, 'foodCourts/covers');
    }

    // Get coordinates from address
    const location = await getCoordsFromAddress(data.location.address);

    // Create food court document
    const foodCourtRef = collection(db, 'foodCourts');
    const docRef = await addDoc(foodCourtRef, {
      ...data,
      logo: logoUrl,
      coverImage: coverUrl,
      restaurants: [],
      categories: [],
      location: {
        ...data.location,
        lat: location.lat,
        lng: location.lng
      },
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating food court:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Une erreur est survenue lors de la création du food court');
  }
}

export async function updateFoodCourt(
  foodCourtId: string,
  updates: Partial<FoodCourt>,
  logoFile?: File,
  coverFile?: File
): Promise<void> {
  try {
    let logoUrl = updates.logo;
    let coverUrl = updates.coverImage;

    if (logoFile) {
      logoUrl = await uploadImage(logoFile, 'foodCourts/logos');
    }
    if (coverFile) {
      coverUrl = await uploadImage(coverFile, 'foodCourts/covers');
    }

    // Update location coordinates if address changed
    let locationUpdate = {};
    if (updates.location?.address) {
      const coords = await getCoordsFromAddress(updates.location.address);
      locationUpdate = {
        location: {
          ...updates.location,
          lat: coords.lat,
          lng: coords.lng
        }
      };
    }

    const foodCourtRef = doc(db, 'foodCourts', foodCourtId);
    await updateDoc(foodCourtRef, {
      ...updates,
      ...locationUpdate,
      ...(logoUrl && { logo: logoUrl }),
      ...(coverUrl && { coverImage: coverUrl }),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating food court:', error);
    throw error;
  }
}

export async function addRestaurantToFoodCourt(
  foodCourtId: string,
  restaurantId: string
): Promise<void> {
  try {
    const foodCourtRef = doc(db, 'foodCourts', foodCourtId);
    const restaurantsRef = collection(foodCourtRef, 'restaurants');

    // Add restaurant
    await addDoc(restaurantsRef, {
      restaurantId,
      status: 'active',
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding restaurant to food court:', error);
    throw error;
  }
}

export async function updateRestaurantOrder(
  foodCourtId: string,
  updates: Array<{ id: string; order: number }>
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    updates.forEach(({ id, order }) => {
      const restaurantRef = doc(db, 'foodCourts', foodCourtId, 'restaurants', id);
      batch.update(restaurantRef, { 
        order,
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error updating restaurant order:', error);
    throw error;
  }
}

export async function removeRestaurantFromFoodCourt(
  foodCourtId: string,
  restaurantId: string
): Promise<void> {
  try {
    const restaurantRef = doc(db, 'foodCourts', foodCourtId, 'restaurants', restaurantId);
    await deleteDoc(restaurantRef);
  } catch (error) {
    console.error('Error removing restaurant from food court:', error);
    throw error;
  }
}

export async function getFoodCourt(foodCourtId: string): Promise<FoodCourt> {
  try {
    const foodCourtRef = doc(db, 'foodCourts', foodCourtId);
    const foodCourtDoc = await getDoc(foodCourtRef);

    if (!foodCourtDoc.exists()) {
      throw new Error('Food court not found');
    }

    // Get restaurants
    const restaurantsRef = collection(foodCourtRef, 'restaurants');
    const restaurantsSnapshot = await getDocs(restaurantsRef);
    const restaurants = restaurantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FoodCourtRestaurant[];

    return {
      id: foodCourtDoc.id,
      ...foodCourtDoc.data(),
      restaurants,
      createdAt: foodCourtDoc.data().createdAt?.toDate(),
      updatedAt: foodCourtDoc.data().updatedAt?.toDate()
    } as FoodCourt;
  } catch (error) {
    console.error('Error getting food court:', error);
    throw error;
  }
}

export async function getAllFoodCourts(): Promise<FoodCourt[]> {
  try {
    const foodCourtsRef = collection(db, 'foodCourts');
    const snapshot = await getDocs(foodCourtsRef);
    
    return Promise.all(snapshot.docs.map(async doc => {
      const restaurants = await getDocs(collection(doc.ref, 'restaurants'));
      
      return {
        id: doc.id,
        ...doc.data(),
        restaurants: restaurants.docs.map(r => ({
          id: r.id,
          ...r.data()
        })),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as FoodCourt;
    }));
  } catch (error) {
    console.error('Error getting food courts:', error);
    throw error;
  }
}

export async function createFoodCourtOrder(
  foodCourtId: string,
  orderData: {
    restaurantOrders: Array<{
      restaurantId: string;
      items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
        image?: string;
        menuOptions?: any;
      }>;
    }>;
    type: 'dine_in' | 'takeaway' | 'delivery';
    paymentMethod: string;
    scheduledTime?: { date: string; time: string } | null;
    delivery?: {
      name: string;
      address: string;
      phone: string;
    };
  }
): Promise<string> {
  try {
    // Get food court info
    const foodCourtDoc = await getDoc(doc(db, 'foodCourts', foodCourtId));
    if (!foodCourtDoc.exists()) {
      throw new Error('Food court not found');
    }

    const foodCourt = foodCourtDoc.data();
    const serviceFee = foodCourt.serviceFee || 0;

    // Calculate totals for each restaurant
    const restaurantOrders = await Promise.all(orderData.restaurantOrders.map(async ({ restaurantId, items }) => {
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.2; // 20% TVA
      const total = subtotal + tax;

      return {
        restaurantId,
        items,
        subtotal,
        tax,
        total
      };
    }));

    // Calculate global totals
    const subtotal = restaurantOrders.reduce((sum, order) => sum + order.subtotal, 0);
    const tax = restaurantOrders.reduce((sum, order) => sum + order.tax, 0);
    const serviceFeeAmount = (subtotal * serviceFee) / 100;
    const total = subtotal + tax + serviceFeeAmount;

    // Create main order document
    const ordersRef = collection(db, 'foodCourts', foodCourtId, 'orders');
    const orderRef = await addDoc(ordersRef, {
      ...orderData,
      restaurantOrders,
      subtotal,
      tax,
      serviceFee: serviceFeeAmount,
      total,
      status: 'pending',
      paymentStatus: orderData.paymentMethod === 'cash' ? 'pending' : 'paid',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Create orders in each restaurant
    const batch = writeBatch(db);
    for (const restaurantOrder of restaurantOrders) {
      const restaurantOrderRef = doc(collection(db, 'restaurants', restaurantOrder.restaurantId, 'orders'));
      batch.set(restaurantOrderRef, {
        foodCourtOrderId: orderRef.id,
        foodCourtId,
        ...restaurantOrder,
        type: orderData.type,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentMethod === 'cash' ? 'pending' : 'paid',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    await batch.commit();

    return orderRef.id;
  } catch (error) {
    console.error('Error creating food court order:', error);
    throw error;
  }
}