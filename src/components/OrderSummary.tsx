import { useEffect, useState } from 'react';
import { getRestaurant } from '../services/restaurantService';
import { CartItem } from '../types';
import { OrderItem } from '../types/firebase';

interface OrderSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  restaurants?: Record<string, { items: CartItem[]; amount: number }>;
  items: OrderItem[];
  serviceFees: number;
  deliveryFees: number;
  subtotal: number;
  total: number;
  themeColor?: string;
  setMessage?: (message: string) => void;
  type?: string;
}

export default function OrderSummary({ restaurants, items, serviceFees, deliveryFees, subtotal, total, themeColor, setMessage, type, ...props }: OrderSummaryProps) {
  const [restaurantNames, setRestaurantNames] = useState<Record<string, string>>({});
  const [orderType, setOrderType] = useState<string>('');

  useEffect(() => {
    const loadRestaurantNames = async () => {
      try {
        // Get unique restaurant IDs and filter out empty/null values
        const restaurantIds = [...new Set(items.map((item) => item.restaurantId).filter(Boolean))];
        if (restaurantIds.length === 0) {
          setRestaurantNames({});
          return;
        }

        // Load all restaurants in parallel
        const results = await Promise.allSettled(
          restaurantIds.map(async (id) => {
            const restaurant = await getRestaurant(id);
            if (!restaurant) {
              throw new Error('Restaurant not found');
            }
            return {
              id: restaurant.id,
              name: restaurant.name,
            };
          }),
        );

        // Build names object from results
        const names = results.reduce((acc, result) => {
          if (result.status === 'fulfilled') {
            acc[result.value.id] = result.value.name;
          }
          return acc;
        }, {} as Record<string, string>);

        setRestaurantNames(names);
      } catch (err) {
        console.error('Error loading restaurant names:', err);
        // Set empty object on error to avoid undefined access
        setRestaurantNames({});
      }
    };

    loadRestaurantNames();
  }, [items]);

  useEffect(() => {
    const orderType = JSON.parse(localStorage.getItem('orderType') || '{"type":"takeaway"}');
    setOrderType(orderType.type);
  }, []);

  return (
    <div className="bg-white rounded-xl overflow-hidden" {...props}>
      <div className="p-4 border-b">
        <h3 className="font-medium">Détails de la commande</h3>
      </div>
      {setMessage && <div className="p-4 border-b">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Remarque pour le restaurant
        </label>
        <textarea
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Ex : Pas de sauce, pas de tomate, etc."
        />
      </div>}
      <div className="divide-y">
        {restaurants ? Object.entries(restaurants).map(([restaurantId, { items, amount }]) => (
          <div key={restaurantId} className="bg-white rounded-lg shadow-sm mb-4 p-4">
            <div className="font-medium mb-3"> {restaurantNames[restaurantId]}</div>
            {items.map((item, index) => (
              <div key={index} className="p-4 flex gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
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
                          {item.menuOptions.sauces!.length > 0 && (
                            <p>Sauces : {item.menuOptions.sauces!.join(', ')}</p>
                          )}
                        </div>
                      )}
                      {item.remarks && (
                        <p className="text-sm text-gray-600 italic mt-1 bg-gray-50 p-2 rounded-lg">
                          <span className="font-medium">Remarque client :</span> {item.remarks}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">Quantité : {item.quantity}</p>
                      <p className="text-sm text-emerald-500">{item.promotionLabel}</p>
                      {item.excludedIngredients && item.excludedIngredients.length > 0 && (
                        <p className="text-sm text-red-500">
                          Sans : {item.excludedIngredients.join(', ')}
                        </p>
                      )}
                      {item.menuOptions && (
                        <div className="text-sm text-gray-500">
                          {item.menuOptions.drink && (
                            <p>Boisson : {item.menuOptions.drink}</p>
                          )}
                          {item.menuOptions.side && (
                            <p>Accompagnement : {item.menuOptions.side}</p>
                          )}
                          {item.menuOptions.sauces && item.menuOptions.sauces.length > 0 && (
                            <p>Sauces : {item.menuOptions.sauces.join(', ')}</p>
                          )}
                        </div>
                      )}
                    </div>
                    {item.promotionType ? <div className="column flex-column" style={{ gap: "4px", alignItems: "flex-start" }}>
                      <span style={{ textDecoration: "line-through", color: "#d32f2f", fontSize: "12px" }}>
                        {((item.originalPrice || item.price) * item.quantity).toFixed(2)} €
                      </span>
                      <span style={{ fontWeight: "bold", fontSize: "14px" }}>
                        {(() => {
                          const promo = item.promotionType;

                          if (promo === 'double') {
                            return (item.price * (item.quantity / 2)).toFixed(2);
                          } else if (promo === 'free') {
                            return '0';
                          } else if (promo === 'discount') {
                            return (item.quantity * item.price).toFixed(2);
                          } else {
                            const pairs = Math.floor(item.quantity / 2);
                            const remainingItems = item.quantity % 2;
                            const regularPrice = item.originalPrice || item.price;
                            const discountedPrice = item.price;

                            return (pairs * (regularPrice + discountedPrice) + remainingItems * regularPrice).toFixed(2);
                          }
                        })()} €
                      </span>
                    </div> : <span>
                      {(item.price * item.quantity).toFixed(2)} €
                    </span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )) : (<>
          {
            items.map((item, index) => (
              <div key={index} className="p-4 flex gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
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
                          {item.menuOptions.sauces!.length > 0 && (
                            <p>Sauces : {item.menuOptions.sauces!.join(', ')}</p>
                          )}
                        </div>
                      )}
                      {item.remarks && (
                        <p className="text-sm text-gray-600 italic mt-1 bg-gray-50 p-2 rounded-lg">
                          <span className="font-medium">Remarque client :</span> {item.remarks}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">Quantité : {item.quantity}</p>
                      {item.excludedIngredients && item.excludedIngredients.length > 0 && (
                        <p className="text-sm text-red-500">
                          Sans : {item.excludedIngredients.join(', ')}
                        </p>
                      )}
                      {item.menuOptions && (
                        <div className="text-sm text-gray-500">
                          {item.menuOptions.drink && (
                            <p>Boisson : {item.menuOptions.drink}</p>
                          )}
                          {item.menuOptions.side && (
                            <p>Accompagnement : {item.menuOptions.side}</p>
                          )}
                          {item.menuOptions.sauces && item.menuOptions.sauces.length > 0 && (
                            <p>Sauces : {item.menuOptions.sauces.join(', ')}</p>
                          )}
                        </div>
                      )}
                    </div>
                    {item.promotionType ? <div className="column flex-column" style={{ gap: "4px", alignItems: "flex-start" }}>
                      <span style={{ textDecoration: "line-through", color: "#d32f2f", fontSize: "11px" }}>
                        {((item.originalPrice || item.price) * item.quantity).toFixed(2)} €
                      </span>
                      <span style={{ fontWeight: "bold", fontSize: "14px" }}>
                        {(() => {
                          const promo = item.promotionType;

                          if (promo === 'double') {
                            return (item.price * (item.quantity / 2)).toFixed(2);
                          } else if (promo === 'free') {
                            return '0';
                          } else if (promo === 'discount') {
                            return (item.quantity * item.price).toFixed(2);
                          } else {
                            const pairs = Math.floor(item.quantity / 2);
                            const remainingItems = item.quantity % 2;
                            const regularPrice = item.originalPrice || item.price;
                            const discountedPrice = item.price;

                            return (pairs * (regularPrice + discountedPrice) + remainingItems * regularPrice).toFixed(2);
                          }
                        })()} €
                      </span>
                    </div> : <span>
                      {(item.price * item.quantity).toFixed(2)} €
                    </span>}
                  </div>
                </div>
              </div>
            ))
          }
        </>)
        }
        <div className="mt-6 p-4 bg-white rounded-lg shadow">
          <div className="flex justify-between">
            <div className="font-medium">Sous-total total</div>
            <div className="font-medium">{subtotal.toFixed(2)}€</div>
          </div>
          {
            (orderType === 'delivery' || type === 'delivery') && (
              <div className="flex justify-between mt-2">
                <div className="text-gray-600">Frais de livraison</div>
                <div className="text-gray-600">{deliveryFees.toFixed(2)}€</div>
              </div>
            )
          }
          <div className="flex justify-between mt-2">
            <div className="text-gray-600">Frais de service</div>
            <div className="text-gray-600">{serviceFees.toFixed(2)}€</div>
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t">
            <div className="font-semibold text-lg">Total</div>
            <div className="font-semibold text-lg">{total.toFixed(2)}€</div>
          </div>
        </div>
      </div>
    </div>
  );
}