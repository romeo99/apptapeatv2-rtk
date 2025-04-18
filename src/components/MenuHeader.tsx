import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRestaurantContext } from '../context/RestaurantContext';

interface MenuHeaderProps {
  isFoodCourt?: boolean;
  restaurants?: Array<{
    id: string;
    name: string;
    logo: string;
  }>;
  onRestaurantSelect?: (restaurantId: string) => void;
}

export default function MenuHeader({ isFoodCourt, restaurants, onRestaurantSelect }: MenuHeaderProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { restaurant, themeColor } = useRestaurantContext();
  const [showRestaurants, setShowRestaurants] = useState(false);
  const foodCourtId = searchParams.get('foodCourtId');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Store foodCourtId in localStorage when it's present in URL
  useEffect(() => {
    if (foodCourtId) {
      try {
        localStorage.setItem('foodCourtId', foodCourtId);
      } catch (error) {
        console.error('Error storing food court ID:', error);
        localStorage.removeItem('foodCourtId');
      }
    } else {
      localStorage.removeItem('foodCourtId');
    }
  }, [foodCourtId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      /* if (showRestaurants) {
        setShowRestaurants(false);
      } */
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRestaurants(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRestaurants]);

  return (
    <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 mb-4">
      <div ref={dropdownRef} className="relative">
        {(isFoodCourt || foodCourtId) ? (
          <div className="px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRestaurants(!showRestaurants);
                }}
                className="flex-1 flex items-center justify-between py-2 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors relative group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img
                      src={restaurant?.logo || "https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png"}
                      alt={restaurant?.name || "Restaurant"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px] block">
                    {restaurant?.name || "Restaurant"}
                  </span>
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${showRestaurants ? 'rotate-180' : ''}`} />
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-gray-500 mb-0.5">Changer de restaurant</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></div>
                </div>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex flex-col items-center pointer-events-none">
                  <span className="text-[10px] text-gray-500 mb-0.5">Changer de restaurant</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ backgroundColor: themeColor }}></div>
                </div>
              </button>
            </div>

            {showRestaurants && restaurants && restaurants.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t mt-1 z-50 animate-slideDown">
                <div className="max-h-[60vh] overflow-y-auto">
                  {restaurants.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        onRestaurantSelect?.(r.id);
                        setShowRestaurants(false);
                      }}
                      className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors relative group"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={r.logo}
                          alt={r.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-medium block">{r.name}</span>
                        <span className="text-sm text-gray-500">Voir le menu</span>
                      </div>
                      <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-5 w-5 text-emerald-500" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white shadow-md overflow-hidden flex items-center justify-center flex-shrink-0 border border-emerald-500">
                  <img
                    src={restaurant?.logo || "https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png"}
                    alt={restaurant?.name || "Restaurant"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="font-medium">{restaurant?.name || "Restaurant"}</h1>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}