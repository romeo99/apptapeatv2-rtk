import { DirectionsRenderer, DirectionsService, GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useCallback, useState } from 'react';
import LoadingSpinner from '../LoadingSpinner';

const GOOGLE_MAPS_API_KEY = "AIzaSyBi3DoK4uEJmMfyjnSCLoQ_hxIv-h-Cbf4";

interface DeliveryMapProps {
  origin: string;
  destination: string;
  isPickup: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '12px'
};

const defaultCenter = {
  lat: 43.2965,  // Marseille coordinates
  lng: 5.3698
};

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

export default function DeliveryMap({ origin, destination, isPickup }: DeliveryMapProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries
  });

  const directionsCallback = useCallback((result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
    if (status === 'OK') {
      setDirections(result);
    } else {
      console.error('Directions request failed:', status);
    }
  }, []);

  if (loadError) {
    return (
      <div className="h-[300px] bg-gray-100 rounded-xl flex items-center justify-center">
        <p className="text-red-500">Erreur de chargement de la carte</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[300px] bg-gray-100 rounded-xl flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={13}
      center={defaultCenter}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      {/* Request directions */}
      <DirectionsService
        options={{
          origin: isPickup ? origin : destination,
          destination: isPickup ? destination : origin,
          travelMode: google.maps.TravelMode.DRIVING,
        }}
        callback={directionsCallback}
      />

      {/* Render directions */}
      {directions && (
        <DirectionsRenderer
          options={{
            directions: directions,
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: '#10B981',
              strokeWeight: 5,
            },
          }}
        />
      )}
    </GoogleMap>
  );
}