import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import BottomNavigation from '../../components/layout/BottomNavigation';
import OrderHistoryItem from '../../components/user/OrderHistoryItem';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/signin');
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to real-time updates for user's orders
    const ordersRef = collection(db, 'users', user.uid, 'orders');
    const q = query(
      ordersRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        }));
        setOrders(ordersData);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to orders:', err);
        setError('Une erreur est survenue lors du chargement de l\'historique');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated, navigate, user]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
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
        <h1 className="text-2xl font-bold">Historique</h1>
        {error && (
          <div className="mt-2 p-4 bg-red-50 text-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Liste des commandes */}
      <div className="px-4 py-4 space-y-4">
        {orders.map((order) => (
          <OrderHistoryItem 
            key={order.id} 
            order={order}
            showActions={true}
            handleReorder={() => {
              navigate(`/restaurant?restaurantId=${order.restaurantInfo.id}`);
            }}
          />
        ))}

        {!loading && orders.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">Aucune commande dans l'historique</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}