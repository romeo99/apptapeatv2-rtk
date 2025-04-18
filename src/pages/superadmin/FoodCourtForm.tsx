import { useLoadScript } from '@react-google-maps/api';
import { ChevronLeft, Loader2, MapPin, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';
import { createFoodCourt, getFoodCourt, updateFoodCourt } from '../../services/foodCourtService';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBi3DoK4uEJmMfyjnSCLoQ_hxIv-h-Cbf4';
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const PAYMENT_METHODS = [
  { id: 'card', name: 'Carte bancaire', icon: '💳' },
  { id: 'cash', name: 'Espèces', icon: '💵' },
  { id: 'mobile', name: 'Paiement mobile', icon: '📱' }
];

export default function FoodCourtForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');
  const addressInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    coverImage: '',
    location: {
      address: '',
      lat: 0,
      lng: 0
    },
    openingHours: DAYS.reduce((acc, day) => ({
      ...acc,
      [day]: { open: '09:00', close: '22:00', closed: false }
    }), {}),
    paymentMethods: ['card'],
    serviceFee: 0,
    status: 'active' as const,
    categories: [],
    restaurants: []
  });

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places"]
  });

  useEffect(() => {
    if (id) {
      loadFoodCourt();
    } else {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isLoaded && addressInputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, {
        componentRestrictions: { country: 'FR' },
        fields: ['formatted_address', 'geometry']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location && place.formatted_address) {
          setFormData(prev => ({
            ...prev,
            location: {
              address: place.formatted_address,
              lat: place.geometry!.location.lat(),
              lng: place.geometry!.location.lng()
            }
          }));
        }
      });
    }
  }, [isLoaded]);

  const loadFoodCourt = async () => {
    try {
      const foodCourt = await getFoodCourt(id!);
      setFormData({
        name: foodCourt.name,
        description: foodCourt.description,
        location: foodCourt.location,
        openingHours: foodCourt.openingHours,
        paymentMethods: foodCourt.paymentMethods,
        serviceFee: foodCourt.serviceFee,
        status: foodCourt.status,
        categories: foodCourt.categories
      });
      setLogoPreview(foodCourt.logo || '');
      setCoverPreview(foodCourt.coverImage || '');
    } catch (err) {
      console.error('Error loading food court:', err);
      setError('Erreur lors du chargement du food court');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5MB');
      return;
    }

    if (type === 'logo') {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name?.trim()) {
        setError('Le nom est requis');
        return;
      }

      if (!formData.location?.address?.trim()) {
        setError('L\'adresse est requise');
        return;
      }

      setSaving(true);
      setError(null);

      const foodCourtData = {
        ...formData,
        logo: logoPreview || undefined,
        coverImage: coverPreview || undefined
      };

      if (id) {
        await updateFoodCourt(id, foodCourtData, logoFile || undefined, coverFile || undefined);
      } else {
        await createFoodCourt(foodCourtData, logoFile || undefined, coverFile || undefined);
      }

      navigate('/superadmin/food-courts');
    } catch (err) {
      console.error('Error saving food court:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center gap-4">
            <button
              onClick={() => navigate('/superadmin/food-courts')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Modifier le Food Court' : 'Nouveau Food Court'}
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Images */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Images</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview('');
                        setLogoFile(null);
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-gray-300 border-dashed rounded-lg flex items-center justify-center">
                    <label className="cursor-pointer text-center p-2">
                      <Upload className="h-6 w-6 text-gray-400 mx-auto" />
                      <span className="mt-2 block text-xs text-gray-600">
                        Ajouter un logo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, 'logo')}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image de couverture
                </label>
                {coverPreview ? (
                  <div className="relative">
                    <img
                      src={coverPreview}
                      alt="Cover"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverPreview('');
                        setCoverFile(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-gray-300 border-dashed rounded-lg p-8">
                    <label className="cursor-pointer text-center block">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                      <span className="mt-2 block text-sm text-gray-600">
                        Ajouter une image de couverture
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, 'cover')}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Informations générales */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Informations générales
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du Food Court
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
                  Adresse
                </label>
                <div className="relative">
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={formData.location.address}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      location: { ...prev.location, address: e.target.value }
                    }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Entrez l'adresse"
                    required
                  />
                  <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frais de service (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.serviceFee}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    serviceFee: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
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

          {/* Moyens de paiement */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Moyens de paiement acceptés
            </h2>

            <div className="grid grid-cols-3 gap-4">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.id}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer transition-all ${formData.paymentMethods.includes(method.id)
                      ? 'bg-emerald-50 border-2 border-emerald-500'
                      : 'bg-white border-2 border-gray-200 hover:border-emerald-500'
                    }`}
                >
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
                  <span className="text-4xl mb-2">{method.icon}</span>
                  <span className="text-sm font-medium text-center">{method.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/superadmin/food-courts')}
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
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </SuperAdminLayout>
  );
}