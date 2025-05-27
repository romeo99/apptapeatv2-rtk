import { Edit2, Percent, Plus, Search, Tag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useRestaurantContext } from '../../../context/RestaurantContext';
import useOrderNotification from '../../../hooks/useOrderNotification';
import { deleteLoyalty, getAllLoyalties } from '../../../services/loyaltyService';
import type { Loyalty } from '../../../types/firebase';

export default function LoyaltyPage() {
  const navigate = useNavigate();
  const { restaurant } = useRestaurantContext();
  const [loyalties, setLoyalties] = useState<Loyalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useOrderNotification();

  useEffect(() => {
    if (!restaurant?.id) return;

    const loadLoyalties = async () => {
      try {
        setLoading(true);
        const data = await getAllLoyalties(restaurant.id);
        setLoyalties(data);
      } catch (err) {
        console.error('Error loading loyalties:', err);
        setError('Erreur lors du chargement des programmes de fidélité');
      } finally {
        setLoading(false);
      }
    };

    loadLoyalties();
  }, [restaurant?.id]);

  const handleDelete = async (loyaltyId: string) => {
    if (!restaurant?.id) return;
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce programme de fidélité ?')) return;

    try {
      await deleteLoyalty(restaurant.id, loyaltyId);
      setLoyalties(prev => prev.filter(p => p.id !== loyaltyId));
    } catch (err) {
      console.error('Error deleting loyalty:', err);
      setError('Erreur lors de la suppression du programme de fidélité');
    }
  };

  const filteredLoyalties = loyalties.filter(promo =>
    promo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Programmes de fidélité</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gérez vos programmes de fidélité pour récompenser vos clients fidèles.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/marketing/loyalties/new')}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-600"
            >
              <Plus className="h-5 w-5" />
              Nouveau programme de fidélité
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un programme de fidélité..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLoyalties.map((loyalty) => (
            <div key={loyalty.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-medium text-lg">{loyalty.name}</h3>
                  <p className="text-sm text-gray-500">{loyalty.description}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${loyalty.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
                  }`}>
                  {loyalty.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Tag className="h-4 w-4" />
                  <span>
                    {loyalty.value} € = {loyalty.point} points
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => navigate(`/admin/marketing/loyalties/edit/${loyalty.id}`)}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(loyalty.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredLoyalties.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Percent className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">
              {searchQuery ? 'Aucun programme de filélité trouvée' : 'Aucun programme de fidélité actif'}
            </p>
            <button
              onClick={() => navigate('/admin/marketing/loyalties/new')}
              className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg"
            >
              Créer un programme de fidélité
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}