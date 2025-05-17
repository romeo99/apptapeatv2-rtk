import { Bike, ChevronLeft, Clock, Instagram, MapPin, Phone, ShoppingBag, Star, UtensilsCrossed } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRestaurantContext } from '../context/RestaurantContext';
import { useUserLocation } from '../hooks/useUserLocation';

export default function RestaurantDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { restaurant, themeColor } = useRestaurantContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isRegisterMode = new URLSearchParams(window.location.search).get('mode') === 'register';
  const foodCourtId = searchParams.get('foodCourtId');
  const [deliveryPopup, setShowDeliveryPopup] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<{}>({
    adress: '',
    phone: '',
    name: ''
  });

  const { location, locationError } = useUserLocation();

  const getTodayHours = () => {
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const today = days[new Date().getDay()];
    const openingHours = restaurant?.openingHours[today];

    return openingHours?.closed ? "Fermé" : `${openingHours?.open} - ${openingHours?.close}`;
  };

  useEffect(() => {
    if (!restaurant?.id) {
      setLoading(false);
      return;
    }
    setLoading(false);
  }, [restaurant]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDeliveryInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {!isRegisterMode && (
        <>
          <button
            onClick={() => navigate(-1)}
            className="fixed top-4 left-4 z-50 w-10 h-10 bg-black/50 backdrop-blur-sm hover:bg-black/60 rounded-lg flex items-center justify-center shadow-lg transition-colors border-2 border-white/30"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          {restaurant ? (
            <>
              <div className="relative h-48">
                <img
                  src={restaurant.coverImage || "https://images.unsplash.com/photo-1542574271-7f3b92e6c821?auto=format&fit=crop&w=1200&q=80"}
                  alt="Restaurant background"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="px-4 -mt-20 relative">
                <div className="bg-white rounded-2xl shadow-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <img
                          src={restaurant.logo || "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=200&h=200"}
                          alt="Restaurant logo"
                          className="w-16 h-16 rounded-full border-4 border-white shadow-md"
                        />
                        <div>
                          <h1 className="text-xl font-bold">{restaurant.name}</h1>
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span className="font-medium">4.5</span>
                            <span className="text-gray-500">(500+ avis)</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{restaurant.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{getTodayHours()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${restaurant.phone}`}>{restaurant.phone}</a>
                          {restaurant.instagramUrl && (
                            <div className="flex items-center gap-2 ml-auto">
                              <a
                                href={restaurant.instagramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                              >
                                <Instagram className="h-4 w-4 text-gray-600" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          )}
        </>)}
      <div className="mt-6 px-4">
        <h2 className="text-lg font-semibold mb-4">
          Comment souhaitez-vous être servi ?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {
            restaurant?.serviceOptions?.map((service) => (
              <button
                onClick={() => {
                  localStorage.setItem('orderType', JSON.stringify({ type: service }));
                  if (service === 'delivery') {
                    setShowDeliveryPopup(true);
                  } else
                    if (foodCourtId) {
                      navigate(`/menu?restaurantId=${restaurant?.id}&foodCourtId=${foodCourtId}${isRegisterMode ? '&mode=register' : ''}`);
                    } else {
                      navigate(`/menu?restaurantId=${restaurant?.id}${isRegisterMode ? '&mode=register' : ''}`);
                    }
                }}
                className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all text-center border-2 hover:border-2"
                style={{ borderColor: 'transparent', hoverBorderColor: themeColor }}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${themeColor}20` }}>
                  {service === 'dine_in' ? <UtensilsCrossed className="h-8 w-8" style={{ color: themeColor }} /> :
                    service === 'takeaway' ? <ShoppingBag className="h-8 w-8" style={{ color: themeColor }} /> :
                      <Bike className="h-8 w-8" style={{ color: themeColor }} />}
                </div>
                <span className="font-medium" style={{ color: '#333' }}>
                  {service === 'dine_in' ? "Sur place" : service === 'takeaway' ? "À emporter" : "Livraison"}
                </span>
              </button>
            )) || (
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
              </div>
            )}
        </div>
      </div>

      {deliveryPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 sm:w-96">
            <h2 className="text-lg font-semibold mb-4">Livraison</h2>
            <p className="text-gray-600 mb-4">Veuillez renseigner les informations de livraison</p>

            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-gray-500" />
              <input
                type="text"
                name="address"
                onChange={handleChange}
                placeholder="Adresse de livraison"
                className="border border-gray-300 rounded-lg px-4 py-2 w-full"
              />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Phone className="h-5 w-5 text-gray-500" />
              <input
                type="text"
                name="phone"
                onChange={handleChange}
                placeholder="Numéro de téléphone"
                className="border border-gray-300 rounded-lg px-4 py-2 w-full"
              />
            </div>
            <button
              onClick={async () => {
                localStorage.setItem('deliveryInfo', JSON.stringify({ ...deliveryInfo, lat: location?.latitude, lng: location?.longitude }));
                setShowDeliveryPopup(false);
                if (foodCourtId) {
                  navigate(`/menu?restaurantId=${restaurant?.id}&foodCourtId=${foodCourtId}${isRegisterMode ? '&mode=register' : ''}`);
                } else {
                  navigate(`/menu?restaurantId=${restaurant?.id}${isRegisterMode ? '&mode=register' : ''}`);
                }
              }}
              className="w-full bg-emerald-500 text-white rounded-lg py-2 hover:bg-emerald-600 transition-colors"
            >
              Continuer
            </button>
            <button
              onClick={() => setShowDeliveryPopup(false)}
              className="mt-2 w-full text-gray-500 hover:text-gray-700 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}