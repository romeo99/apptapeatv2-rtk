import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UnauthenticatedProfile() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&h=1200')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col">
        <div className="relative flex-1 flex flex-col">
          <img
            src="https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png"
            alt="TapEat"
            className="w-48 mx-auto mt-safe brightness-0 invert"
          />

          <button
            onClick={() => navigate(-1)}
            className="absolute top-1 left-4 z-50 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
            <h1 className="text-4xl font-bold mb-4">
              <span className="text-white">Scanner, </span>
              <span className="text-emerald-400">Commander, </span>
              <span className="text-white">Profiter !</span>
            </h1>
            <p className="text-lg mb-8 max-w-md">
              Scannez simplement le QR code du restaurant et voilà ! Accédez instantanément aux menus
            </p>

            <div className="w-full max-w-xs space-y-4">
              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium"
              >
                S'inscrire
              </button>
              <button
                onClick={() => navigate('/signin')}
                className="w-full bg-white text-gray-900 py-3 rounded-xl font-medium"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}