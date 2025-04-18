import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Power } from 'lucide-react';
import { getAllFoodCourts } from '../../services/foodCourtService';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { FoodCourt } from '../../types/foodCourt';

export default function FoodCourtManagement() {
  const navigate = useNavigate();
  const [foodCourts, setFoodCourts] = useState<FoodCourt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFoodCourts();
  }, []);

  const loadFoodCourts = async () => {
    try {
      setLoading(true);
      const data = await getAllFoodCourts();
      setFoodCourts(data);
    } catch (err) {
      console.error('Error loading food courts:', err);
      setError('Erreur lors du chargement des food courts');
    } finally {
      setLoading(false);
    }
  };

  const filteredFoodCourts = foodCourts.filter(foodCourt =>
    foodCourt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    foodCourt.location.address.toLowerCase().includes(searchQuery.toLowerCase())
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Food Courts</h1>
              <p className="mt-1 text-sm text-gray-500">
                {foodCourts.length} food court{foodCourts.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => navigate('/superadmin/food-courts/new')}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-600"
            >
              <Plus className="h-5 w-5" />
              Nouveau Food Court
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un food court..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFoodCourts.map((foodCourt) => (
            <div
              key={foodCourt.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div className="relative h-48">
                <img
                  src={foodCourt.coverImage || foodCourt.logo || "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&h=400"}
                  alt={foodCourt.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent">
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-white font-bold text-xl">{foodCourt.name}</h3>
                    <p className="text-white/80 text-sm">{foodCourt.location.address}</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    foodCourt.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {foodCourt.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {foodCourt.restaurants.length} restaurant{foodCourt.restaurants.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => navigate(`/superadmin/food-courts/${foodCourt.id}`)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      // Toggle status
                    }}
                    className={`p-2 rounded-lg ${
                      foodCourt.status === 'active'
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <Power className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      // Delete food court
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredFoodCourts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun food court trouvé</p>
            <button
              onClick={() => navigate('/superadmin/food-courts/new')}
              className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg"
            >
              Créer un food court
            </button>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}