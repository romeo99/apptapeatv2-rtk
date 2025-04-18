import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Bike, ShoppingBag, Star, UtensilsCrossed } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { useCart } from '../../context/CartContext';
import RatingModal from '../RatingModal';

const orderTypeIcons = {
  dine_in: { icon: UtensilsCrossed, label: 'Sur place' },
  takeaway: { icon: ShoppingBag, label: 'À emporter' },
  delivery: { icon: Bike, label: 'Livraison' }
};

export interface RestaurantInfo {
  name: string;
  logo: string;
  id: string;
  googleUrl?: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
  menuOptions?: {
    drink?: string;
    side?: string;
  };
  excludedIngredients?: string[];
}

interface OrderHistoryItemProps {
  order: {
    id: string;
    orderNumber: string;
    type: 'dine_in' | 'takeaway' | 'delivery';
    status: string;
    restaurantInfo: RestaurantInfo;
    items: OrderItem[];
    total: number;
    subtotal: number;
    tax: number;
    createdAt: Date;
  };
  hasReviewed?: boolean;
  handleReorder?: (e: React.MouseEvent) => void;
  showActions?: boolean;
}

export default function OrderHistoryItem({ order, hasReviewed, handleReorder, showActions = false }: OrderHistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const { addItems } = useCart();
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!order.id || !order.restaurantInfo?.id) return;

    // Subscribe to order updates
    const orderRef = doc(db, 'restaurants', order.restaurantInfo.id, 'orders', order.id);
    const unsubscribe = onSnapshot(orderRef, (doc) => {
      if (doc.exists()) {
        setCurrentStatus(doc.data().status);
      }
    });

    return () => unsubscribe();
  }, [order.id, order.restaurantInfo?.id]);

  const handleClick = () => {
    navigate(`/track-order/${order.id}`, { state: { order } });
  };

  const handleReorderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Add restaurantId to each item
      const itemsWithRestaurantId = order.items.map(item => ({
        ...item,
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        menuOptions: item.menuOptions,
        excludedIngredients: item.excludedIngredients,
        restaurantId: order.restaurantInfo.id // Add restaurant ID from order info
      }));

      // Add items to cart
      addItems(itemsWithRestaurantId);

      // Navigate to restaurant menu
      navigate(`/restaurant?restaurantId=${order.restaurantInfo.id}`);
    } catch (err) {
      console.error('Error reordering:', err);
      setError('Une erreur est survenue lors de la commande');
    }
  };

  const toggleExpansion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-all"
    >
      {error && (
        <div className="p-4 bg-red-50 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="p-4">
        {/* Restaurant Info & Order Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img
              src={order.restaurantInfo?.logo || "https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png"}
              alt={order.restaurantInfo?.name || "Restaurant"}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <h3 className="font-medium text-gray-900">{order.restaurantInfo?.name || "Restaurant"}</h3>
              <span className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-emerald-600">{order.total.toFixed(2)} €</p>
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
              {(() => {
                const TypeIcon = orderTypeIcons[order.type as keyof typeof orderTypeIcons]?.icon;
                return TypeIcon && <TypeIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />;
              })()}
              <span className="text-xs text-gray-600 whitespace-nowrap">
                {orderTypeIcons[order.type as keyof typeof orderTypeIcons]?.label}
              </span>
            </div>
          </div>
        </div>

        {/* Order Number & Status */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-medium">#{order.orderNumber}</span>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
            currentStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' :
              currentStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
              currentStatus === 'preparing' ? 'bg-orange-100 text-orange-700' :
              currentStatus === 'ready' ? 'bg-green-100 text-green-700' :
              currentStatus === 'scheduled' ? 'bg-blue-100 text-blue-700' :
              currentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
          }`}>
            {currentStatus === 'scheduled' ? 'Programmée' :
              currentStatus === 'completed' ? 'Terminée' :
              currentStatus === 'cancelled' ? 'Annulée' :
                currentStatus === 'pending' ? 'En attente' :
                  currentStatus === 'preparing' ? 'En préparation' :
                    currentStatus === 'ready' ? 'Prête' :
                      currentStatus}
          </span>
        </div>

        {/* Order Details (Expanded) */}
        {isExpanded && (
          <div className="mt-3 space-y-3 border-t pt-3">
            <div className="space-y-2">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.quantity}x {item.name}</span>
                      <span>{(item.price * item.quantity).toFixed(2)} €</span>
                    </div>
                    {item.menuOptions && (
                      <div className="text-sm text-gray-500">
                        {item.menuOptions.drink && (
                          <span>Boisson : {item.menuOptions.drink}</span>
                        )}
                        {item.menuOptions.side && (
                          <span>{item.menuOptions.drink ? ' • ' : ''}Accompagnement : {item.menuOptions.side}</span>
                        )}
                      </div>
                    )}
                    {item.excludedIngredients?.length > 0 && (
                      <div className="text-sm text-red-500">
                        Sans : {item.excludedIngredients.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2 mt-3 pt-3 border-t">
            {currentStatus === 'completed' && !hasReviewed && (
              <div className="flex gap-2 w-full">
                <a
                  href={order.restaurantInfo?.googleUrl}
                  onClick={async (e) => {
                    e.stopPropagation();
                    // Get fresh restaurant data to ensure we have the latest googleUrl
                    const restaurantRef = doc(db, 'restaurants', order.restaurantInfo.id);
                    const restaurantDoc = await getDoc(restaurantRef);
                    const googleUrl = restaurantDoc.data()?.googleUrl;

                    if (!googleUrl) {
                      alert('Le restaurant n\'a pas encore fourni de lien pour les avis');
                      return;
                    }
                    window.open(googleUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="flex-1 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                >
                  <Star className="h-4 w-4" />
                  Noter
                </a>
                <button
                  onClick={handleReorderClick}
                  className="flex-1 px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  Commander à nouveau
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal
          orderId={order.id}
          restaurantId={order.restaurantInfo.id}
          onClose={() => setShowRatingModal(false)}
          onSubmit={async (rating: number, comment: string) => {
            // Handle rating submission
            setShowRatingModal(false);
          }}
        />
      )}
    </div>
  );
}