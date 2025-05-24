import { CreditCard } from 'lucide-react';
import { OrderItem } from '../../../types/firebase';

interface OrderDetailsProps {
  order: any;
  handlePayAndPrepare: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string, autoComplete?: boolean) => Promise<void>;
  handleCompleteOrder: (orderId: string) => Promise<void>;
}

export default function OrderDetails({
  order,
  handlePayAndPrepare,
  updateOrderStatus,
  handleCompleteOrder
}: OrderDetailsProps) {
  return (
    <div className="mt-4 border-t pt-4">
      {/* Liste des articles */}
      <div className="space-y-3">
        {order.items.map((item: OrderItem, index: number) => (
          <div key={index} className="flex items-center gap-3">
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between">
                <span className="font-medium">{item.quantity}x {item.name}</span>
                <span>{(item.price * item.quantity).toFixed(2)} €</span>
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
                  {item.menuOptions.sauces?.length! > 0 && (
                    <p>Sauces : {item.menuOptions.sauces!.join(', ')}</p>
                  )}
                </div>
              )}

              {item.excludedIngredients?.length! > 0 && (
                <div className="text-sm text-red-500 mt-1">
                  Sans : {item.excludedIngredients?.join(', ')}
                </div>
              )}

              {item.remarks && (
                <p className="text-sm text-gray-600 italic mt-1 bg-gray-50 p-2 rounded-lg">
                  <span className="font-medium">Remarque client :</span> {item.remarks}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {order.status === 'awaiting_payment' && (
          <>
            <button
              onClick={() => handlePayAndPrepare(order.id)}
              className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Encaisser & Préparer
            </button>
            <button
              onClick={() => updateOrderStatus(order.id, 'cancelled')}
              className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
            >
              Refuser
            </button>
          </>
        )}

        {order.status === 'pending' && (
          <>
            <button
              onClick={() => updateOrderStatus(order.id, 'preparing')}
              className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium"
            >
              Commencer la préparation
            </button>

            <button
              onClick={() => updateOrderStatus(order.id, 'cancelled')}
              className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
            >
              Refuser
            </button>
          </>
        )}

        {order.status === 'preparing' && (
          <button
            onClick={() => updateOrderStatus(order.id, 'ready', true)}
            className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium"
          >
            Marquer comme prête
          </button>
        )}

        {order.status === 'ready' && (
          <button
            onClick={() => handleCompleteOrder(order.id)}
            className="w-full bg-gray-500 text-white py-2 rounded-lg text-sm font-medium"
          >
            Terminer la commande
          </button>
        )}
      </div>
    </div>
  );
}