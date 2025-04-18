import { Heart } from 'lucide-react';
import { formatDistance } from '../../utils/formatters';

interface RestaurantListProps {
  searchQuery: string;
}

const MOCK_RESTAURANTS = [
  {
    id: '1',
    name: "Penelope's",
    type: 'Boulangerie',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&h=300',
    rating: 5.0,
    distance: 200,
    schedule: '17h40 - 18h00',
    originalPrice: 12.00,
    discountPrice: 3.99
  },
  {
    id: '2',
    name: 'Super Marché',
    type: 'Épicerie',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&h=300',
    rating: 4.8,
    distance: 550,
    schedule: '10h00 - 14h00',
    originalPrice: 12.00,
    discountPrice: 3.99
  }
];

export default function RestaurantList({ searchQuery }: RestaurantListProps) {
  const filteredRestaurants = MOCK_RESTAURANTS.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid gap-4">
      {filteredRestaurants.map((restaurant) => (
        <div 
          key={restaurant.id}
          className="bg-white rounded-xl overflow-hidden shadow-sm"
        >
          <div className="relative h-40">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Heart className="h-5 w-5 text-gray-400" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-lg">{restaurant.name}</h3>
                <p className="text-gray-500">{restaurant.type}</p>
              </div>
              <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                <span className="text-emerald-600 font-medium">{restaurant.rating}</span>
                <span className="text-yellow-400">★</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{formatDistance(restaurant.distance)}</span>
              <span>•</span>
              <span>À récupérer {restaurant.schedule}</span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-500 line-through">
                  {restaurant.originalPrice.toFixed(2)} €
                </span>
                <span className="ml-2 text-lg font-bold text-emerald-600">
                  {restaurant.discountPrice.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}