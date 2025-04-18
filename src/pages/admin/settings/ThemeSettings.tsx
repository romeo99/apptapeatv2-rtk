import { ChevronLeft, Loader2, Palette, Save } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useRestaurantContext } from '../../../context/RestaurantContext';
import useOrderNotification from '../../../hooks/useOrderNotification';
import { updateRestaurant } from '../../../services/restaurantService';

const DEFAULT_COLORS = [
  '#10B981', // Default emerald
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#000000', // Black
];

export default function ThemeSettings() {
  const navigate = useNavigate();
  const { restaurant, loading, error: contextError } = useRestaurantContext();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState(
    restaurant?.theme?.primaryColor || '#10B981'
  );
  const [customColor, setCustomColor] = useState('');

  useOrderNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id) return;

    try {
      setSaving(true);
      setError(null);

      await updateRestaurant(restaurant.id, {
        theme: {
          primaryColor
        }
      });

      navigate('/admin/settings');
    } catch (err) {
      console.error('Error saving theme:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Thème</h1>
              <p className="text-sm text-gray-500">Personnalisez l'apparence de votre menu</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Palette className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-medium text-gray-900">
                Couleur principale
              </h2>
            </div>

            <div className="space-y-6">
              {/* Couleurs prédéfinies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Couleurs suggérées
                </label>
                <div className="grid grid-cols-7 gap-4">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setPrimaryColor(color)}
                      className={`w-10 h-10 rounded-full border-2 ${primaryColor === color
                        ? 'border-gray-900 scale-110'
                        : 'border-transparent hover:border-gray-200'
                        } transition-all`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Couleur personnalisée */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Couleur personnalisée
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setPrimaryColor(customColor)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                  >
                    Appliquer
                  </button>
                </div>
              </div>

              {/* Aperçu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Aperçu
                </label>
                <div className="bg-gray-100 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      style={{ backgroundColor: primaryColor }}
                      className="px-4 py-2 text-white rounded-lg"
                    >
                      Ajouter au panier
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        style={{ backgroundColor: primaryColor }}
                        className="w-8 h-8 rounded-full text-white flex items-center justify-center"
                      >
                        -
                      </button>
                      <span>1</span>
                      <button
                        type="button"
                        style={{ backgroundColor: primaryColor }}
                        className="w-8 h-8 rounded-full text-white flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div
                    style={{ backgroundColor: primaryColor }}
                    className="w-full py-3 text-white text-center rounded-xl"
                  >
                    Commander
                  </div>
                </div>
              </div>
            </div>
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
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}