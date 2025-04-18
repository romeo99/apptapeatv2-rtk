import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Search, Plus } from 'lucide-react';
import { getAllRestaurants } from '../../services/restaurantService';
import { addRestaurantToFoodCourt } from '../../services/foodCourtService';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function FoodCourtRestaurantAdd() {
  const navigate = useNavigate();
  const { id: foodCourtId } = useParams();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); 

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const data = await getAllRestaurants();
      setRestaurants(data);
    } catch (err) {
      console.error('Error loading restaurants:', err);
      setError('Erreur lors du chargement des restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = async (restaurantId: string) => {
    try {
      if (!foodCourtId) return;

      await addRestaurantToFoodCourt(foodCourtId, restaurantId);
      navigate(`/superadmin/food-courts/${foodCourtId}`);
    } catch (err) {
      console.error('Error adding restaurant:', err);
      setError('Erreur lors de l\'ajout du restaurant');
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/superadmin/food-courts/${foodCourtId}`)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Ajouter un restaurant</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Rechercher un restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div className="relative h-48">
                <img
                  src={restaurant.coverImage || restaurant.logo || "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&h=400"}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-4">
                <h3 className="font-medium text-lg mb-1">{restaurant.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{restaurant.address}</p>

                <button
                  onClick={() => handleAddRestaurant(restaurant.id)}
                  className="w-full bg-emerald-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-600"
                >
                  <Plus className="h-5 w-5" />
                  Ajouter
                </button>
              </div>
            </div>
          ))}

          {filteredRestaurants.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">Aucun restaurant trouvé</p>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}