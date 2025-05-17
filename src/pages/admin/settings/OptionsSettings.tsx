import { AlertCircle, ChevronLeft, Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useRestaurantContext } from '../../../context/RestaurantContext';
import useOrderNotification from '../../../hooks/useOrderNotification';
import { updateRestaurant } from '../../../services/restaurantService';

const PAYMENT_METHODS = [
  { id: 'card', name: 'Carte bancaire', icon: '💳' },
  { id: 'cash', name: 'Espèces', icon: '💵' },
  { id: 'apple_pay', name: 'Paiement mobile', icon: '📱' }
];

const SERVICE_OPTIONS = [
  { id: 'dine_in', name: 'Sur place', icon: '🍽️' },
  { id: 'takeaway', name: 'À emporter', icon: '🥡' },
  { id: 'delivery', name: 'Livraison', icon: '🚚' }
];

export default function OptionsSettings() {
  const navigate = useNavigate();
  const { restaurant, loading, error } = useRestaurantContext();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    paymentMethods: [] as string[],
    serviceOptions: [] as string[],
    minimumOrder: 0,
    averagePreparationTime: 15,
    tableCount: 0,
    deliveryFee: 0,
    driverFee: 0,
    autoPrint: null as boolean | null
  });

  useOrderNotification();

  useEffect(() => {
    if (restaurant) {
      setFormData({
        paymentMethods: restaurant.paymentMethods || [],
        serviceOptions: restaurant.serviceOptions || [],
        minimumOrder: restaurant.minimumOrder || 0,
        averagePreparationTime: restaurant.averagePreparationTime || 15,
        tableCount: restaurant.tableCount || 0,
        deliveryFee: restaurant.deliveryFee || 0,
        driverFee: restaurant.driverFee || 0,
        autoPrint: restaurant.autoPrint ?? true
      });
    }
  }, [restaurant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id) {
      setSaveError('Restaurant non trouvé');
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      // Clean and validate data
      const cleanData = {
        paymentMethods: formData.paymentMethods,
        serviceOptions: formData.serviceOptions,
        minimumOrder: Math.max(0, Number(formData.minimumOrder) || 0),
        averagePreparationTime: Math.max(0, Number(formData.averagePreparationTime) || 15),
        tableCount: Math.max(0, Number(formData.tableCount) || 0),
        deliveryFee: Math.max(0, Number(formData.deliveryFee) || 0),
        driverFee: Math.max(0, Number(formData.driverFee) || 0),
        autoPrint: !!formData.autoPrint,
      };

      await updateRestaurant(restaurant.id, cleanData);

      navigate('/admin/settings');
    } catch (err) {
      console.error('Error saving settings:', err);
      setSaveError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la sauvegarde');
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
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/settings')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes options</h1>
              <p className="text-sm text-gray-500 mt-1">Configurez les paramètres de votre établissement</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(saveError || error) && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{saveError || error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Moyens de paiement */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-white border-b">
              <h2 className="text-xl font-semibold text-gray-900">Moyens de paiement</h2>
              <p className="text-sm text-gray-500 mt-1">Sélectionnez les moyens de paiement que vous acceptez</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PAYMENT_METHODS.map((method) => (
                  <label key={method.id} className={`flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer transition-all ${formData.paymentMethods.includes(method.id)
                    ? 'bg-emerald-50 border-2 border-emerald-500 shadow-md transform scale-[1.02]'
                    : 'bg-white border-2 border-gray-100 hover:border-emerald-500 hover:shadow-md hover:scale-[1.02]'
                    }`}>
                    <input
                      type="checkbox"
                      checked={formData.paymentMethods.includes(method.id)}
                      onChange={(e) => {
                        const methods = e.target.checked
                          ? [...formData.paymentMethods, method.id]
                          : formData.paymentMethods.filter(m => m !== method.id);
                        setFormData(prev => ({ ...prev, paymentMethods: methods }));
                      }}
                      className="sr-only"
                    />
                    <span className="text-4xl mb-4">{method.icon}</span>
                    <span className="text-base font-medium text-center">{method.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Options de service */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-white border-b">
              <h2 className="text-xl font-semibold text-gray-900">Options de service</h2>
              <p className="text-sm text-gray-500 mt-1">Choisissez comment vous souhaitez servir vos clients</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SERVICE_OPTIONS.map((option) => (
                  <label key={option.id} className={`flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer transition-all ${formData.serviceOptions.includes(option.id)
                    ? 'bg-emerald-50 border-2 border-emerald-500 shadow-md transform scale-[1.02]'
                    : 'bg-white border-2 border-gray-100 hover:border-emerald-500 hover:shadow-md hover:scale-[1.02]'
                    }`}>
                    <input
                      type="checkbox"
                      checked={formData.serviceOptions.includes(option.id)}
                      onChange={(e) => {
                        const options = e.target.checked
                          ? [...formData.serviceOptions, option.id]
                          : formData.serviceOptions.filter(o => o !== option.id);
                        setFormData(prev => ({ ...prev, serviceOptions: options }));
                      }}
                      className="sr-only"
                    />
                    <span className="text-4xl mb-4">{option.icon}</span>
                    <span className="text-base font-medium text-center">{option.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Paramètres de livraison */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-white border-b">
              <h2 className="text-xl font-semibold text-gray-900">Paramètres de livraison</h2>
              <p className="text-sm text-gray-500 mt-1">Configurez les frais et options de livraison</p>
            </div>

            <div className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frais de livraison (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.deliveryFee}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    deliveryFee: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Frais fixes appliqués à chaque commande en livraison
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rémunération livreur (€/Km)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.driverFee}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    driverFee: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Montant reversé au livreur pour chaque livraison
                </p>
              </div>
            </div>
          </div>

          {/* Paramètres généraux */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-white border-b">
              <h2 className="text-xl font-semibold text-gray-900">Paramètres généraux</h2>
              <p className="text-sm text-gray-500 mt-1">Configurez les paramètres de base de votre établissement</p>
            </div>

            <div className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commande minimum (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimumOrder}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    minimumOrder: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temps de préparation moyen (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.averagePreparationTime}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    averagePreparationTime: parseInt(e.target.value) || 0
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de tables
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.tableCount}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    tableCount: parseInt(e.target.value) || 0
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoPrint"
                  checked={formData.autoPrint}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    autoPrint: e.target.checked
                  }))}
                  className="w-5 h-5 text-emerald-600 focus:ring-2 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="autoPrint" className="text-sm font-medium text-gray-700">
                  Impression automatique des tickets
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-4 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-base font-medium shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-5 w-5" />
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}