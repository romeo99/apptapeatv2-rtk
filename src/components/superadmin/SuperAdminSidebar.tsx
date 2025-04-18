import { Building2, ChevronRight, DollarSign, LogOut, Store, Users } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const navigation = [
  {
    name: 'Dashboard',
    href: '/superadmin',
    icon: Building2
  },
  {
    name: 'Food Courts',
    href: '/superadmin/food-courts',
    icon: Store
  },
  {
    name: 'Restaurants',
    href: '/superadmin/restaurants',
    icon: Building2
  },
  {
    name: 'Utilisateurs',
    href: '/superadmin/users',
    icon: Users
  },
  {
    name: 'Finances',
    href: '/superadmin/finances',
    icon: DollarSign
  }
];

interface SuperAdminSidebarProps {
  onClose?: () => void;
}

export default function SuperAdminSidebar({ onClose }: SuperAdminSidebarProps) {
  const location = useLocation();

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`);

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b">
        <img
          src="https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png"
          alt="TapEat"
          className="h-8"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive
                ? 'bg-emerald-50 text-emerald-600'
                : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
            {isActive(item.href) && (
              <ChevronRight className="h-4 w-4 ml-auto" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <button
          onClick={() => {
            // Handle logout
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
        >
          <LogOut className="h-5 w-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}