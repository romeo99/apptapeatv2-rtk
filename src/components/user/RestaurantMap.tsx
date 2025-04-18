import { GoogleMap, InfoWindowF, MarkerF, useLoadScript } from '@react-google-maps/api';
import { ChevronRight, Crosshair, MapPin, Minus, Plus, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatLogoUrlForMarker } from '../../utils/formatters';
import LoadingSpinner from '../LoadingSpinner';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBi3DoK4uEJmMfyjnSCLoQ_hxIv-h-Cbf4';

interface Restaurant {
  id: string;
  name: string;
  type: string;
  image: string;
  rating: number;
  distance: number;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  logo?: string;
}

interface RestaurantMapProps {
  restaurants: Restaurant[];
  userLocation: { lat: number; lng: number };
  onRestaurantClick?: (restaurant: Restaurant) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultOptions = {
  disableDefaultUI: true,
  zoom: 15,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    }
  ],
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false
};

export default function RestaurantMap({ restaurants, userLocation, onRestaurantClick }: RestaurantMapProps) {
  const navigate = useNavigate();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const mapRef = useRef<google.maps.Map>();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  useEffect(() => {
    if (mapRef.current) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(userLocation);

      const radius = 0.02;
      bounds.extend({ lat: userLocation.lat + radius, lng: userLocation.lng + radius });
      bounds.extend({ lat: userLocation.lat - radius, lng: userLocation.lng - radius });

      mapRef.current.fitBounds(bounds);

      const listener = google.maps.event.addListener(mapRef.current, 'idle', () => {
        if (mapRef.current && mapRef.current.getZoom() > 14) {
          mapRef.current.setZoom(14);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [userLocation]);

  if (loadError) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
        <p className="text-red-500">Erreur de chargement de la carte</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Map controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom() || 15) + 1)}
            className="p-3 hover:bg-gray-50 border-b w-12 h-12 flex items-center justify-center"
          >
            <Plus className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom() || 15) - 1)}
            className="p-3 hover:bg-gray-50 w-12 h-12 flex items-center justify-center"
          >
            <Minus className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.panTo(userLocation);
              mapRef.current.setZoom(15);
            }
          }}
          className="w-12 h-12 bg-white rounded-lg shadow-lg hover:bg-gray-50 flex items-center justify-center"
        >
          <Crosshair className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={15}
        center={userLocation}
        options={defaultOptions}
        onLoad={(map) => { mapRef.current = map; }}
      >
        {/* User location marker */}
        <MarkerF
          position={userLocation}
          icon={{
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#10B981"/>
                <circle cx="12" cy="12" r="6" fill="white"/>
                <circle cx="12" cy="12" r="4" fill="#10B981"/>
              </svg>
            `)}`,
            anchor: new google.maps.Point(12, 12),
            scaledSize: new google.maps.Size(24, 24)
          }}
          zIndex={2}
        />

        {/* Restaurant markers */}
        {restaurants.map(restaurant => {

          return (
            <MarkerF
              key={restaurant.id}
              position={restaurant.location}
              title={restaurant.name}
              onClick={() => setSelectedRestaurant(restaurant)}
              options={{
                icon: {
                  url: formatLogoUrlForMarker(restaurant.id),
                  anchor: new google.maps.Point(20, 20),
                  scaledSize: new google.maps.Size(40, 40),
                },
                optimized: true,
                zIndex: 1
              }}
            />
          )
        })}

        {/* Info window for selected restaurant */}
        {selectedRestaurant && (
          <InfoWindowF
            position={selectedRestaurant.location}
            onCloseClick={() => setSelectedRestaurant(null)}
            options={{
              pixelOffset: new google.maps.Size(0, -20),
              maxWidth: 280,
              disableAutoPan: false
            }}
          >
            <div className="overflow-hidden rounded-xl bg-white shadow-lg">
              <img
                src={selectedRestaurant.image}
                alt={selectedRestaurant.name}
                className="w-full h-28 object-cover"
              />
              <div className="p-3">
                <h3 className="font-bold text-base mb-1 line-clamp-1">{selectedRestaurant.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium">{selectedRestaurant.rating}</span>
                    <span className="text-xs text-gray-500">(500+ avis)</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-gray-500">15-20 min</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="line-clamp-1 text-[11px]">{selectedRestaurant.address}</span>
                </div>
                <button
                  onClick={() => navigate(`/restaurant?restaurantId=${selectedRestaurant.id}`)}
                  className="w-full bg-emerald-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1"
                >
                  <span>Voir le menu</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
}