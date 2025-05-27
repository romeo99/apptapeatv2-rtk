import { collection, doc, getDoc } from 'firebase/firestore';
import { ChevronLeft, Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { db } from '../../../config/firebase';
import { useRestaurantContext } from '../../../context/RestaurantContext';
import useOrderNotification from '../../../hooks/useOrderNotification';
import { createLoyalty, updateLoyalty } from '../../../services/loyaltyService';
import type { Loyalty } from '../../../types/firebase';

export default function FideliteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { restaurant } = useRestaurantContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useOrderNotification();

  const [formData, setFormData] = useState<Loyalty>({
    id: id || '',
    name: '',
    description: '',
    value: 0,
    point: 0,
    status: 'active',
  });

  useEffect(() => {
    // Load loyalty data if editing
    if (id && restaurant?.id) {
      const loadLoyalty = async () => {
        try {
          setLoading(true);
          const loyaltiesRef = collection(db, 'restaurants', restaurant.id, 'loyalties');
          const loyaltyDoc = await getDoc(doc(loyaltiesRef, id));

          if (loyaltyDoc.exists()) {
            const data = loyaltyDoc.data();
            setFormData({
              name: data.name || '',
              description: data.description || '',
              status: data.status || 'active',
              value: data.value || 0,
              point: data.point || 0,
              id: loyaltyDoc.id,
            });
          }
        } catch (err) {
          console.error('Error loading loyalty:', err);
          setError('Erreur lors du chargement du programme de fidélité');
        } finally {
          setLoading(false);
        }
      };

      loadLoyalty();
    }
  }, [id, restaurant?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id) return;

    try {
      setLoading(true);
      setError(null);

      const loyaltyData = {
        ...formData,
      };

      if (id) {
        await updateLoyalty(restaurant.id, id, loyaltyData);
      } else {
        await createLoyalty(restaurant.id, loyaltyData);
      }

      navigate('/admin/marketing/loyalties');
    } catch (err) {
      console.error('Error saving loyalty:', err);
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
              onClick={() => navigate('/admin/marketing/loyalties')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Modifier le programme de fidélité' : 'Nouveau programme de fidélité'}
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
                  Nom du programme
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
                  Montant visé (€)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="0.5"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    value: parseFloat(e.target.value)
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points correspondants
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.point}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    point: parseInt(e.target.value)
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/marketing/loyalties')}
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