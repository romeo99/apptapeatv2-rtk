import { Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useRestaurantContext } from '../../context/RestaurantContext';
import useOrderNotification from '../../hooks/useOrderNotification';
import { updateRestaurant } from '../../services/restaurantService';
import { uploadImage } from '../../services/uploadService';
import { uploadToS3 } from '../../services/uploadToS3';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function Settings() {
  const { restaurant, loading, error } = useRestaurantContext();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: restaurant?.name || '',
    description: restaurant?.description || '',
    address: restaurant?.address || '',
    phone: restaurant?.phone || '',
    email: restaurant?.email || '',
    openingHours: restaurant?.openingHours || DAYS.reduce((acc, day) => ({
      ...acc,
      [day]: { open: '09:00', close: '22:00', closed: false }
    }), {}),
    features: restaurant?.features || []
  });

  useOrderNotification();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        setSaveError('L\'image ne doit pas dépasser 5MB');
        return;
      }
      if (type === 'logo') {
        setLogoFile(file);
      } else {
        setCoverFile(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    try {
      setSaving(true);
      setSaveError(null);

      let logoUrl = restaurant.logo;
      let coverUrl = restaurant.coverImage;

      if (logoFile) {
        logoUrl = await uploadImage(logoFile, 'restaurants/logos');
      }
      if (coverFile) {
        coverUrl = await uploadImage(coverFile, 'restaurants/covers');
      }

      //store logo in s3 database
      if (logoFile && logoUrl) {
        await uploadToS3(restaurant.id, logoUrl!);
      }

      await updateRestaurant(restaurant.id, {
        ...formData,
        logo: logoUrl,
        coverImage: coverUrl
      });

    } catch (err) {
      console.error('Error saving settings:', err);
      setSaveError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres du Restaurant</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {saveError && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {saveError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations générales */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Informations générales
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du restaurant
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
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Images
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'logo')}
                  className="w-full"
                />
                {restaurant?.logo && (
                  <img
                    src={restaurant.logo}
                    alt="Logo actuel"
                    className="mt-2 h-20 w-20 object-cover rounded-lg"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image de couverture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'cover')}
                  className="w-full"
                />
                {restaurant?.coverImage && (
                  <img
                    src={restaurant.coverImage}
                    alt="Couverture actuelle"
                    className="mt-2 h-20 w-40 object-cover rounded-lg"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Horaires d'ouverture */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Horaires d'ouverture
            </h2>

            <div className="space-y-4">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-32">
                    <span className="text-sm font-medium text-gray-700">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </span>
                  </div>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!formData.openingHours[day].closed}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        openingHours: {
                          ...prev.openingHours,
                          [day]: {
                            ...prev.openingHours[day],
                            closed: !e.target.checked
                          }
                        }
                      }))}
                      className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Ouvert</span>
                  </label>

                  {!formData.openingHours[day].closed && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={formData.openingHours[day].open}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          openingHours: {
                            ...prev.openingHours,
                            [day]: {
                              ...prev.openingHours[day],
                              open: e.target.value
                            }
                          }
                        }))}
                        className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={formData.openingHours[day].close}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          openingHours: {
                            ...prev.openingHours,
                            [day]: {
                              ...prev.openingHours[day],
                              close: e.target.value
                            }
                          }
                        }))}
                        className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Options
            </h2>

            <div className="space-y-4">
              {['dine_in', 'takeaway', 'delivery'].map((feature) => (
                <label key={feature} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={(e) => {
                      const features = e.target.checked
                        ? [...formData.features, feature]
                        : formData.features.filter((f: string) => f !== feature);
                      setFormData(prev => ({ ...prev, features }));
                    }}
                    className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    {feature === 'dine_in' ? 'Sur place' :
                      feature === 'takeaway' ? 'À emporter' : 'Livraison'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
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
    </AdminLayout>
  );
}