import { ChevronLeft, Info, Plus, Power, Tag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Cart from '../components/Cart';
import LoadingSpinner from '../components/LoadingSpinner';
import MenuCustomization from '../components/MenuCustomization';
import MenuHeader from '../components/MenuHeader';
import ProductDetails from '../components/ProductDetails';
import { useCart } from '../context/CartContext';
import { useRestaurantContext } from '../context/RestaurantContext';
import { getFoodCourt } from '../services/foodCourtService';
import { getActivePromotions } from '../services/promotionService';
import { getRestaurant } from '../services/restaurantService';
import type { Promotion } from '../types/firebase';

export default function Menu() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const foodCourtId = searchParams.get('foodCourtId');

  // Store foodCourtId in localStorage when it's present in URL
  useEffect(() => {
    if (foodCourtId) {
      try {
        localStorage.setItem('foodCourtId', foodCourtId);
      } catch (error) {
        console.error('Error storing food court ID:', error);
        localStorage.removeItem('foodCourtId');
      }
    } else {
      localStorage.removeItem('foodCourtId');
    }
  }, [foodCourtId]);

  const restaurantId = searchParams.get('restaurantId');
  const isRegisterMode = searchParams.get('mode') === 'register';

  const { restaurant, categories, menu: menuItems, loading, error, isOpen, themeColor } = useRestaurantContext();
  const [foodCourt, setFoodCourt] = useState<any>(null);
  const [foodCourtRestaurants, setFoodCourtRestaurants] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [animatingItem, setAnimatingItem] = useState<string | null>(null);
  const { addItem, items, total, toggleCart } = useCart();
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (categoriesRef.current) {
        const { scrollWidth, clientWidth, scrollLeft } = categoriesRef.current;
        setShowScrollButton(scrollLeft < scrollWidth - clientWidth);
      }
    };

    checkScroll();
    const container = categoriesRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
    };
  }, [categories]);

  const handleScrollRight = () => {
    if (categoriesRef.current) {
      const container = categoriesRef.current;
      const scrollAmount = 300; // Ajustez cette valeur selon vos besoins
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!foodCourtId) return;

    const loadFoodCourt = async () => {
      try {
        //setLoading(true);
        const foodCourtData = await getFoodCourt(foodCourtId);
        setFoodCourt(foodCourtData);

        // Load restaurant details
        if (foodCourtData.restaurants?.length > 0) {
          const restaurantsData = await Promise.all(
            foodCourtData.restaurants.map(async (r) => {
              try {
                const restaurantData = await getRestaurant(r.restaurantId);
                return restaurantData;
              } catch (err) {
                console.error(`Error loading restaurant ${r.restaurantId}:`, err);
                return null;
              }
            }),
          );

          // Filter out failed loads
          const validRestaurants = restaurantsData.filter((r) => r !== null);
          setFoodCourtRestaurants(validRestaurants);
        }
      } catch (err) {
        console.error('Error loading food court:', err);
      } finally {
        //setLoading(false);
      }
    };

    loadFoodCourt();
  }, [foodCourtId, restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;

    const loadPromotions = async () => {
      try {
        const promotions = await getActivePromotions(restaurantId);
        setActivePromotions(promotions);
      } catch (err) {
        console.error('Error loading promotions:', err);
      }
    };

    loadPromotions();
  }, [restaurantId]);

  // Listen for messages from parent window in register mode
  useEffect(() => {
    if (!isRegisterMode) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'INIT_MENU' && event.data.restaurantId) {
        navigate(`/menu?restaurantId=${event.data.restaurantId}&mode=register`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isRegisterMode]);

  // Redirect to restaurant details if no restaurantId
  useEffect(() => {
    // En mode caisse, bloquer la navigation vers d'autres pages
    if (isRegisterMode) {
      // Bloquer la navigation et le retour arrière
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', () => {
        window.history.pushState(null, '', window.location.href);
      });

      // Nettoyer l'écouteur d'événements
      return () => {
        window.removeEventListener('popstate', () => {
          window.history.pushState(null, '', window.location.href);
        });
      };
    }
  }, [isRegisterMode]);

  useEffect(() => {
    try {
      if (!restaurantId) {
        if (foodCourtId) {
          navigate(`/food-court?foodCourtId=${foodCourtId}`);
        } else {
          navigate('/');
        }
        return;
      }

      // Vérifier si le type de commande est défini
      const orderTypeData = localStorage.getItem('orderType');
      if (!orderTypeData) {
        navigate(`/restaurant?restaurantId=${restaurantId}${isRegisterMode ? '&mode=register' : ''}`);
        return;
      }
    } catch (err) {
      console.error('Error in Menu useEffect:', err);
      navigate('/');
    }
  }, [restaurantId, isRegisterMode, navigate]);

  // Rotation automatique des slides
  useEffect(() => {
    if (activePromotions.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((current) => (current + 1) % activePromotions.length);
    }, 5000); // Change toutes les 5 secondes

    return () => clearInterval(interval);
  }, [activePromotions.length]);

  useEffect(() => {
    if (!activeCategory && categories?.length > 0) {
      // Find first visible category
      const firstVisibleCategory = categories.find(cat => !cat.hidden);
      if (firstVisibleCategory) {
        setActiveCategory(firstVisibleCategory.id);
      } else {
        setActiveCategory(categories[0].id);
      }
    }
  }, [activeCategory, categories]);

  const handleItemClick = (item: any) => {
    // Ne rien faire si le produit n'est pas disponible ou si le restaurant est fermé
    if (item.status !== 'available' || !isOpen) return;

    // Add restaurantId to item for food court orders
    const itemWithRestaurant = {
      ...item,
      restaurantId: restaurant?.id,
      restaurantName: restaurant?.name,
    };

    // Vibrate on mobile devices
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    setSelectedItem(item);
    if (item.isCombo) {
      setShowCustomization(true);
      setShowProductDetails(false);
    } else {
      setAnimatingItem(item.id);
      // Faster animation
      setTimeout(() => {
        setAnimatingItem(null);
      }, 500);
      addItem({ ...itemWithRestaurant, quantity: 1 });
    }
  };

  const handleInfoClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setSelectedItem(item);
    setShowProductDetails(true);
    setShowCustomization(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const filteredItems = activeCategory && menuItems ? menuItems.filter((item) => item.categoryId === activeCategory) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant closed overlay */}
      {!isOpen && !loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full text-center animate-fade-in">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Power className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Restaurant fermé</h2>
            <p className="text-gray-600">Désolé, le restaurant est actuellement fermé. Veuillez revenir plus tard.</p>
          </div>
        </div>
      )}

      <MenuHeader isFoodCourt={!!foodCourtId} restaurants={foodCourtRestaurants} onRestaurantSelect={(id) => navigate(`/menu?restaurantId=${id}&foodCourtId=${foodCourtId}`)} />

      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-40">
        <div className="relative flex flex-col px-4 py-3">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: themeColor }}>
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">{restaurant?.name || 'Menu'}</h1>
            </div>
          </div>
        </div>
        <div className="px-2 py-1 pb-3 border-b mt-6 md:mt-3">
          <div className="flex gap-4 overflow-x-auto  relative" ref={categoriesRef}>
            {categories?.filter(category => !category.hidden).map((category) => (
              <button key={category.id} onClick={() => setActiveCategory(category.id)} className={`flex-shrink-0 flex flex-col items-center gap-2 px-3 py-2 rounded-xl transition-colors ${activeCategory === category.id ? 'text-white' : 'bg-white text-gray-600'}`} style={activeCategory === category.id ? { backgroundColor: themeColor } : undefined}>
                {category.image ? (
                  <div className="w-7 h-7 rounded-full overflow-hidden">
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-base">{category.icon}</div>
                )}
                <span className="text-[11px] whitespace-nowrap font-medium">{category.name}</span>
              </button>
            ))}
            {/* {showScrollButton && (
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white to-transparent flex items-center justify-center">
                <button onClick={handleScrollRight} className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-colors" style={{ backgroundColor: themeColor }}>
                  <ChevronRight className="h-4 w-4 text-white" />
                </button>
              </div>
            )} */}
          </div>
        </div>
      </div>
      <div className="fixed top-0 left-0 right-0 bottom-0 overflow-hidden" style={{ paddingTop: activePromotions.length > 0 ? '220px' : '180px', paddingBottom: '96px' }}>
        <div className="h-full overflow-y-auto px-4">
          {/* Bandeau promotions */}
          {activePromotions.length > 0 && (
            <div className="fixed top-[160px] left-0 right-0 bg-emerald-500 text-white py-1.5 z-40">
              <div className="relative overflow-hidden">
                <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                  {activePromotions.map((promo, index) => (
                    <div key={promo.id} className="flex-shrink-0 w-full px-4 flex items-center justify-center gap-2">
                      <Tag className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {promo.name} - {promo.description}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Indicateurs de slide */}
                {activePromotions.length > 1 && (
                  <div className="absolute -bottom-1 left-0 right-0 flex justify-center gap-1 pb-1">
                    {activePromotions.map((_, index) => (
                      <div key={index} className={`w-1.5 h-1.5 rounded-full transition-colors ${currentSlide === index ? 'bg-white' : 'bg-white/50'}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} onClick={() => handleItemClick(item)} className={`bg-white rounded-xl overflow-hidden shadow-sm transition-all relative h-[175px] ${item.status !== 'available' || !isOpen ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <div className="relative h-20">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  {(item.status !== 'available' || !isOpen) && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">{!isOpen ? 'Restaurant fermé' : 'Non disponible'}</span>
                    </div>
                  )}
                  <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg" onClick={(e) => handleInfoClick(e, item)}>
                    <Info className="h-5 w-5" style={{ color: themeColor }} />
                  </button>
                </div>
                <div className="p-2">
                  <h3 className="font-medium text-sm mb-0.5">{item.name}</h3>
                  <p className="font-medium" style={{ color: themeColor }}>
                    {item.price.toFixed(2)} €
                  </p>
                  {/* Afficher le badge de promotion si applicable */}
                  {activePromotions.map((promo) => {
                    if (promo.conditions.productId === item.id) {
                      return (
                        <div key={promo.id} className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                          <Tag className="h-3 w-3" />
                          {promo.type === 'double' ? '1 acheté = 1 offert' : promo.type === 'discount' ? `-${promo.conditions.discountPercent}%` : promo.type === 'free' ? `${promo.conditions.freeProductName} offert` : promo.type === 'second_item_discount' ? `-${promo.conditions.discountPercent}% sur le 2ème` : promo.type === 'second_item_discount' ? `-${promo.conditions.discountPercent}% sur le 2ème` : ''}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
                {item.status === 'available' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemClick(item);
                    }}
                    className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: themeColor }}>
                    <Plus className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4">
          <button onClick={toggleCart} className={`w-full text-white py-4 rounded-xl flex items-center justify-between px-4 ${animatingItem ? 'animate-[cartShake_0.3s_ease-in-out]' : ''}`} style={{ backgroundColor: themeColor }}>
            <div className="flex items-center gap-2">
              <span className="bg-white w-8 h-8 rounded-full flex items-center justify-center" style={{ color: themeColor }}>
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
              <span>Voir le panier</span>
            </div>
            <span>{total.toFixed(2)} €</span>
          </button>
        </div>
      )}

      <Cart />

      {selectedItem && showCustomization && (
        <MenuCustomization
          item={selectedItem}
          themeColor={themeColor}
          onClose={() => {
            setSelectedItem(null);
            setShowCustomization(false);
          }}
          onShowIngredients={() => {
            setShowCustomization(false);
            setShowProductDetails(true);
          }}
        />
      )}

      {selectedItem && showProductDetails && (
        <ProductDetails
          product={selectedItem}
          onClose={() => {
            setShowProductDetails(false);
            setSelectedItem(null);
          }}
        />
      )}

      {animatingItem && (
        <div
          className="fixed w-32 h-32 rounded-xl bg-white shadow-xl z-[100] pointer-events-none left-1/2 top-1/2"
          style={{
            animation: 'addToCart 0.5s ease-in-out forwards',
            backgroundImage: `url(${menuItems.find((item) => item.id === animatingItem)?.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: 'translate(-50%, -50%)',
            willChange: 'transform, opacity',
            border: '2px solid white',
          }}
        />
      )}
    </div>
  );
}