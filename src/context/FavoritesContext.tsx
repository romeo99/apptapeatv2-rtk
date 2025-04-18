import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../config/firebase';
import { addToFavorites, removeFromFavorites, getFavorites } from '../services/favoriteService';

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (restaurantId: string) => void;
  isFavorite: (restaurantId: string) => boolean;
  loading: boolean;
  error: string | null;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userFavorites = await getFavorites();
          setFavorites(userFavorites);
        } catch (err) {
          console.error('Error loading favorites:', err);
          setError('Erreur lors du chargement des favoris');
        }
      } else {
        setFavorites([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleFavorite = async (restaurantId: string) => {
    try {
      if (!auth.currentUser) {
        // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
        window.location.href = '/signin';
        return;
      }

      if (favorites.includes(restaurantId)) {
        await removeFromFavorites(restaurantId);
        setFavorites(prev => prev.filter(id => id !== restaurantId));
      } else {
        await addToFavorites(restaurantId);
        setFavorites(prev => [...prev, restaurantId]);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Erreur lors de la mise à jour des favoris');
    }
  };

  const isFavorite = (restaurantId: string) => {
    return favorites.includes(restaurantId);
  };

  return (
    <FavoritesContext.Provider value={{ 
      favorites, 
      toggleFavorite, 
      isFavorite,
      loading,
      error
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}