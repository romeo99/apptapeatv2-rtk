import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../../context/FavoritesContext';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import BottomNavigation from '../../components/layout/BottomNavigation';
import RestaurantCard from '../../components/user/RestaurantCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { isRestaurantOpen } from '../../utils/restaurantHours';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { favorites, loading: favoritesLoading } = useFavorites();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadFavoriteRestaurants = async () => {
      if (favoritesLoading) return;
      
      try {
        setLoading(true);
        if (favorites.length === 0) {
          setRestaurants([]);
          return;
        }

        const restaurantsRef = collection(db, 'restaurants');
        const q = query(restaurantsRef, where('__name__', 'in', favorites));
        const snapshot = await getDocs(q);

        const restaurantsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isOpen: doc.data().isOpen !== false && isRestaurantOpen(doc.data()),
          image: doc.data().coverImage || doc.data().logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&h=600',
          distance: 1000, // À remplacer par un calcul réel
          prepTime: '15-20'
        }));

        setRestaurants(restaurantsData);
      } catch (err) {
        console.error('Error loading favorite restaurants:', err);
        setError('Erreur lors du chargement des favoris');
      } finally {
        setLoading(false);
      }
    };

    loadFavoriteRestaurants();
  }, [favorites, favoritesLoading]);

  if (loading || favoritesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 pb-safe-with-nav">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold">Favoris</h1>
      </div>

      {/* Liste des restaurants favoris */}
      <div className="px-4 py-3">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        {restaurants.length > 0 ? (
          <div className="space-y-4">
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                variant="full-width"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Vous n'avez pas encore de favoris</p>
            <button
              onClick={() => navigate('/discover')}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium"
            >
              Découvrir des restaurants
            </button>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}