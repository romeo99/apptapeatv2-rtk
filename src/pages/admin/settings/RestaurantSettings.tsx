import { useLoadScript } from '@react-google-maps/api';
import { ChevronLeft, Loader2, MapPin, Save, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useRestaurantContext } from '../../../context/RestaurantContext';
import useOrderNotification from '../../../hooks/useOrderNotification';
import { updateRestaurant, uploadRestaurantImage } from '../../../services/restaurantService';
import { uploadToS3 } from '../../../services/uploadToS3';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBi3DoK4uEJmMfyjnSCLoQ_hxIv-h-Cbf4';

const DAYS = [
  { id: 'monday', name: 'Lundi' },
  { id: 'tuesday', name: 'Mardi' },
  { id: 'wednesday', name: 'Mercredi' },
  { id: 'thursday', name: 'Jeudi' },
  { id: 'friday', name: 'Vendredi' },
  { id: 'saturday', name: 'Samedi' },
  { id: 'sunday', name: 'Dimanche' }
];

export default function RestaurantSettings() {
  const navigate = useNavigate();
  const { restaurant, loading } = useRestaurantContext();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    location: { lat: 0, lng: 0 },
    openingHours: {} as Record<string, { open: string; close: string; closed: boolean }>,
    instagramUrl: '',
    googleUrl: ''
  });

  useOrderNotification();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const [logoPreview, setLogoPreview] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        location: restaurant.location || { lat: 0, lng: 0 },
        openingHours: restaurant.openingHours || DAYS.reduce((acc, day) => ({
          ...acc,
          [day.id]: { open: '09:00', close: '22:00', closed: false }
        }), {}),
        instagramUrl: restaurant.instagramUrl || '',
        googleUrl: restaurant.googleUrl || ''
      });
      setLogoPreview(restaurant.logo || '');
      setCoverPreview(restaurant.coverImage || '');
    }
  }, [restaurant]);

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
            address: place.formatted_address,
          }));
          setAddressError(null);
          setAddressError(null);
        }
      });
    }
  }, [isLoaded]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSaveError('L\'image ne doit pas dépasser 5MB');
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
    if (!restaurant) return;

    // Validate address has coordinates
    if (!formData.location?.lat || !formData.location?.lng) {
      setAddressError('Veuillez sélectionner une adresse valide dans la liste des suggestions');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setAddressError(null);

      let logoUrl = restaurant.logo;
      let coverUrl = restaurant.coverImage;

      if (logoFile) {
        logoUrl = await uploadRestaurantImage(restaurant.id, logoFile, 'logo');
      }
      if (coverFile) {
        coverUrl = await uploadRestaurantImage(restaurant.id, coverFile, 'cover');
      }

      //store logo in s3 database
      if (logoFile && logoUrl) {
        await uploadToS3(restaurant.id, logoUrl!);
      }

      await updateRestaurant(restaurant.id, {
        ...formData,
        logo: logoUrl,
        coverImage: coverUrl,
      });

      navigate('/admin/settings');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la mise à jour');
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
            <h1 className="text-2xl font-bold text-gray-900">Mon restaurant</h1>
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
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Images
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo
                </label>
                <div className="mt-1 flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="w-24 h-24 object-cover rounded-lg"
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
                    <div className="w-24 h-24 border-2 border-gray-300 border-dashed rounded-lg flex items-center justify-center">
                      <label className="cursor-pointer text-center p-2">
                        <Upload className="h-6 w-6 text-gray-400 mx-auto" />
                        <span className="mt-2 block text-xs text-gray-600">
                          Ajouter
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image de couverture
                </label>
                <div className="mt-1">
                  {coverPreview ? (
                    <div className="relative">
                      <img
                        src={coverPreview}
                        alt="Couverture"
                        className="w-full h-48 object-cover rounded-lg"
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
          </div>

          {/* Informations générales */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Informations générales
            </h2>

            <div className="space-y-4">
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
                  URL Instagram
                </label>
                <input
                  type="url"
                  value={formData.instagramUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagramUrl: e.target.value }))}
                  placeholder="https://instagram.com/votre-compte"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Google Business
                  <span className="text-xs text-gray-500 ml-1">(pour les avis clients)</span>
                  <span className="text-xs text-gray-500 ml-1">(pour les avis clients)</span>
                </label>
                <input
                  type="url"
                  value={formData.googleUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, googleUrl: e.target.value }))}
                  placeholder="https://www.google.com/maps/place/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL du site web
                  <span className="text-xs text-gray-500 ml-1">(requis pour Apple Pay)</span>
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                  placeholder="https://www.votrerestaurant.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Un site web valide est requis pour activer Apple Pay. Vous pouvez utiliser l'URL de votre page TapEat.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL du site web
                  <span className="text-xs text-gray-500 ml-1">(requis pour Apple Pay)</span>
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                  placeholder="https://www.votrerestaurant.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Un site web valide est requis pour activer Apple Pay. Vous pouvez utiliser l'URL de votre page TapEat.
                </p>
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
                  <span className="text-xs text-gray-500 ml-1">(sélectionnez dans la liste)</span>
                </label>
                <div className="relative">
                  <input
                    ref={addressInputRef}
                    type="text"
                    defaultValue={formData.address}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${addressError ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Entrez l'adresse du restaurant"
                    required
                  />
                  <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {addressError && (
                  <p className="mt-1 text-sm text-red-500">{addressError}</p>
                )}
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
            </div>
          </div>

          {/* Horaires d'ouverture */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Horaires d'ouverture
            </h2>

            <div className="space-y-4">
              {DAYS.map((day) => (
                <div key={day.id} className="flex items-center gap-4">
                  <div className="w-32">
                    <span className="text-sm font-medium text-gray-700">
                      {day.name}
                    </span>
                  </div>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!formData.openingHours[day.id]?.closed}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        openingHours: {
                          ...prev.openingHours,
                          [day.id]: {
                            ...prev.openingHours[day.id],
                            closed: !e.target.checked
                          }
                        }
                      }))}
                      className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Ouvert</span>
                  </label>

                  {!formData.openingHours[day.id]?.closed && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={formData.openingHours[day.id]?.open || '09:00'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          openingHours: {
                            ...prev.openingHours,
                            [day.id]: {
                              ...prev.openingHours[day.id],
                              open: e.target.value
                            }
                          }
                        }))}
                        className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={formData.openingHours[day.id]?.close || '22:00'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          openingHours: {
                            ...prev.openingHours,
                            [day.id]: {
                              ...prev.openingHours[day.id],
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
    </AdminLayout>
  );
}