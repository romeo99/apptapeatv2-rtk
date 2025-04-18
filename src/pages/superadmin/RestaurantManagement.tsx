import { Edit2, Eye, Plus, Power, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';
import { deleteRestaurant, getAllRestaurants, impersonateRestaurant, updateRestaurantStatus } from '../../services/superadminService';

const FILTERS = {
  status: [
    { value: 'all', label: 'Tous' },
    { value: 'active', label: 'Actifs' },
    { value: 'inactive', label: 'Inactifs' }
  ],
  period: [
    { value: 'all', label: 'Toutes les dates' },
    { value: 'today', label: "Aujourd'hui" },
    { value: 'week', label: '7 derniers jours' },
    { value: 'month', label: '30 derniers jours' }
  ],
  revenue: [
    { value: 'all', label: 'Tous les revenus' },
    { value: 'high', label: '> 10 000€' },
    { value: 'medium', label: '1 000€ - 10 000€' },
    { value: 'low', label: '< 1 000€' }
  ]
};

export default function RestaurantManagement() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    period: 'all',
    revenue: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

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

  const handleDelete = async (restaurantId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce restaurant ?')) {
      return;
    }

    try {
      await deleteRestaurant(restaurantId);
      await loadRestaurants();
    } catch (err) {
      console.error('Error deleting restaurant:', err);
      setError('Erreur lors de la suppression du restaurant');
    }
  };

  const handleStatusToggle = async (restaurantId: string, currentStatus: boolean) => {
    try {
      await updateRestaurantStatus(restaurantId, !currentStatus);
      await loadRestaurants();
    } catch (err) {
      console.error('Error updating restaurant status:', err);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const handleImpersonate = async (restaurantId: string) => {
    try {
      await impersonateRestaurant(restaurantId, navigate);
    } catch (error) {
      console.error('Error impersonating restaurant:', error);
      setError('Erreur lors de l\'impersonation');
    }
  };

  const handleRestaurantClick = (restaurantId: string) => {
    navigate(`/superadmin/restaurants/${restaurantId}`);
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    // Filtre de recherche
    const matchesSearch =
      restaurant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.address?.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtre de statut
    const matchesStatus =
      filters.status === 'all' ||
      (filters.status === 'active' && restaurant.isOpen) ||
      (filters.status === 'inactive' && !restaurant.isOpen);

    // Filtre de période
    let matchesPeriod = true;
    if (filters.period !== 'all') {
      const createdAt = restaurant.createdAt?.toDate();
      const now = new Date();
      switch (filters.period) {
        case 'today':
          matchesPeriod = createdAt?.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          matchesPeriod = createdAt >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.setDate(now.getDate() - 30));
          matchesPeriod = createdAt >= monthAgo;
          break;
      }
    }

    // Filtre de revenu
    let matchesRevenue = true;
    if (filters.revenue !== 'all') {
      const revenue = restaurant.totalRevenue || 0;
      switch (filters.revenue) {
        case 'high':
          matchesRevenue = revenue > 10000;
          break;
        case 'medium':
          matchesRevenue = revenue >= 1000 && revenue <= 10000;
          break;
        case 'low':
          matchesRevenue = revenue < 1000;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesPeriod && matchesRevenue;
  });

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
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Restaurants</h1>
              <p className="mt-1 text-sm text-gray-500">
                {restaurants.length} restaurant{restaurants.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => navigate('/superadmin/restaurants/new')}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-600"
            >
              <Plus className="h-5 w-5" />
              Ajouter un restaurant
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
            >
              Filtres
              {(filters.status !== 'all' || filters.period !== 'all' || filters.revenue !== 'all') && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-emerald-500 text-white rounded-full">
                  {Object.values(filters).filter(v => v !== 'all').length}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {FILTERS.status.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Période d'inscription
                  </label>
                  <select
                    value={filters.period}
                    onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {FILTERS.period.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Revenus
                  </label>
                  <select
                    value={filters.revenue}
                    onChange={(e) => setFilters(prev => ({ ...prev, revenue: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {FILTERS.revenue.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adresse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRestaurants.map((restaurant) => (
                <tr key={restaurant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="flex-shrink-0 h-10 w-10 cursor-pointer"
                        onClick={() => navigate(`/superadmin/restaurants/${restaurant.id}`)}
                      >
                        <img
                          src={restaurant.logo || "https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png"}
                          alt={restaurant.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div
                          className="text-sm font-medium text-gray-900 hover:text-emerald-600 cursor-pointer"
                          onClick={() => navigate(`/superadmin/restaurants/${restaurant.id}`)}
                        >
                          {restaurant.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{restaurant.email}</div>
                    <div className="text-sm text-gray-500">{restaurant.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(restaurant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="font-medium text-emerald-600">
                      {(restaurant.totalRevenue || 0).toFixed(2)} €
                    </div>
                    <div className="text-xs text-gray-500">
                      {restaurant.orderCount || 0} commandes
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${restaurant.isOpen
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {restaurant.isOpen ? 'Ouvert' : 'Fermé'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2 min-w-[160px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImpersonate(restaurant.id);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex-shrink-0"
                        title="Se connecter en tant que"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/superadmin/restaurants/${restaurant.id}`);
                        }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg flex-shrink-0"
                        title="Voir les détails"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusToggle(restaurant.id, restaurant.isOpen);
                        }}
                        className={`p-2 rounded-lg flex-shrink-0 ${restaurant.isOpen
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                          }`}
                        title={restaurant.isOpen ? 'Fermer' : 'Ouvrir'}
                      >
                        <Power className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(restaurant.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRestaurants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun restaurant trouvé</p>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}