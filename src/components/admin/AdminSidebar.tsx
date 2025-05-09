import { collectionGroup, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import {
  Award,
  Bell,
  ChevronRight,
  DollarSign,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Percent,
  Settings,
  Tags,
  Target,
  Users,
  Utensils,
  UtensilsCrossed,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useOrderContext } from '../../context/OrderContext';
import { useRestaurantContext } from '../../context/RestaurantContext';
import { signOut } from '../../services/authService';

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    name: 'Commandes en direct',
    href: '/admin/live-orders',
    icon: Bell
  },
  {
    name: 'Historique',
    href: '/admin/order-history',
    icon: History
  },
  {
    name: 'Comptabilité',
    href: '/admin/accounting',
    icon: DollarSign
  },
  {
    name: 'Inventaire',
    href: '/admin/inventory',
    icon: Package,
    soon: true,
    disabled: true
  },
  {
    name: 'Menu',
    href: '/admin/menu',
    icon: UtensilsCrossed,
    subItems: [
      { name: 'Catégories', href: '/admin/categories', icon: Tags },
      { name: 'Produits', href: '/admin/menu', icon: Utensils },
      { name: 'Menus & Combos', href: '/admin/menu/combos', icon: Package },
      { name: 'Ingrédients', href: '/admin/menu/ingredients', icon: Utensils }
    ]
  },
  {
    name: 'Marketing',
    href: '/admin/marketing',
    icon: Target,
    subItems: [
      { name: 'Promotions', href: '/admin/marketing/promotions', icon: Percent },
      {
        name: 'Programme fidélité',
        href: '/admin/marketing/loyalty',
        icon: Award,
        soon: true,
        disabled: true
      }
    ]
  },
  {
    name: 'Personnel',
    href: '/admin/staff',
    icon: Users
  },
  {
    name: 'Paramètres',
    href: '/admin/settings',
    icon: Settings
  },
  {
    name: 'Support',
    href: '/admin/support',
    icon: HelpCircle
  }
];

interface AdminSidebarProps {
  onClose?: () => void;
}

export default function AdminSidebar({ onClose }: AdminSidebarProps) {
  const location = useLocation();
  const { restaurant } = useRestaurantContext();
  const { user } = useAuth();
  const { orders } = useOrderContext();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await signOut({});
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  // Calculate total active orders
  const totalActiveOrders = orders.filter(o =>
    ['pending', 'preparing', 'ready'].includes(o.status)
  ).length;

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`);

  const isSubMenuOpen = (item: any) =>
    openMenus.includes(item.name) ||
    item.subItems?.some((subItem: any) => isActive(subItem.href));

  const toggleMenu = (menuName: string) => {
    setOpenMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };
  useEffect(() => {
    if (!user?.uid) return;

    const checkUserRole = async () => {
      try {
        // Check if user is a staff member
        const staffSnapshot = await getDocs(
          query(
            collectionGroup(db, 'staff'),
            where('uid', '==', user.uid)
          )
        );

        if (!staffSnapshot.empty) {
          setUserRole('staff');
          return;
        }

        // Check if user is a restaurant owner
        const restaurantDoc = await getDoc(doc(db, 'restaurants', user.uid));
        if (restaurantDoc.exists()) {
          setUserRole('owner');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };

    checkUserRole();
  }, [user?.uid]);

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => {
    if (userRole === 'staff') {
      return ['Commandes en direct', 'Paramètres'].includes(item.name);
    }
    return true;
  });

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="h-16 flex items-center justify-between px-4 border-b">
        <img
          src={restaurant?.logo || "https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png"}
          alt={restaurant?.name || "TapEat"}
          className="h-10"
        />
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredNavigation.map((item) => (
          <div key={item.name}>
            {item.subItems ? (
              <>
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-colors ${isSubMenuOpen(item)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="flex-1">{item.name}</span>
                  {item.href === '/admin/live-orders' && totalActiveOrders > 0 && (
                    <span className="flex items-center justify-center min-w-[24px] h-6 px-2 text-sm font-bold rounded-full bg-red-500 text-white">
                      {totalActiveOrders}
                    </span>
                  )}
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${isSubMenuOpen(item) ? 'rotate-90' : ''
                      }`}
                  />
                </button>
                <div className={`ml-10 mt-2 space-y-2 ${isSubMenuOpen(item) ? 'block' : 'hidden'}`}>
                  {item.subItems.map((subItem) => (
                    <NavLink
                      key={subItem.href}
                      onClick={(e) => {
                        if (subItem.disabled) {
                          e.preventDefault();
                          return;
                        }
                        onClose?.();
                      }}
                      to={subItem.href}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-colors ${subItem.disabled ? 'opacity-50 cursor-not-allowed' :
                          isActive
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2">
                        <subItem.icon className="h-5 w-5" />
                        <span>{subItem.name}</span>
                      </div>
                      {subItem.soon && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-600 rounded-full">
                          Soon
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </>
            ) : (
              <NavLink
                to={item.href}
                onClick={onClose}
                onClickCapture={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-colors ${item.disabled ? 'opacity-50 cursor-not-allowed' :
                    isActive
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <div className="flex items-center gap-3 flex-1">
                  <item.icon className="h-6 w-6" />
                  <span>{item.name}</span>
                  {item.soon && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-600 rounded-full">
                      Soon
                    </span>
                  )}
                </div>
                {item.href === '/admin/live-orders' && totalActiveOrders > 0 && (
                  <span className="flex items-center justify-center min-w-[24px] h-6 px-2 text-sm font-bold rounded-full bg-red-500 text-white ml-auto">
                    {totalActiveOrders}
                  </span>
                )}
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-900 truncate">
              {restaurant?.name || "Urban Burger"}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {restaurant?.email || "contact@urbanburger.com"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Déconnexion"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}