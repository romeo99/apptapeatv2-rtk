import { useLoadScript } from '@react-google-maps/api';
import { ChevronLeft, Loader2, MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerRestaurant } from '../../services/authService';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBi3DoK4uEJmMfyjnSCLoQ_hxIv-h-Cbf4';

export default function RestaurantRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const [formData, setFormData] = useState(() => {
    try {
      // Get saved registration data and password
      const savedData = localStorage.getItem('registrationData');
      const savedPassword = localStorage.getItem('tempPassword');

      if (!savedPassword) {
        throw new Error('Password is required');
      }

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        return {
          name: parsedData.name || '',
          address: parsedData.address || '',
          phone: parsedData.phone || '',
          email: parsedData.email || '',
          password: savedPassword
        };
      }
    } catch (err) {
      console.error('Error loading saved registration data:', err);
    }

    return {
      name: '',
      address: '',
      phone: '',
      email: '',
      password: ''
    };
  });

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
            address: place.formatted_address
          }));
        }
      });
    }
  }, [isLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      await registerRestaurant(formData);

      // Clear temporary data
      localStorage.removeItem('registrationData');
      localStorage.removeItem('tempPassword');

      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error registering restaurant:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 p-2 hover:bg-gray-100 rounded-lg inline-flex items-center"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="ml-1">Retour</span>
        </button>

        <h1 className="text-2xl font-bold text-center mb-8">Inscription Restaurant</h1>

        <div className="mt-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
              <div className="relative">
                <input
                  ref={addressInputRef}
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Entrez l'adresse du restaurant"
                  required
                />
                <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {loading ? 'Inscription en cours...' : 'Créer mon compte'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}