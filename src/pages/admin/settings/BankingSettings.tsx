import { AlertCircle, ChevronLeft, Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useRestaurantContext } from '../../../context/RestaurantContext';
import useOrderNotification from '../../../hooks/useOrderNotification';
import { updateRestaurant } from '../../../services/restaurantService';

export default function BankingSettings() {
  const navigate = useNavigate();
  const { restaurant, loading, error } = useRestaurantContext();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    bankName: restaurant?.bankInfo?.bankName || '',
    iban: restaurant?.bankInfo?.iban || '',
    bic: restaurant?.bankInfo?.bic || '',
    accountHolder: restaurant?.bankInfo?.accountHolder || '',
    paymentSchedule: restaurant?.bankInfo?.paymentSchedule || 'weekly'
  });

  useOrderNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    try {
      setSaving(true);
      setSaveError(null);

      await updateRestaurant(restaurant.id, {
        bankInfo: formData
      });

      navigate('/admin/settings');
    } catch (err) {
      console.error('Error saving banking info:', err);
      setSaveError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/settings')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Informations bancaires</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {saveError && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{saveError}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titulaire du compte
              </label>
              <input
                type="text"
                value={formData.accountHolder}
                onChange={(e) => setFormData(prev => ({ ...prev, accountHolder: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la banque
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IBAN
              </label>
              <input
                type="text"
                value={formData.iban}
                onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value.toUpperCase() }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                pattern="^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$"
                placeholder="FR76XXXXXXXXXXXXXXXXXXXXXXX"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BIC/SWIFT
              </label>
              <input
                type="text"
                value={formData.bic}
                onChange={(e) => setFormData(prev => ({ ...prev, bic: e.target.value.toUpperCase() }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                pattern="^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$"
                placeholder="BNPAFRPPXXX"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fréquence des versements
              </label>
              <select
                value={formData.paymentSchedule}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentSchedule: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="biweekly">Bi-mensuel</option>
                <option value="monthly">Mensuel</option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/settings')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-5 w-5" />
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="text-blue-800 font-medium mb-2">Informations importantes</h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Les versements sont effectués automatiquement selon la fréquence choisie</li>
            <li>• Un relevé détaillé des transactions est disponible dans la section comptabilité</li>
            <li>• Les frais de service sont automatiquement déduits avant le versement</li>
            <li>• Un email de confirmation est envoyé à chaque versement</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}