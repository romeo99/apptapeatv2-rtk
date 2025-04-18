import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

interface DeliveryNotificationProps {
  order: any;
  onAccept: () => void;
  onDecline: () => void;
}

export default function DeliveryNotification({ order, onAccept, onDecline }: DeliveryNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Jouer un son de notification
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {});

    // Auto-hide après 30 secondes
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-50 animate-slide-in">
      <div className="bg-white rounded-xl shadow-lg p-4 border border-emerald-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Bell className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium mb-1">Nouvelle commande disponible !</h3>
            <p className="text-sm text-gray-500 mb-3">
              {order.delivery?.address}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-medium text-emerald-600">
                {order.deliveryFee?.toFixed(2)} €
              </span>
              <div className="flex gap-2">
                <button
                  onClick={onDecline}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Ignorer
                </button>
                <button
                  onClick={onAccept}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600"
                >
                  Accepter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}