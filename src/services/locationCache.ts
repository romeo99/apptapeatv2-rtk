import type { Location } from './locationService';

const CACHE_KEY_PREFIX = 'location_cache_';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export async function getLocationFromCache(key: string): Promise<Location | null> {
  try {
    const cacheKey = CACHE_KEY_PREFIX + key;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { location, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - timestamp > CACHE_DURATION) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return location;
  } catch (error) {
    console.error('Error reading from location cache:', error);
    return null;
  }
}

export async function saveLocationToCache(key: string, location: Location): Promise<void> {
  try {
    const cacheKey = CACHE_KEY_PREFIX + key;
    const data = {
      location,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to location cache:', error);
  }
}