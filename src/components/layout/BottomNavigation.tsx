import { useLocation, useNavigate } from 'react-router-dom';
import { Compass, Heart, History, User2, QrCode, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isActive = (path: string) => {
    if (path === '/discover' && location.pathname === '/') {
      return true;
    }
    return location.pathname === path;
  };

  const navItems = [
    { path: '/discover', icon: Compass, label: 'Découvrir' },
    { path: '/favourites', icon: Heart, label: 'Favoris' },
    { path: '/scan', icon: QrCode, label: 'Scanner', primary: true },
    { path: '/history', icon: History, label: 'Historique' },
    { path: '/profile', icon: User2, label: 'Profil' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 pb-safe" style={{ height: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      <div className="flex items-center justify-between px-6 h-20">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center ${
              isActive(item.path) ? 'text-black' : 'text-gray-400'
            }`}
          >
            {item.primary ? (
              <div className="w-16 h-16 -mt-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <item.icon className="h-8 w-8 text-white" />
              </div>
            ) : item.path === '/profile' ? (
              user?.photoURL ? (
                <div className="w-6 h-6 rounded-full overflow-hidden">
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || "Profile"} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <User2 className="h-6 w-6" />
              )
            ) : (
              <item.icon className="h-6 w-6" />
            )}
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}