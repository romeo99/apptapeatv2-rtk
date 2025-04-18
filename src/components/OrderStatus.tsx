import { useEffect } from 'react';
import { useOrderContext } from '../context/OrderContext';

interface OrderStatusProps {
  orderId: string;
  onStatusChange?: (status: string) => void;
}

export default function OrderStatus({ orderId, onStatusChange }: OrderStatusProps) {
  const { orders } = useOrderContext();
  const order = orders.find(o => o.id === orderId);

  useEffect(() => {
    if (order?.status && onStatusChange) {
      onStatusChange(order.status);
    }
  }, [order?.status, onStatusChange]);

  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-blue-500';
      case 'preparing':
        return 'bg-purple-500';
      case 'ready':
        return 'bg-green-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'preparing':
        return 'En préparation';
      case 'ready':
        return 'Prête';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`}></div>
      <span className="text-sm font-medium">{getStatusText(order.status)}</span>
    </div>
  );
}