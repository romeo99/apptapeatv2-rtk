import { useEffect, useState } from 'react';

export const useUserLocation = () => {
    const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
    const [locationError, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError("La géolocalisation n'est pas supportée par ce navigateur.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation(position.coords);
            },
            (err) => {
                setError("Impossible d'obtenir la localisation : " + err.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }, []);

    return { location, locationError };
};
