import { useLoadScript } from '@react-google-maps/api';
import { ChevronDown, MapPin, Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAddressFromCoords } from '../../services/restaurantService';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBi3DoK4uEJmMfyjnSCLoQ_hxIv-h-Cbf4';

interface LocationSelectorProps {
  currentLocation: string;
  onLocationChange: (location: { lat: number; lng: number; address: string }) => void;
}

export default function LocationSelector({ currentLocation, onLocationChange }: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'FR' },
      fields: ['formatted_address', 'geometry', 'name']
    });

    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.geometry?.location && place.formatted_address) {
        onLocationChange({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address
        });
        setIsOpen(false);
        setSearchValue('');
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [isLoaded, onLocationChange]);

  const getCurrentPosition = useCallback(async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;
      const address = await getAddressFromCoords(lat, lng);

      onLocationChange({ lat, lng, address });
      setIsOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error getting current position:', error);
      setError('Impossible d\'obtenir votre position actuelle');
    }
  }, [onLocationChange]);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    if (!value.trim()) {
      setPredictions([]);
      return;
    }

    // Get predictions from Places Service
    const service = new google.maps.places.AutocompleteService();
    service.getPlacePredictions({
      input: value,
      componentRestrictions: { country: 'FR' },
      types: ['address']
    }, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        setPredictions(predictions);
      } else {
        setPredictions([]);
      }
    });
  };

  const handlePredictionSelect = async (prediction: google.maps.places.AutocompletePrediction) => {
    try {
      setError(null);
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ placeId: prediction.place_id });

      if (result.results[0]?.geometry?.location) {
        const location = result.results[0].geometry.location;
        onLocationChange({
          lat: location.lat(),
          lng: location.lng(),
          address: prediction.description
        });
        setIsOpen(false);
        setSearchValue('');
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
      setError('Erreur lors de la récupération des coordonnées');
    }
  };

  const handleManualSearch = async () => {
    if (!searchValue.trim()) return;

    try {
      setError(null);
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address: searchValue });

      if (result.results[0]?.geometry?.location) {
        const location = result.results[0].geometry.location;
        onLocationChange({
          lat: location.lat(),
          lng: location.lng(),
          address: result.results[0].formatted_address
        });
        setIsOpen(false);
        setSearchValue('');
        setPredictions([]);
      } else {
        setError('Adresse non trouvée');
      }
    } catch (error) {
      console.error('Error searching address:', error);
      setError('Erreur lors de la recherche de l\'adresse');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col items-start py-1"
      >
        <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
          <span>Position</span>
          <ChevronDown className="h-4 w-4" />
        </div>
        <span className="text-sm text-gray-500 mt-0.5 line-clamp-1">{currentLocation}</span>
      </button>
      {isOpen && (
        <div className="fixed inset-x-4 top-24 bg-white rounded-xl shadow-xl p-6 z-50 max-w-2xl mx-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}
          <div className="relative mb-6">
            <input
              ref={inputRef}
              type="text"
              placeholder="Rechercher une adresse..."
              value={searchValue}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            {searchValue && (
              <button
                onClick={() => {
                  setSearchValue('');
                  setPredictions([]);
                }}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Suggestions d'adresses */}
          {predictions.length > 0 && (
            <div className="mb-6 space-y-1">
              {predictions.map((prediction) => (
                <button
                  key={prediction.place_id}
                  onClick={() => handlePredictionSelect(prediction)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <p className="text-sm font-medium">{prediction.structured_formatting.main_text}</p>
                  <p className="text-xs text-gray-500">{prediction.structured_formatting.secondary_text}</p>
                </button>
              ))}
            </div>
          )}

          {/* Bouton de recherche manuelle */}
          {searchValue && predictions.length === 0 && (
            <button
              onClick={handleManualSearch}
              className="w-full px-4 py-3 bg-emerald-500 text-white rounded-xl mb-6 font-medium"
            >
              Rechercher cette adresse
            </button>
          )}

          <div className="border-t pt-6">
            <button
              onClick={getCurrentPosition}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <MapPin className="h-5 w-5 text-emerald-500" />
              <span className="font-medium">Utiliser ma position actuelle</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}