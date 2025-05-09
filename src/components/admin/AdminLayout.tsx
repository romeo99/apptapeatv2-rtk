import { Menu as MenuIcon, Monitor, Power, Search } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AdminLayoutContext } from '../../context/AdminLayoutContext';
import { useRestaurantContext } from '../../context/RestaurantContext';
import { signOut } from '../../services/authService';
import AdminSidebar from './AdminSidebar';
import MenuLink from './MenuLink';
import OrderSearchKeypad from './OrderSearchKeypad';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurant, isOpen, setIsOpen } = useRestaurantContext();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonationData, setImpersonationData] = useState<any>(null);

  const handleLogout = async () => {
    try {
      await signOut({ isAdmin: true }); // Pass true to indicate admin logout
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const toggleRegisterMode = () => {
    const newMode = !isRegisterMode;
    setIsRegisterMode(newMode);

    if (newMode) {
      setIsSidebarOpen(false);
      if (restaurant?.id) {
        // Rediriger vers les commandes en direct avec le mode caisse activé
        navigate('/admin/live-orders');
      }
    }
  };

  const handleOrderSearch = (orderNumber: string) => {
    // Get the orders component instance
    const ordersIframe = document.getElementById('orders-iframe') as HTMLIFrameElement;
    if (ordersIframe?.contentWindow) {
      // Send message to iframe with search number
      ordersIframe.contentWindow.postMessage({
        type: 'SEARCH_ORDER',
        orderNumber
      }, '*');
    }
  };

  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    const checkImpersonation = async () => {
      const impersonationData = localStorage.getItem('impersonationData');
      if (impersonationData) {
        try {
          const data = JSON.parse(impersonationData);
          if (Date.now() < data.expiresAt) {
            setIsImpersonating(true);
            setImpersonationData(data);
          } else {
            localStorage.removeItem('impersonationData');
          }
        } catch (err) {
          console.error('Error parsing impersonation data:', err);
          localStorage.removeItem('impersonationData');
        }
      }
    };
    checkImpersonation();
  }, []);

  return (
    <AdminLayoutContext.Provider value={{ isRegisterMode }}>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Impersonation banner */}
        {isImpersonating && (
          <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white py-2 text-center z-50">
            <p className="text-sm">
              Mode superadmin - Vue {impersonationData?.restaurantName}
              <button
                onClick={() => {
                  localStorage.removeItem('impersonationData');
                  window.location.href = '/superadmin/restaurants';
                }}
                className="ml-2 px-2 py-0.5 bg-yellow-600 rounded text-xs"
              >
                Quitter
              </button>
            </p>
          </div>
        )}
        {/* Impersonation banner */}
        {impersonating && (
          <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white py-2 text-center z-50">
            <p className="text-sm">
              Mode superadmin - Vue restaurant
              <button
                onClick={() => {
                  localStorage.removeItem('impersonationToken');
                  window.location.href = '/superadmin/restaurants';
                }}
                className="ml-2 px-2 py-0.5 bg-yellow-600 rounded text-xs"
              >
                Quitter
              </button>
            </p>
          </div>
        )}
        {/* Overlay pour mobile */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed lg:relative top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 ease-in-out z-50 ${isSidebarOpen || isMobileSidebarOpen ? 'w-64' : 'w-0'
          } ${isRegisterMode ? 'lg:w-0' : ''}`}>
          <div className={`h-full ${!isSidebarOpen && !isMobileSidebarOpen ? 'invisible' : ''}`}>
            <AdminSidebar onClose={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="bg-white shadow-sm sticky top-0 z-30">
            <div className="max-w-[2000px] mx-auto px-4">
              <div className="h-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Bouton menu mobile */}
                  <button
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="lg:hidden p-3 rounded-lg hover:bg-gray-100"
                  >
                    <MenuIcon className="h-7 w-7" />
                  </button>

                  {/* Bouton toggle sidebar desktop */}
                  {!isRegisterMode && (
                    <button
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className="hidden lg:block p-2 rounded-lg hover:bg-gray-100"
                    >
                      <MenuIcon className="h-6 w-6" />
                    </button>
                  )}

                  <button
                    onClick={() => navigate('/admin')}
                    className="h-10 focus:outline-none hover:opacity-80 transition-opacity"
                  >
                    <img
                      src="https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png"
                      alt="TapEat"
                      className="h-full"
                    />
                  </button>

                  <div className="h-8 w-px bg-gray-200" />

                  <MenuLink />

                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isRegisterMode
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 text-heading-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 text-heading-sm'
                      } cursor-pointer`}
                    onClick={toggleRegisterMode}
                  >
                    <Monitor className="h-5 w-5" />
                    <span className="font-medium">
                      {isRegisterMode ? 'Mode normal' : 'Mode caisse'}
                    </span>
                    {isRegisterMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowKeypad(true);
                        }}
                        className="ml-2 p-1 hover:bg-emerald-600 rounded"
                      >
                        <Search className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Toggle restaurant status */}
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${isOpen
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                >
                  <Power className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {isOpen ? 'Restaurant ouvert' : 'Restaurant fermé'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Zone de contenu principale */}
          <div className="flex-1">
            <div className={`h-full max-w-[2000px] mx-auto p-4 transition-all duration-300 ${isRegisterMode ? 'pr-[33.333333%]' : ''
              }`}>
              {children}
            </div>
          </div>
        </div>

        {/* Menu client en mode caisse */}
        {isRegisterMode && restaurant?.id && location.pathname === '/admin/live-orders' && (
          <div className="fixed right-0 top-20 bottom-0 w-full bg-white border-l border-gray-200 overflow-hidden">
            <div className="w-full h-full">
              <iframe
                id="orders-iframe"
                src={`${window.location.origin}/restaurant?restaurantId=${restaurant.id}&mode=register`}
                className="w-full h-full border-none"
                title="Menu client"
                style={{ height: 'calc(100vh - 5rem)' }}
                onLoad={(e) => {
                  // Ensure iframe content is loaded
                  const iframe = e.target as HTMLIFrameElement;
                  if (iframe.contentWindow) {
                    // Send restaurant ID to iframe
                    iframe.contentWindow.postMessage({
                      type: 'INIT_MENU',
                      restaurantId: restaurant.id
                    }, '*');
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Keypad Modal */}
        {showKeypad && (
          <OrderSearchKeypad
            onClose={() => setShowKeypad(false)}
            onSearch={handleOrderSearch}
          />
        )}
      </div>
    </AdminLayoutContext.Provider>

  );
}