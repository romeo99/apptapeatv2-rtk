import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Search, Store } from 'lucide-react';
import { getFoodCourt } from '../services/foodCourtService';
import { getRestaurant } from '../services/restaurantService';
import { useCart } from '../context/CartContext';
import Cart from '../components/Cart';
import LoadingSpinner from '../components/LoadingSpinner';

export default function FoodCourtMenu() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const foodCourtId = searchParams.get('foodCourtId');
  const [foodCourt, setFoodCourt] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
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
      const foodCourtData = await getFoodCourt(foodCourtId!);
      setFoodCourt(foodCourtData);

      // Load restaurant details
      const restaurantPromises = foodCourtData.restaurants.map(async (r: any) => {
        const restaurantData = await getRestaurant(r.restaurantId);
        return restaurantData;
      });

      const restaurantsData = await Promise.all(restaurantPromises);
      setRestaurants(restaurantsData);

      // Select first restaurant by default
      if (restaurantsData.length > 0) {
        setSelectedRestaurant(restaurantsData[0]);
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
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">{foodCourt.name}</h1>
              <p className="text-sm text-gray-500">{foodCourt.location.address}</p>
            </div>
          </div>

          {/* Restaurant selector */}
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {restaurants.map((restaurant) => (
              <button
                key={restaurant.id}
                onClick={() => setSelectedRestaurant(restaurant)}
                className={`flex-shrink-0 flex flex-col items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  selectedRestaurant?.id === restaurant.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <img
                    src={restaurant.logo || restaurant.coverImage}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm font-medium whitespace-nowrap">
                  {restaurant.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu content */}
      <div className="pt-36 pb-24 px-4">
        {selectedRestaurant ? (
          <div className="space-y-6">
            {/* Restaurant info */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <img
                  src={selectedRestaurant.logo || selectedRestaurant.coverImage}
                  alt={selectedRestaurant.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h2 className="font-semibold text-lg">{selectedRestaurant.name}</h2>
                  <p className="text-sm text-gray-500">{selectedRestaurant.description}</p>
                </div>
              </div>
            </div>

            {/* Menu categories and items */}
            {/* Add your existing menu components here */}
          </div>
        ) : (
          <div className="text-center py-12">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Sélectionnez un restaurant pour voir son menu</p>
          </div>
        )}
      </div>

      {/* Cart */}
      {items.length > 0 && <Cart />}
    </div>
  );
}