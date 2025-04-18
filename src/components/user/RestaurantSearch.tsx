import { useState, useEffect } from 'react';
import { Search, MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { formatDistance } from '../../utils/formatters';

interface Restaurant {
  id: string;
  name: string;
  image: string;
  type: string;
  rating: number;
  distance: number;
  address: string;
}

export default function RestaurantSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchRestaurants = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const restaurantsRef = collection(db, 'restaurants');
        const q = query(restaurantsRef, orderBy('name'));
        
        const snapshot = await getDocs(q);
        let restaurants = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          image: doc.data().coverImage || doc.data().logo || 'https://via.placeholder.com/400x300?text=Restaurant'
        })) as Restaurant[];

        // Filter restaurants by name
        restaurants = restaurants.filter(restaurant => 
          restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setResults(restaurants);
      } catch (error) {
        console.error('Error searching restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchRestaurants, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un restaurant..."
          className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          autoComplete="off"
        />
        <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
      </div>

      {searchQuery.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg max-h-[60vh] overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Recherche en cours...
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y">
              {results.map((restaurant) => (
                <button
                  key={restaurant.id}
                  onClick={() => navigate(`/restaurant?restaurantId=${restaurant.id}`)}
                  className="w-full p-4 hover:bg-gray-50 flex items-start gap-4 text-left"
                >
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">{restaurant.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium">{restaurant.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{restaurant.address}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Aucun restaurant trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
}