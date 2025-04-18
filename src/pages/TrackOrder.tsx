import { collection, doc, getDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { AlertCircle, CheckCircle, ChevronLeft, Clock, MapPin, Package, Receipt, UtensilsCrossed } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderSummary from '../components/OrderSummary';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import type { Order } from '../types/firebase';

// Définir les états de commande avec leurs icônes et descriptions
const ORDER_STATES = {
  'pending': {
    icon: Receipt,
    label: 'Commande reçue',
    description: 'Votre commande a été reçue par le restaurant'
  },
  'confirmed': {
    icon: CheckCircle,
    label: 'Confirmée',
    description: 'Le restaurant a confirmé votre commande'
  },
  'preparing': {
    icon: UtensilsCrossed,
    label: 'En préparation',
    description: 'Votre commande est en cours de préparation'
  },
  'ready': {
    icon: Package,
    label: 'Prête',
    description: 'Votre commande est prête !'
  },
  'cancelled': {
    icon: AlertCircle,
    label: 'Annulée',
    description: 'Votre commande a été annulée'
  },
  'awaiting_payment': {
    icon: Clock,
    label: 'Paiement en attente',
    description: 'En attente de confirmation du paiement'
  }
};

export default function TrackOrder() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusChanged, setStatusChanged] = useState(false);

  useEffect(() => {
    if (!orderId) {
      navigate('/menu');
      return;
    }

    // Try to get the order from all restaurants
    const getOrderRestaurant = async () => {
      try {
        setLoading(true);
        const restaurantsRef = collection(db, 'restaurants');
        const restaurantsSnapshot = await getDocs(restaurantsRef);

        for (const restaurantDoc of restaurantsSnapshot.docs) {
          const orderRef = doc(db, 'restaurants', restaurantDoc.id, 'orders', orderId);
          const orderDoc = await getDoc(orderRef);

          if (orderDoc.exists()) {
            setRestaurantId(restaurantDoc.id);
            break;
          }
        }
      } catch (err) {
        console.error('Error finding order:', err);
        setError('Erreur lors du chargement de la commande');
      } finally {
        setLoading(false);
      }
    };

    getOrderRestaurant();
  }, [orderId, navigate, user]);

  useEffect(() => {
    if (!orderId || !restaurantId || loading) return;

    // Subscribe to real-time updates from restaurant's orders
    const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId);
    const unsubscribe = onSnapshot(
      orderRef,
      (doc) => {
        if (doc.exists()) {
          const orderData = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
          } as Order;

          // Check if status changed
          if (order && order.status !== orderData.status) {
            setStatusChanged(true);
            setTimeout(() => setStatusChanged(false), 1000);
          }
          
          setOrder(orderData);
        } else {
          setError('Commande introuvable');
        }
      },
      (err) => {
        console.error('Error listening to order:', err);
        setError('Erreur lors du suivi de la commande');
      }
    );

    return () => unsubscribe();
  }, [orderId, restaurantId, loading, order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
          <p className="text-gray-500">{error || 'Commande introuvable'}</p>
        </div>
      </div>
    );
  }

  // Get current status info
  const currentStatus = order.status in ORDER_STATES ? order.status : 'pending';
  const StatusIcon = ORDER_STATES[currentStatus]?.icon || Receipt;
  const statusLabel = ORDER_STATES[currentStatus]?.label || 'Commande reçue';
  const statusDescription = ORDER_STATES[currentStatus]?.description || 'Votre commande a été reçue par le restaurant';

  // Determine the current step position (0 to 3)
  const getStepPosition = (status: string): number => {
    switch (status) {
      case 'confirmed': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'completed': return 3;
      case 'cancelled': return 4; // Special case
      default: return 0;
    }
  };

  const step = getStepPosition(currentStatus);
  const progressPercentage = step === 4 ? 0 : (step / 3) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="flex items-center p-4">
          <button
            onClick={() => navigate('/history')}
            className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="ml-4 text-xl font-semibold">Suivi de commande</h1>
        </div>
      </div>

      <div className="pt-20 px-4 pb-8">
        {order.status === 'cancelled' ? (
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-4xl font-bold text-red-500 mb-2">Commande refusée</h2>
            <p className="text-gray-600 mb-4">
              Votre commande a été refusée par le restaurant. Veuillez réessayer plus tard.
            </p>
            <button
              onClick={() => navigate('/menu')}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium"
            >
              Retour au menu
            </button>
          </div>
        ) : (
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
              <Receipt className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">#{order.orderNumber || orderId?.slice(-5)}</h2>
            <p className="text-gray-600 mb-4">Numéro de commande</p>
          </div>
        )}

        <div className="bg-white rounded-xl p-6 mb-6">
          {order.status !== 'completed' && (
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 text-emerald-500">
                <MapPin className="h-4 w-4" />
                <span>{order.type === 'dine_in' ? 'Sur place' : order.type === 'takeaway' ? 'À emporter' : 'Livraison'}</span>
              </div>
              {order.scheduledTime && (
                <div className="flex items-center justify-center gap-2 mt-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(order.scheduledTime.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })} à {order.scheduledTime.time}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* État actuel de la commande - animé */}
          <div className="bg-gray-50 p-6 rounded-xl mb-6">
            {/* Barre de progression */}
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-8">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className={`text-center transition-all duration-500 ${statusChanged ? 'scale-110' : 'scale-100'}`}>
              <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <StatusIcon className={`h-8 w-8 text-emerald-500 ${statusChanged ? 'animate-bounce' : ''}`} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${statusChanged ? 'text-emerald-500' : 'text-gray-900'}`}>{statusLabel}</h3>
              <p className="text-gray-600">{statusDescription}</p>
            </div>

            {/* Étapes de suivi simplifiées */}
            <div className="flex justify-between items-center mt-8">
              <div className="flex-1 text-center">
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${step >= 0 ? 'bg-emerald-500 text-white' : 'bg-gray-200'}`}>
                  <Receipt className="h-4 w-4" />
                </div>
                <span className="text-xs mt-1 block">Reçue</span>
              </div>
              <div className="w-full h-1 bg-gray-200">
                <div className={`h-full bg-emerald-500 transition-all duration-700 ${step >= 1 ? 'w-full' : 'w-0'}`}></div>
              </div>
              <div className="flex-1 text-center">
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${step >= 1 ? 'bg-emerald-500 text-white' : 'bg-gray-200'}`}>
                  <CheckCircle className="h-4 w-4" />
                </div>
                <span className="text-xs mt-1 block">Confirmée</span>
              </div>
              <div className="w-full h-1 bg-gray-200">
                <div className={`h-full bg-emerald-500 transition-all duration-700 ${step >= 2 ? 'w-full' : 'w-0'}`}></div>
              </div>
              <div className="flex-1 text-center">
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${step >= 2 ? 'bg-emerald-500 text-white' : 'bg-gray-200'}`}>
                  <UtensilsCrossed className="h-4 w-4" />
                </div>
                <span className="text-xs mt-1 block">Préparation</span>
              </div>
              <div className="w-full h-1 bg-gray-200">
                <div className={`h-full bg-emerald-500 transition-all duration-700 ${step >= 3 ? 'w-full' : 'w-0'}`}></div>
              </div>
              <div className="flex-1 text-center">
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${step >= 3 ? 'bg-emerald-500 text-white' : 'bg-gray-200'}`}>
                  <Package className="h-4 w-4" />
                </div>
                <span className="text-xs mt-1 block">Prête</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-gray-400" />
            <span className="text-gray-600">
              Temps de préparation estimé: 15-20 minutes
            </span>
          </div>
        </div>

        <OrderSummary
          items={order.items}
          subtotal={order.subtotal}
          serviceFees={order.total - order.subtotal}
          total={order.total}
        />
      </div>
    </div>
  );
}