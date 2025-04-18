import { useLoadScript } from '@react-google-maps/api';
import { AlertCircle, ChevronRight, List, Map as MapIcon, MapPin, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import PullToRefresh from 'react-pull-to-refresh';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../../components/layout/BottomNavigation';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, getDocs, query, collectionGroup, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import FoodCourtCard from '../../components/user/FoodCourtCard';
import LocationSelector from '../../components/user/LocationSelector';
import RestaurantCard from '../../components/user/RestaurantCard';
import RestaurantMap from '../../components/user/RestaurantMap';
import { getAllFoodCourts } from '../../services/foodCourtService';
import type { Location } from '../../services/locationService';
import { getCurrentLocation } from '../../services/locationService';
import { getNearbyRestaurants } from '../../services/restaurantService';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBi3DoK4uEJmMfyjnSCLoQ_hxIv-h-Cbf4';

const SECTIONS = [
  { id: 'recommended', title: 'Recommandé pour vous' },
  { id: 'nearby', title: 'À proximité' }
];
const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [foodCourts, setFoodCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [currentAddress, setCurrentAddress] = useState('à moins de 2 km');
  const { user } = useAuth();
  const [locationError, setLocationError] = useState<string | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries
  });

  useEffect(() => {
    const checkRestaurantAccess = async () => {
      if (!user?.uid) return;

      try {
        // Check if user is restaurant owner
        const restaurantDoc = await getDoc(doc(db, 'restaurants', user.uid));
        if (restaurantDoc.exists()) {
          navigate('/admin/live-orders');
          return;
        }

        // Check if user is staff
        const staffQuery = query(
          collectionGroup(db, 'staff'),
          where('uid', '==', user.uid)
        );
        const staffDocs = await getDocs(staffQuery);
        if (!staffDocs.empty) {
          navigate('/admin/live-orders');
          return;
        }
      } catch (err) {
        console.error('Error checking restaurant access:', err);
      }
    };

    checkRestaurantAccess();
  }, [user, navigate]);

  const handleLocationChange = async (location: { lat: number; lng: number; address: string }) => {
    setUserLocation({ lat: location.lat, lng: location.lng, address: location.address });
    setCurrentAddress(location.address);
    await loadRestaurants(location.lat, location.lng);
  };

  useEffect(() => {
    const initializeLocation = async () => {
      try {
        // Wait for Google Maps to load before initializing
        if (!isLoaded) {
          setLoading(true);
          return;
        }

        setLocationError(null);
        setLoading(true);

        const location = await getCurrentLocation();
        setUserLocation(location);
        setCurrentAddress(location.address);
        await loadRestaurants(location.lat, location.lng);
      } catch (err) {
        console.error('Location error:', err);
        if (err instanceof Error) {
          if (err.message.includes('denied')) {
            setLocationError('Veuillez autoriser l\'accès à votre position pour voir les restaurants à proximité.');
          } else {
            setLocationError('Impossible d\'obtenir votre position exacte. Affichage des restaurants à proximité de Marseille.');
          }
        }
        // Charger les restaurants avec la position par défaut
        const defaultLocation = { lat: 43.2965, lng: 5.3698 };
        await loadRestaurants(defaultLocation.lat, defaultLocation.lng);
      } finally {
        setLoading(false);
      }
    };

    initializeLocation();

    const MIN_DISTANCE = 100; // Minimum distance in meters to trigger update
    const DEBOUNCE_DELAY = 5000; // 5 seconds
    let debounceTimer: number;

    function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lng2 - lng1) * Math.PI / 180;

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c;
    }

    // Écouter les changements de position
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;

        // Skip if location hasn't changed significantly
        if (lastLocationRef.current) {
          const distance = calculateDistance(
            lastLocationRef.current.lat,
            lastLocationRef.current.lng,
            lat,
            lng
          );
          if (distance < MIN_DISTANCE) return;
        }

        // Update last known location
        lastLocationRef.current = { lat, lng };

        // Debounce updates
        clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(async () => {
          const geocoder = new google.maps.Geocoder();
          const response = await geocoder.geocode({ location: { lat, lng } });

          if (response.results[0]) {
            const location = {
              lat,
              lng,
              address: response.results[0].formatted_address
            };
            setUserLocation(location);
            setCurrentAddress(location.address);
            await loadRestaurants(lat, lng);
          }
        }, DEBOUNCE_DELAY);
      },
      (error) => {
        console.warn('Watch position error:', error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      clearTimeout(debounceTimer);
    };
  }, [isLoaded]); // Re-run when Google Maps loads

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      if (userLocation) {
        await loadRestaurants(userLocation.lat, userLocation.lng);
      }
      return Promise.resolve();
    } catch (err) {
      console.error('Error refreshing data:', err);
      return Promise.reject(err);
    } finally {
      setRefreshing(false);
    }
  };

  const loadRestaurants = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const data = await getNearbyRestaurants(lat, lng);
      const foodCourtsData = await getAllFoodCourts();
      setRestaurants(data);
      setFoodCourts(foodCourtsData);
    } catch (err) {
      console.error('Error loading restaurants:', err);
      setError('Erreur lors du chargement des restaurants');
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden pb-safe-with-nav">
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="px-4 pt-4 pb-2">
          {locationError && (
            <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{locationError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-500" />
              <LocationSelector
                currentLocation={currentAddress}
                onLocationChange={handleLocationChange}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un restaurant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl text-gray-600 focus:outline-none"
                />
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              className="p-3 bg-gray-50 rounded-2xl"
            >
              {viewMode === 'list' ? <MapIcon className="h-5 w-5" /> : <List className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className={`pt-36 ${viewMode === 'list' ? 'pb-24 overflow-y-auto' : 'flex-1'}`}>
        {viewMode === 'list' && (
          <PullToRefresh
            onRefresh={handleRefresh}
            pullDownThreshold={80}
            resistance={2.5}
            pullingContent={
              <div className="text-center py-4 text-gray-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-500 mb-2"></div>
                <p>Tirez pour actualiser</p>
              </div>
            }
            refreshingContent={
              <div className="text-center py-4 text-gray-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-500 mb-2"></div>
                <p>Actualisation...</p>
              </div>
            }
          >
            <>
              <div className="px-4 space-y-10">
                {SECTIONS.map((section) => {
                  const sectionRestaurants = section.id === 'nearby'
                    ? [...filteredRestaurants].sort((a, b) => a.distance - b.distance)
                    : filteredRestaurants;

                  return (
                    <section key={section.id} className="space-y-4">
                      <div className="flex items-center justify-between mb-4 pr-4">
                        <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                        <button
                          onClick={() => navigate(`/restaurants?type=${section.id}`)}
                          className="text-emerald-500 text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                        >
                          Voir plus
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex overflow-x-auto hide-scrollbar gap-4 -mx-4 px-4 pb-2">
                        {sectionRestaurants.map((restaurant) => (
                          <div key={restaurant.id} className="flex-none w-[260px]">
                            <RestaurantCard
                              restaurant={restaurant}
                              variant="default"
                            />
                          </div>
                        ))}
                        {sectionRestaurants.length === 0 && (
                          <div className="w-full text-center py-8 text-gray-500">
                            Aucun restaurant disponible pour le moment
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
              {foodCourts.length > 0 && (
                <div className="px-4 space-y-10">
                  <section className="space-y-4">
                    <div className="flex items-center justify-between mb-4 pr-4">
                      <h2 className="text-lg font-bold text-gray-900">FoodCourt</h2>
                    </div>
                    <div className="flex overflow-x-auto hide-scrollbar gap-4 -mx-4 px-4 pb-2">
                      {foodCourts.map((foodCourt) => (
                        <div key={foodCourt.id} className="flex-none">
                          <FoodCourtCard
                            foodCourt={foodCourt}
                            variant="default"
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </>
          </PullToRefresh>
        )}
        {viewMode === 'map' && (
          <div className="absolute inset-0 top-32 bottom-24">
            <RestaurantMap
              restaurants={filteredRestaurants}
              userLocation={userLocation}
              onRestaurantClick={(restaurant) => navigate(`/restaurant?restaurantId=${restaurant.id}`)}
            />
          </div>
        )}
      </div>

      <div className="fixed left-0 right-0 bottom-0 z-50">
        <BottomNavigation />
      </div>
    </div>
  );
}