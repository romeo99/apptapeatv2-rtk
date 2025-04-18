import { Edit2, Percent, Plus, Search, Tag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useRestaurantContext } from '../../../context/RestaurantContext';
import useOrderNotification from '../../../hooks/useOrderNotification';
import { deletePromotion, getAllPromotions } from '../../../services/promotionService';
import type { Promotion } from '../../../types/firebase';

export default function PromotionsPage() {
  const navigate = useNavigate();
  const { restaurant } = useRestaurantContext();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useOrderNotification();

  useEffect(() => {
    if (!restaurant?.id) return;

    const loadPromotions = async () => {
      try {
        setLoading(true);
        const data = await getAllPromotions(restaurant.id);
        setPromotions(data);
      } catch (err) {
        console.error('Error loading promotions:', err);
        setError('Erreur lors du chargement des promotions');
      } finally {
        setLoading(false);
      }
    };

    loadPromotions();
  }, [restaurant?.id]);

  const handleDelete = async (promotionId: string) => {
    if (!restaurant?.id) return;
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) return;

    try {
      await deletePromotion(restaurant.id, promotionId);
      setPromotions(prev => prev.filter(p => p.id !== promotionId));
    } catch (err) {
      console.error('Error deleting promotion:', err);
      setError('Erreur lors de la suppression de la promotion');
    }
  };

  const filteredPromotions = promotions.filter(promo =>
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
              <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gérez vos offres promotionnelles
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/marketing/promotions/new')}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-600"
            >
              <Plus className="h-5 w-5" />
              Nouvelle promotion
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
              placeholder="Rechercher une promotion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromotions.map((promotion) => (
            <div key={promotion.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-medium text-lg">{promotion.name}</h3>
                  <p className="text-sm text-gray-500">{promotion.description}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${promotion.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : promotion.status === 'expired'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                  }`}>
                  {promotion.status === 'active' ? 'Active' :
                    promotion.status === 'expired' ? 'Expirée' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Tag className="h-4 w-4" />
                  <span>
                    {promotion.type === 'double' ? '1 acheté = 2 offerts' :
                      promotion.type === 'discount' ? `${promotion.conditions.discountPercent}% de réduction` :
                        promotion.type === 'free' ? 'Produit offert' :
                          promotion.type === 'second_item_discount' ? `${promotion.conditions.discountPercent}% sur le 2ème` :
                            ''}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => navigate(`/admin/marketing/promotions/edit/${promotion.id}`)}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(promotion.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredPromotions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Percent className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">
              {searchQuery ? 'Aucune promotion trouvée' : 'Aucune promotion active'}
            </p>
            <button
              onClick={() => navigate('/admin/marketing/promotions/new')}
              className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg"
            >
              Créer une promotion
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}