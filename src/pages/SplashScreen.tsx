import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/restaurant?restaurantId=default-restaurant');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-emerald-500 flex flex-col items-center justify-center p-4">
      <div className="w-64 mb-8 animate-pulse">
        <img
          src="https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png"
          alt="TapEAT"
          className="w-full h-auto brightness-0 invert" // Ajout des filtres pour rendre le logo blanc
        />
      </div>

      <div className="text-white text-center">
        <h1 className="text-2xl font-bold mb-2">Powered by TapEAT</h1>
        <p className="text-lg opacity-90">La borne nouvelle génération</p>
      </div>

      <div className="mt-8">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}