import { ChevronLeft, Clock, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Cart from '../../components/Cart';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useCart } from '../../context/CartContext';
import { getFoodCourt } from '../../services/foodCourtService';
import { getRestaurant } from '../../services/restaurantService';
import type { FoodCourt } from '../../types/foodCourt';

export default function FoodCourtDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const foodCourtId = searchParams.get('foodCourtId');
  const [foodCourt, setFoodCourt] = useState<FoodCourt | null>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { items } = useCart();

  useEffect(() => {
    if (!foodCourtId) {
      navigate('/');
      return;
    }

    loadFoodCourt();
  }, [foodCourtId, navigate]);

  const loadFoodCourt = async () => {
    try {
      setLoading(true);
      setError(null);

      const foodCourtData = await getFoodCourt(foodCourtId!);
      setFoodCourt(foodCourtData);

      // Load restaurant details with better error handling
      const restaurantsData = await Promise.allSettled(
        foodCourtData.restaurants.map(async (r) => {
          try {
            const restaurantData = await getRestaurant(r.restaurantId);
            return {
              ...restaurantData,
              status: r.status,
              categoryId: r.categoryId,
              order: r.order
            };
          } catch (err) {
            console.warn(`Could not load restaurant ${r.restaurantId}:`, err);
            return null;
          }
        })
      );

      // Filter out failed restaurant loads and set only successful ones
      const validRestaurants = restaurantsData
        .filter((result): result is PromiseFulfilledResult<any> =>
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      setRestaurants(validRestaurants);

      // Show warning if some restaurants failed to load
      const failedCount = restaurantsData.length - validRestaurants.length;
      if (failedCount > 0) {
        console.warn(`${failedCount} restaurant(s) failed to load`);
      }
    } catch (err) {
      console.error('Error loading food court:', err);
      setError('Erreur lors du chargement du food court');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !foodCourt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Food court introuvable'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover image */}
      <div className="relative h-48">
        <img
          src={foodCourt.coverImage || "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&h=400"}
          alt={foodCourt.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-50 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>

      {/* Food Court info */}
      <div className="relative px-4 -mt-20">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <img
                  src={foodCourt.logo || "https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png"}
                  alt={foodCourt.name}
                  className="w-16 h-16 rounded-full border-4 border-white shadow-md"
                />
                <div>
                  <h1 className="text-xl font-bold">{foodCourt.name}</h1>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-emerald-500 font-medium">4.5</span>
                    <span className="text-yellow-400">★</span>
                    <span className="text-gray-500">(500+ avis)</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{foodCourt.location.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {foodCourt.openingHours.monday.closed ? 'Fermé' :
                      `${foodCourt.openingHours.monday.open} - ${foodCourt.openingHours.monday.close}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurants list */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold mb-4">Restaurants</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {restaurants.map((restaurant) => (
            <button
              key={restaurant.id}
              onClick={() => navigate(`/restaurant?restaurantId=${restaurant.id}&foodCourtId=${foodCourtId}`)}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center gap-4">
                <img
                  src={restaurant.logo || restaurant.coverImage}
                  alt={restaurant.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-medium text-gray-900">{restaurant.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {restaurant.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      {items.length > 0 && <Cart />}
    </div>
  );
}