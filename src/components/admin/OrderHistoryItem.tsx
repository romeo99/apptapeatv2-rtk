import { Bike, ChevronDown, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import useOrderNotification from '../../hooks/useOrderNotification';
import type { Order } from '../../types/firebase';
import Receipt from '../Receipt';

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

interface OrderHistoryItemProps {
  order: Order;
}

export default function OrderHistoryItem({ order }: OrderHistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { contentRef, orderToPrint, setOrderToPrint, handlePrint } = useOrderNotification();

  const printOrder = (order: Order) => {
    setOrderToPrint(order);
    setTimeout(() => {
      handlePrint(); // Lancer l'impression
      setOrderToPrint(null);
    }, 2000);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <span className="text-sm text-gray-500">Commande #{order.orderNumber}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-medium">{(Number(order.total) || 0).toFixed(2)} €</span>
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                {order.type === 'dine_in' && <UtensilsCrossed className="h-4 w-4 text-gray-600" />}
                {order.type === 'takeaway' && <ShoppingBag className="h-4 w-4 text-gray-600" />}
                {order.type === 'delivery' && <Bike className="h-4 w-4 text-gray-600" />}
                <span className="text-xs text-gray-600">
                  {order.type === 'dine_in' ? 'Sur place' :
                    order.type === 'takeaway' ? 'À emporter' : 'Livraison'}
                </span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]
                }`}>
                {order.status === 'completed' ? 'Terminée' : 'Annulée'}
              </span>
              {order.paymentMethod === 'cash' && order.paymentStatus === 'pending' && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                  À encaisser
                </span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-white-800" onClick={() => {
                printOrder(order)
              }}>
                Imprimer le ticket
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'transform rotate-180' : ''
              }`} />
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4 border-t pt-4">
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
                      <span className="text-sm text-gray-600">
                        {item.quantity}x {item.name}
                      </span>
                      <span>{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)} €</span>
                    </div>

                    {/* Affichage des sections de combo */}
                    {item.sections?.map((section, idx) => (
                      <div key={idx} className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">{section.name} : </span>
                        {section.choice}
                        {!section.included && (
                          <span className="text-emerald-500 ml-1">(+supplément)</span>
                        )}
                      </div>
                    ))}

                    {/* Affichage des options classiques */}
                    {item.menuOptions && !item.sections && (
                      <div className="text-sm text-gray-500">
                        {item.menuOptions.drink && (
                          <p>Boisson : {item.menuOptions.drink}</p>
                        )}
                        {item.menuOptions.side && (
                          <p>Accompagnement : {item.menuOptions.side}</p>
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

            <div className="border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sous-total</span>
                <span>{(Number(order.subtotal) || 0).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">TVA (20%)</span>
                <span>{(Number(order.tax) || 0).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-medium mt-2 pt-2 border-t">
                <span>Total</span>
                <span>{(Number(order.total) || 0).toFixed(2)} €</span>
              </div>
            </div>
          </div>
        )}
      </div>
      {orderToPrint && (
        <Receipt
          ref={contentRef}
          order={orderToPrint}
        />
      )}
    </div>
  );
}