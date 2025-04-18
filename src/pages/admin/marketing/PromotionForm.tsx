import { collection, doc, getDoc } from 'firebase/firestore';
import { ChevronLeft, Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { db } from '../../../config/firebase';
import { useRestaurantContext } from '../../../context/RestaurantContext';
import useOrderNotification from '../../../hooks/useOrderNotification';
import { createPromotion, updatePromotion } from '../../../services/promotionService';
import type { Promotion } from '../../../types/firebase';

const PROMOTION_TYPES = [
  { id: 'double', name: 'Produit doublé', description: 'Le client reçoit deux fois le même produit' },
  { id: 'discount', name: 'Réduction', description: 'Appliquer une réduction en pourcentage' },
  { id: 'free', name: 'Produit offert', description: 'Offrir un produit à l\'achat d\'un autre' },
  { id: 'second_item_discount', name: 'Réduction sur le 2ème', description: 'Réduction sur le deuxième article' }
];

export default function PromotionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { restaurant, menu = [] } = useRestaurantContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useOrderNotification();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'double' as Promotion['type'],
    status: 'active' as Promotion['status'],
    conditions: {
      productId: '',
      productName: '',
      discountPercent: 0,
      freeProductId: '',
      freeProductName: ''
    }
  });

  useEffect(() => {
    // Load promotion data if editing
    if (id && restaurant?.id) {
      const loadPromotion = async () => {
        try {
          setLoading(true);
          const promotionsRef = collection(db, 'restaurants', restaurant.id, 'promotions');
          const promotionDoc = await getDoc(doc(promotionsRef, id));

          if (promotionDoc.exists()) {
            const data = promotionDoc.data();
            setFormData({
              name: data.name || '',
              description: data.description || '',
              type: data.type || 'double',
              status: data.status || 'active',
              conditions: {
                productId: data.conditions?.productId || '',
                productName: data.conditions?.productName || '',
                discountPercent: data.conditions?.discountPercent || 0,
                freeProductId: data.conditions?.freeProductId || '',
                freeProductName: data.conditions?.freeProductName || ''
              }
            });
          }
        } catch (err) {
          console.error('Error loading promotion:', err);
          setError('Erreur lors du chargement de la promotion');
        } finally {
          setLoading(false);
        }
      };

      loadPromotion();
    }
  }, [id, restaurant?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id) return;

    try {
      setLoading(true);
      setError(null);

      const promotionData = {
        ...formData,
      };

      if (id) {
        await updatePromotion(restaurant.id, id, promotionData);
      } else {
        await createPromotion(restaurant.id, promotionData);
      }

      navigate('/admin/marketing/promotions');
    } catch (err) {
      console.error('Error saving promotion:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/marketing/promotions')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Modifier la promotion' : 'Nouvelle promotion'}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la promotion
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de promotion
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PROMOTION_TYPES.map((type) => (
                    <label
                      key={type.id}
                      className={`relative flex flex-col p-4 cursor-pointer rounded-lg border-2 transition-colors ${formData.type === type.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-200'
                        }`}
                    >
                      <input
                        type="radio"
                        name="promotionType"
                        value={type.id}
                        checked={formData.type === type.id}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          type: e.target.value as Promotion['type']
                        }))}
                        className="sr-only"
                      />
                      <span className="font-medium mb-1">{type.name}</span>
                      <span className="text-sm text-gray-500">{type.description}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    status: e.target.value as 'active' | 'inactive'
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produit concerné
                </label>
                <select
                  value={formData.conditions.productId}
                  onChange={(e) => {
                    const product = menu.find(p => p.id === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      conditions: {
                        ...prev.conditions,
                        productId: e.target.value,
                        productName: product?.name || ''
                      }
                    }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  <option value="">Sélectionner un produit</option>
                  {menu.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.type === 'discount' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pourcentage de réduction
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.conditions.discountPercent}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      conditions: {
                        ...prev.conditions,
                        discountPercent: parseInt(e.target.value)
                      }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
              )}

              {formData.type === 'free' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produit offert
                  </label>
                  <select
                    value={formData.conditions.freeProductId}
                    onChange={(e) => {
                      const product = menu.find(p => p.id === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        conditions: {
                          ...prev.conditions,
                          freeProductId: e.target.value,
                          freeProductName: product?.name || ''
                        }
                      }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="">Sélectionner un produit</option>
                    {menu.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.type === 'second_item_discount' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" required>
                      Pourcentage de réduction sur le 2ème article
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.conditions.discountPercent || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        conditions: {
                          ...prev.conditions,
                          discountPercent: Math.min(100, Math.max(1, parseInt(e.target.value) || 0))
                        }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/marketing/promotions')}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-5 w-5" />
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}