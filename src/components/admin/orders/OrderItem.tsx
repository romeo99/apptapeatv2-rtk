import { Bike, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { Order } from '../../../types/firebase';

interface OrderItemProps {
  order: Order;
  expandedOrder: string | null;
  toggleOrderExpansion: (orderId: string) => void;
  printOrder: (order: Order) => void;
  newOrders: string[];
  children?: React.ReactNode;
}

const orderTypeIcons = {
  dine_in: { icon: UtensilsCrossed, label: 'Sur place' },
  takeaway: { icon: ShoppingBag, label: 'À emporter' },
  delivery: { icon: Bike, label: 'Livraison' }
};

export default function OrderItem({
  order,
  expandedOrder,
  toggleOrderExpansion,
  printOrder,
  newOrders,
  children
}: OrderItemProps) {
  return (
    <div
      id={`order-${order.id}`}
      className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 ${newOrders.includes(order.id) ? 'animate-pulse-emerald' : ''
        }`}
    >
      <div className="p-4 cursor-pointer" onClick={() => toggleOrderExpansion(order.id)}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
              {(() => {
                const TypeIcon = orderTypeIcons[order.type as keyof typeof orderTypeIcons]?.icon;
                return TypeIcon ? <TypeIcon className="h-5 w-5 text-emerald-600" /> : null;
              })()}
            </div>
            <div>
              <div className="flex items-start gap-2">
                <span className="text-lg font-semibold">
                  {order.orderNumber}
                  {typeof order.deliveryFee !== 'undefined' && (
                    <>
                      {' - '}
                      {order.deliveryStatus === 'pending'
                        ? "En attente d'un livreur"
                        : order.deliveryStatus === 'delivering'
                          ? 'Un livreur est en route'
                          : order.deliveryStatus === 'cancelled'
                            ? 'Le livreur a annulé'
                            : order.deliveryStatus === 'delivered'
                              ? 'Commande livrée'
                              : ''}
                    </>
                  )}
                </span>
                {order.items.some(item => item.remarks) && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    Remarques client
                  </span>
                )}
                {order.type === 'dine_in' && order.table ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                    {order.table === 'caisse' ? 'Caisse' : `Table ${order.table}`}
                  </span>
                ) : null}
                {order.paymentStatus === 'paid' && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Payé
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  {orderTypeIcons[order.type as keyof typeof orderTypeIcons]?.label}
                </div>
                {order.customerName && <div className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                  Client: {order.customerName}
                </div>}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end min-w-[120px] text-right">
            <span className="text-lg font-semibold text-emerald-600 mb-1">{order.total.toFixed(2)} €</span>
            <span className="text-sm text-gray-500">
              {order.status === 'scheduled' && order.scheduledTime?.date && order.scheduledTime?.time ?
                `${order.scheduledTime.date.split('-').reverse().join('-')} à ${order.scheduledTime.time}` :
                new Date(order.createdAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
            </span>
            <div className="flex items-center justify-end gap-2 mt-1">
              {order.paymentMethod === 'cash' && order.paymentStatus === 'pending' && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                  À encaisser
                </span>
              )}
            </div>
            <div
              className="flex items-center justify-end gap-2 mt-1"
              onClick={(e) => {
                e.stopPropagation();
                printOrder(order);
              }}
            >
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 cursor-pointer">
                Imprimer le ticket
              </span>
            </div>
          </div>
        </div>

        {expandedOrder === order.id && children}
      </div>
    </div>
  );
}