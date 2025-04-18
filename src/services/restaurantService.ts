import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { Restaurant } from '../types/firebase';
import { isRestaurantOpen } from '../utils/restaurantHours';
const DEFAULT_LOCATION = {
  lat: 43.2965,  // Marseille coordinates
  lng: 5.3698
};

export async function getNearbyRestaurants(lat: number, lng: number, radius: number = 5000) {
  try {
    const restaurantsRef = collection(db, 'restaurants');
    const q = query(restaurantsRef);

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log('No restaurants found in database');
      return [];
    }

    const restaurants = await Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data();
      if (!data) return null;

      // Vérifier si le restaurant est ouvert
      const isOpen = data.isOpen !== false && isRestaurantOpen(data as Restaurant);

      const location = data.location || DEFAULT_LOCATION;
      const distance = calculateDistance(lat, lng, location.lat, location.lng);
      const duration = await calculateTravelTime(
        { lat, lng },
        { lat: location.lat, lng: location.lng }
      );

      return {
        id: doc.id,
        name: data.name || 'Restaurant',
        type: data.type || 'Restaurant',
        isOpen,
        logo: data.logo || data.coverImage || 'https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png',
        location: {
          lat: location.lat,
          lng: location.lng
        },
        address: data.address || 'Adresse non disponible',
        image: data.coverImage || data.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&h=600',
        rating: data.rating || 4.5,
        duration,
        distance
      };
    }));

    // Filter out null values (restaurants without location) and sort by distance
    const validRestaurants = restaurants.filter((r): r is NonNullable<typeof r> => r !== null);

    console.log(validRestaurants);

    console.log(`Found ${validRestaurants.length} restaurants with valid coordinates out of ${restaurants.length} total`);

    return validRestaurants.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Error fetching nearby restaurants:', error);
    throw error;
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

async function calculateTravelTime(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<string> {
  try {
    if (!window.google?.maps) {
      console.warn('Google Maps not loaded, using default duration');
      return '15-20 min';
    }
    const service = new google.maps.DistanceMatrixService();
    const response = await service.getDistanceMatrix({
      origins: [new google.maps.LatLng(origin.lat, origin.lng)],
      destinations: [new google.maps.LatLng(destination.lat, destination.lng)],
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC
    });

    if (response.rows[0]?.elements[0]?.duration?.text) {
      return response.rows[0].elements[0].duration.text;
    }

    console.warn('No duration found in response, using default');
    return '15-20 min';
  } catch (error) {
    console.error('Error calculating travel time:', error);
    console.warn('Using default travel time');
    return '15-20 min';
  }
}

export async function getRestaurant(restaurantId: string) {
  try {
    if (!restaurantId?.trim()) {
      console.warn('Empty restaurant ID provided');
      return {
        id: restaurantId,
        name: 'Restaurant non disponible',
        logo: 'https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png'
      };
    }

    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantDoc = await getDoc(restaurantRef);

    if (!restaurantDoc.exists()) {
      console.warn(`Restaurant ${restaurantId} not found`);
      return {
        id: restaurantId,
        name: 'Restaurant non disponible',
        logo: 'https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png'
      };
    }

    const data = restaurantDoc.data();
    return {
      id: restaurantDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Restaurant;
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return {
      id: restaurantId,
      name: 'Restaurant non disponible',
      logo: 'https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png'
    };
  }
}

export async function updateRestaurant(restaurantId: string, data: Partial<Restaurant>) {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    let locationData: Record<string, any> = {};

    // If address is being updated, get new coordinates
    if (data.address) {
      try {
        // Get coordinates for the address
        const location = await getCoordsFromAddress(data.address);
        const formattedAddress = standardizeAddress(data.address);

        locationData = {
          location,
          formattedAddress,
          address: formattedAddress,
          searchTerms: generateSearchTerms(data.name || '', data.type || '')
        };
      } catch (err) {
        console.error('Error getting coordinates:', err);
        throw new Error('Impossible de trouver cette adresse. Veuillez vérifier et réessayer.');
      }
    }

    // Validate required fields
    if (data.paymentMethods?.length === 0) {
      throw new Error('Veuillez sélectionner au moins un moyen de paiement');
    }

    if (data.serviceOptions?.length === 0) {
      throw new Error('Veuillez sélectionner au moins une option de service');
    }

    // Clean up data by removing undefined values
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
        // Validate URLs if present
        if (key === 'instagramUrl' || key === 'googleUrl') {
          try {
            if (value) {
              new URL(value); // Will throw if invalid URL
            }
          } catch (err) {
            throw new Error(`URL ${key} invalide`);
          }
        }
      }
      return acc;
    }, {} as Record<string, any>);

    await updateDoc(restaurantRef, {
      ...cleanData,
      ...locationData,
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error updating restaurant:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Une erreur est survenue lors de la mise à jour du restaurant');
  }
}

