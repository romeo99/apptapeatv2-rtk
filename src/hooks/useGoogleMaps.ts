import { useEffect, useState } from 'react';

const GOOGLE_MAPS_API_KEY = "AIzaSyBi3DoK4uEJmMfyjnSCLoQ_hxIv-h-Cbf4";

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If the script is already loaded
    if (window.google) {
      setIsLoaded(true);
      return;
    }

    // If the script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      existingScript.addEventListener('error', () => setError('Failed to load Google Maps'));
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.addEventListener('load', () => setIsLoaded(true));
    script.addEventListener('error', () => setError('Failed to load Google Maps'));

    document.head.appendChild(script);

    return () => {
      // Cleanup if component unmounts during loading
      script.removeEventListener('load', () => setIsLoaded(true));
      script.removeEventListener('error', () => setError('Failed to load Google Maps'));
    };
  }, []);

  return { isLoaded, error };
}