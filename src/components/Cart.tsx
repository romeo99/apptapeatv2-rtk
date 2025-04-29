import { Calendar, Minus, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useRestaurantContext } from '../context/RestaurantContext';
import { getRestaurant } from '../services/restaurantService';

function Cart() {
  const cartRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { themeColor } = useRestaurantContext();
  const { items, isCartOpen, toggleCart, updateQuantity, removeItem, scheduledTime, isFoodCourtOrder, foodCourtId, total, subtotal, serviceFees, fixAnonymousUser, anonymousUser } = useCart();
  const [restaurantNames, setRestaurantNames] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [anonymousUserError, setAnonymousUserError] = useState('');

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
    function handleClickOutside(event: MouseEvent) {
      if (cartRef.current && !cartRef.current.contains(event.target as Node) /* && user?.displayName */) {
        toggleCart();
      }
    }

    if (isCartOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCartOpen, toggleCart]);

  const handleCheckout = () => {
    const restaurantId = items[0]?.restaurantId;
    if (!user && !anonymousUser.trim()) {
      setAnonymousUserError('Vous devez saisir votre prénom pour continuer.');
      return;
    }

    toggleCart();
    const isRegisterMode = new URLSearchParams(window.location.search).get('mode') === 'register';
    navigate(`/checkout?restaurantId=${restaurantId}${isRegisterMode ? '&mode=register' : ''}${isFoodCourtOrder ? `&foodCourtId=${foodCourtId}` : ''}`);
  };

  if (!isCartOpen) return null;

  // Group items by restaurant
  const groupedItems = items.reduce(
    (acc, item) => {
      const restaurantId = item.restaurantId;
      const restaurantName = restaurantNames[restaurantId] || 'Restaurant non disponible';
      if (!acc[restaurantId]) {
        acc[restaurantId] = {
          name: restaurantName,
          subtotal: 0,
          items: [],
        };
      }
      // Calculate subtotal for each restaurant
      acc[restaurantId].subtotal += item.price * item.quantity;
      acc[restaurantId].items.push(item);
      return acc;
    },
    {} as Record<
      string,
      {
        name: string;
        subtotal: number;
        items: typeof items;
      }
    >,
  );

  return (
    <>
      <div ref={cartRef} className={`fixed right-0 top-0 z-50 h-full w-full max-w-md transform overflow-y-auto bg-white p-6 shadow-xl transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Votre panier</h2>
                {scheduledTime && (
                  <div className="flex items-center gap-2 text-emerald-600 mt-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {new Date(scheduledTime.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}{' '}
                      à {scheduledTime.time}
                    </span>
                  </div>
                )}
              </div>
              <button onClick={toggleCart} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">Votre panier est vide</div>
            ) : (
              <div className="space-y-6">
                {!user && <div className=" w-full max-w-sm rounded-lg bg-white">
                  <h2 className="font-medium text-lg mb-2">Saisir votre prénom</h2>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 p-2 mb-2 focus:outline-none focus:ring focus:ring-primary"
                    placeholder="Prénom sur la commande"
                    onChange={(e) => { fixAnonymousUser(e.target.value); }}
                    value={anonymousUser}
                  />
                  {anonymousUserError && <p className="text-red-500 text-sm mb-3">{anonymousUserError}</p>}
                </div>}
                {Object.entries(groupedItems).map(([restaurantId, { name, items: restaurantItems, subtotal }]) => (
                  <div key={restaurantId} className="space-y-4">
                    {/* Restaurant header */}
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg">{name}</h3>
                      {isFoodCourtOrder && <span className="text-sm text-gray-500">Sous-total: {subtotal.toFixed(2)} €</span>}
                    </div>
                    <div className="border-l-2 border-emerald-500 pl-4 space-y-4">
                      {restaurantItems.map((item, index) => (
                        <div key={`${item.id}-${index}-${JSON.stringify(item.menuOptions)}`} className="flex items-center gap-4 bg-white rounded-lg p-3 shadow-sm">
                          <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex-1">
                                <span className="font-medium text-sm">{item.quantity}x {item.name}</span>
                                {item.promotionLabel && (
                                  <span className="block text-xs text-emerald-500">{item.promotionLabel}</span>
                                )}
                              </div>
                              <div className="text-right">
                                {item.promotionType ? (
                                  <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-red-500 line-through">
                                      {((item.originalPrice || item.price) * item.quantity).toFixed(2)} €
                                    </span>
                                    <span className="font-bold text-sm text-emerald-600">
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
                                  </div>
                                ) : (
                                  <span className="font-medium text-sm">
                                    {(item.price * item.quantity).toFixed(2)} €
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Affichage des sections de combo */}
                            {item.sections?.map((section, idx) => (
                              <div key={idx} className="text-xs text-gray-500">
                                <p>
                                  <span className="font-medium">{section.name} : </span>
                                  {section.choice}
                                  {!section.included && <span className="text-emerald-500 ml-1">(+supplément)</span>}
                                </p>
                              </div>
                            ))}
                            {/* Affichage des options classiques */}
                            {item.menuOptions && !item.sections && (
                              <div className="text-xs text-gray-500">
                                {item.menuOptions.side && <p className="mt-0.5">Accompagnement : {item.menuOptions.side}</p>}
                                {item.menuOptions.sauces!.length > 0 && <p className="mt-0.5">Sauces : {item.menuOptions.sauces?.join(', ')}</p>}
                              </div>
                            )}
                            {item.excludedIngredients && item.excludedIngredients?.length > 0 && <p className="text-xs text-red-500">Sans : {item.excludedIngredients?.join(', ')}</p>}
                            {item.remarks && (
                              <p className="text-xs text-gray-600 italic mt-1 bg-gray-50 p-1.5 rounded-lg">
                                <span className="font-medium">Remarque client :</span> {item.remarks}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded-full" style={{ backgroundColor: themeColor, color: 'white' }}>
                                <Minus className="h-4 w-4" />
                              </button>
                              <span>{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded-full" style={{ backgroundColor: themeColor, color: 'white' }}>
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="p-1.5 hover:bg-gray-100 rounded-full">
                            <Trash2 className="h-5 w-5 text-gray-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Restaurant separator */}
                    {Object.keys(groupedItems).length > 1 && <div className="border-t border-gray-200" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="p-4 border-t">
              {isFoodCourtOrder && (
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Sous-total</span>
                    <span>{subtotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Frais de service</span>
                    <span>{serviceFees.toFixed(2)} €</span>
                  </div>
                  <div className="pt-2 border-t" />
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">Total</span>
                <span className="font-semibold" style={{ color: themeColor }}>
                  {total.toFixed(2)} €
                </span>
              </div>
              <button onClick={handleCheckout} className="w-full text-white py-2.5 sm:py-3 rounded-xl font-medium" style={{ backgroundColor: themeColor }}>
                Passer la commande
              </button>
            </div>
          )}
        </div>
      </div>
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold">Authentication Required</h2>
            <p className="mb-6 text-gray-600">Please sign in or create an account to proceed with checkout.</p>
            <div className="flex justify-end space-x-4">
              <button onClick={() => setShowAuthModal(false)} className="rounded-md px-4 py-2 text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  toggleCart();
                  navigate('/signin?redirect=checkout');
                }}
                className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
                style={{ backgroundColor: themeColor }}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Cart;