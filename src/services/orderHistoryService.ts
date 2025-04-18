import { 
  collection,
  query,
  getDocs,
  orderBy,
  getDoc,
  doc
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { Order } from '../types/firebase';

interface RestaurantInfo {
  id: string;
  name: string;
  logo: string;
}

async function getRestaurantInfo(restaurantId: string): Promise<RestaurantInfo> {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantDoc = await getDoc(restaurantRef);
    
    if (restaurantDoc.exists()) {
      const data = restaurantDoc.data();
      return {
        id: restaurantDoc.id,
        name: data?.name || 'Restaurant',
        logo: data?.logo || data?.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&h=200'
      };
    }
    
    return {
      id: restaurantId,
      name: 'Restaurant',
      logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&h=200'
    };
  } catch (err) {
    console.error('Error fetching restaurant info:', err);
    return {
      id: restaurantId,
      name: 'Restaurant',
      logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&h=200'
    };
  }
}

export async function getUserOrderHistory(): Promise<Order[]> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return [];
    }

    // Get user's orders from users/{userId}/orders subcollection
    const userOrdersRef = collection(db, 'users', user.uid, 'orders');
    const q = query(userOrdersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    // Get restaurant info for each order
    const orders = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const orderData = doc.data();
        const restaurantInfo = await getRestaurantInfo(orderData.restaurantId);

        return {
          id: doc.id,
          restaurantId: orderData.restaurantId, // Ensure restaurantId is included
          ...orderData,
          restaurantInfo,
          createdAt: orderData.createdAt?.toDate?.() || new Date(orderData.createdAt) || new Date(),
          updatedAt: orderData.updatedAt?.toDate?.() || new Date(orderData.updatedAt) || new Date()
        };
      })
    );

    return orders as Order[];
  } catch (error) {
    console.error('Error fetching order history:', error);
    return [];
  }
}