export async function uploadRestaurantImage(restaurantId: string, file: File, imageType: 'logo' | 'cover') {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${restaurantId}/${imageType}_${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, `restaurants/${fileName}`);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    const restaurantRef = doc(db, 'restaurants', restaurantId);
    await updateDoc(restaurantRef, {
      [`${imageType}Image`]: downloadURL,
      updatedAt: serverTimestamp()
    });

    return downloadURL;
  } catch (error) {
    console.error('Error uploading restaurant image:', error);
    throw new Error('Failed to upload restaurant image');
  }
}

export async function createRestaurant(restaurantId: string, data: Partial<Restaurant>) {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);

    // Ensure default images if none provided
    const defaultData = {
      logo: 'https://via.placeholder.com/200x200?text=Logo',
      coverImage: 'https://via.placeholder.com/800x400?text=Cover',
      ...data
    };

    const batch = writeBatch(db);

    // Create main restaurant document
    batch.set(restaurantRef, {
      ...defaultData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Create subcollections
    const collections = [
      'inventory',
      'categories',
      'menuItems',
      'orders',
      'qrCodes',
      'promotions',
      'staff',
      'settings'
    ];

    // Initialize each collection with a placeholder document
    collections.forEach(collectionName => {
      const placeholderRef = doc(collection(db, 'restaurants', restaurantId, collectionName), '_config');
      batch.set(placeholderRef, {
        initialized: true,
        createdAt: serverTimestamp()
      });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error creating restaurant:', error);
    throw new Error('Failed to create restaurant');
  }
}

export async function getRestaurantsByOwner(ownerId: string) {
  try {
    const restaurantsRef = collection(db, 'restaurants');
    const q = query(restaurantsRef, where('ownerId', '==', ownerId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Restaurant[];
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    throw new Error('Failed to fetch restaurants');
  }
}

export async function getAddressFromCoords(lat: number, lng: number): Promise<string> {
  try {
    const geocoder = new google.maps.Geocoder();
    const response = await geocoder.geocode({
      location: { lat, lng }
    });

    if (response.results[0]) {
      return response.results[0].formatted_address;
    }

    throw new Error('No address found');
  } catch (error) {
    console.error('Error getting address:', error);
    return 'Adresse inconnue';
  }
}

export async function getCoordsFromAddress(address: string): Promise<{ lat: number; lng: number }> {
  try {
    if (!address?.trim()) {
      console.warn('Empty address provided');
      return DEFAULT_LOCATION;
    }

    // Standardize address format
    const formattedAddress = standardizeAddress(address);

    const geocoder = new google.maps.Geocoder();
    const response = await geocoder.geocode({
      address: formattedAddress,
      region: 'FR', // Restrict to France
      componentRestrictions: { country: 'FR' }
    });

    if (response.results[0]?.geometry?.location) {
      const location = response.results[0].geometry.location;
      const coords = {
        lat: location.lat(),
        lng: location.lng()
      };

      // Validate coordinates
      if (isNaN(coords.lat) || isNaN(coords.lng) ||
        coords.lat === 0 || coords.lng === 0) {
        console.warn('Invalid coordinates returned from geocoding');
        return DEFAULT_LOCATION;
      }

      return coords;
    }

    console.warn(`No location found for address: ${formattedAddress}`);
    return DEFAULT_LOCATION;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    console.warn('Using default location (Marseille)');
    // Return default coordinates for Marseille city center
    return {
      lat: 43.2965,
      lng: 5.3698
    };
  }
}

// Helper function to standardize address format
function standardizeAddress(address: string): string {
  let formattedAddress = address.trim();

  // Remove any extra spaces
  formattedAddress = formattedAddress.replace(/\s+/g, ' ');

  // Check if address already matches the standard format
  if (/^[\w\s]+,\s*\d{5}\s*[\w\s]+,\s*France$/i.test(formattedAddress)) {
    return formattedAddress;
  }

  // Extract components from address
  const match = formattedAddress.match(/^(.*?)(?:,\s*)?(\d{5})(?:,\s*)?([\w\s]+)?(?:,\s*France)?$/i);
  if (match) {
    const [_, street, postalCode, city = 'Marseille'] = match;
    return `${street}, ${postalCode} ${city}, France`;
  }

  // If no match, just append France if needed
  if (!formattedAddress.toLowerCase().includes('france')) {
    formattedAddress += ', France';
  }

  return formattedAddress;
}
// Helper function to generate search terms
function generateSearchTerms(name: string, type: string): string[] {
  const terms = [];
  const text = `${name} ${type}`.toLowerCase();

  // Add full text
  terms.push(text);

  // Add each word
  text.split(/\s+/).forEach(word => {
    if (word.length > 1) {
      terms.push(word);
    }
  });

  // Add partial matches (minimum 2 characters)
  for (let i = 0; i < text.length - 1; i++) {
    terms.push(text.slice(0, i + 2));
  }

  return [...new Set(terms)];
}

export async function getAllRestaurants() {
  try {
    const restaurantsRef = collection(db, 'restaurants');
    const snapshot = await getDocs(restaurantsRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting all restaurants:', error);
    throw error;
  }
}