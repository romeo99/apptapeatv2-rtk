import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronLeft, Search } from 'lucide-react';
import { useEffect } from 'react';
import { getNearbyRestaurants } from '../../services/restaurantService';
import RestaurantCard from '../../components/user/RestaurantCard';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function RestaurantListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listType = searchParams.get('type') || 'recommended';
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState({ lat: 43.2965, lng: 5.3698 }); // Default to Marseille
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const initializeLocation = async () => {
      try {
        setLocationError(null);
        setLoading(true);

        // Start loading restaurants with default location immediately
        await loadRestaurants(userLocation.lat, userLocation.lng);

        // Only try geolocation if supported
        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000
              });
            });

            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            await loadRestaurants(latitude, longitude);
          } catch (geoError) {
            console.warn('Geolocation error:', geoError);
            setLocationError('Affichage des restaurants à proximité de Marseille');
          }
        } else {
          setLocationError('Affichage des restaurants à proximité de Marseille');
        }
      } catch (error) {
        console.error('Location error:', error);
        setError('Erreur lors du chargement des restaurants');
      } finally {
        setLoading(false);
      }
    }

    initializeLocation();
  }, []);

  const loadRestaurants = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const data = await getNearbyRestaurants(lat, lng);
      setRestaurants(data);
    } catch (err) {
      console.error('Error loading restaurants:', err);
      setError('Erreur lors du chargement des restaurants');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    return listType === 'recommended' ? 'Recommandé pour vous' : 'À proximité';
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.type.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    // For "nearby" type, sort by distance
    if (listType === 'nearby') {
      return a.distance - b.distance;
    }
    // For recommended, keep original order
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold">{getTitle()}</h1>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un restaurant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Liste des restaurants */}
      <div className="px-4 mt-[140px] pb-4 space-y-4">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        {filteredRestaurants.map((restaurant) => (
          <div key={restaurant.id} className="mb-4">
            <RestaurantCard
              restaurant={restaurant}
              variant="full-width"
            />
          </div>
        ))}

        {filteredRestaurants.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun restaurant trouvé
          </div>
        )}
      </div>
    </div>
  );
}