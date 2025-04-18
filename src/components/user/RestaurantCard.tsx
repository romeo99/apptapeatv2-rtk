import { Heart, Clock, User2 } from 'lucide-react';
import { formatDistance } from '../../utils/formatters';
import { useFavorites } from '../../context/FavoritesContext';
import { useNavigate } from 'react-router-dom';

interface RestaurantCardProps {
  restaurant: {
    id: string;
    name: string;
    type: string;
    image: string;
    rating: number;
    distance: number;
    prepTime: number;
    duration: string;
    isOpen: boolean;
  };
  variant?: 'default' | 'full-width';
}

export default function RestaurantCard({ restaurant, variant = 'default' }: RestaurantCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const favorite = isFavorite(restaurant.id);
  const isOpen = restaurant.isOpen;

  if (variant === 'full-width') {
    return (
      <div 
        onClick={() => isOpen && navigate(`/restaurant?restaurantId=${restaurant.id}`)}
        className={`bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 w-full ${
          isOpen ? 'hover:shadow-[0_8px_16px_rgba(0,0,0,0.12)] cursor-pointer hover:scale-[1.01]' : ''
        }`}
      >
        <div className="flex">
          <div className="w-32 h-32 flex-shrink-0 relative">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-full object-cover bg-gray-100"
            />
            {!isOpen && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-medium text-sm">Fermé</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 mr-4">
                <h3 className="text-[17px] font-bold">{restaurant.name}</h3>
                <p className="text-xs text-gray-500">{restaurant.type}</p>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <User2 className="h-4 w-4 text-gray-400" />
                    <span className="text-[15px] font-medium whitespace-nowrap">{restaurant.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-[15px] font-medium whitespace-nowrap">{restaurant.prepTime} min</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                  <span className="text-emerald-600 font-medium text-[15px]">{restaurant.rating}</span>
                  <span className="text-yellow-400 text-[15px]">★</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(restaurant.id);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Heart 
                    className={`h-5 w-5 ${
                      favorite ? 'text-red-500 fill-red-500' : 'text-gray-400'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => isOpen && navigate(`/restaurant?restaurantId=${restaurant.id}`)}
      className={`bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 w-[260px] relative h-[200px] ${
        isOpen ? 'hover:shadow-[0_8px_16px_rgba(0,0,0,0.12)] cursor-pointer hover:scale-[1.01]' : ''
      }`}
    >
      <div className="h-28 relative">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        {!isOpen && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-black/75 text-white font-medium text-sm px-3 py-1 rounded-full">Fermé</span>
          </div>
        )}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(restaurant.id);
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
        >
          <Heart 
            className={`h-4 w-4 ${
              favorite ? 'text-red-500 fill-red-500' : 'text-gray-400'
            }`} 
          />
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-[15px] truncate max-w-[180px]">{restaurant.name}</h3>
            <p className="text-xs text-gray-500">{restaurant.type}</p>
            <div className="flex items-center gap-3 text-[13px] text-gray-500 mt-2">
              <div className="flex items-center gap-1">
                <User2 className="h-4 w-4 text-gray-400" />
                <span className="whitespace-nowrap">{restaurant.duration}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="whitespace-nowrap">{restaurant.prepTime} min</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
            <span className="text-emerald-600 font-medium text-[15px]">{restaurant.rating}</span>
            <span className="text-yellow-400 text-[15px]">★</span>
          </div>
        </div>
      </div>
    </div>
  );
}