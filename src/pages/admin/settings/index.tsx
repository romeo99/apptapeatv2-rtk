import { Building2, CreditCard, Palette, QrCode, Store, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';

const settingsMenus = [
  {
    id: 'restaurant',
    name: 'Mon restaurant',
    description: 'Informations et horaires d\'ouverture',
    icon: Building2,
    path: '/admin/settings/restaurant'
  },
  {
    id: 'options',
    name: 'Mes options',
    description: 'Moyens de paiement et modes de service',
    icon: Store,
    path: '/admin/settings/options'
  },
  {
    id: 'qrcodes',
    name: 'Mes QR Codes',
    description: 'Générer et gérer vos QR codes',
    icon: QrCode,
    path: '/admin/settings/qrcodes'
  },
  {
    id: 'theme',
    name: 'Thème',
    description: 'Personnaliser les couleurs de votre menu',
    icon: Palette,
    path: '/admin/settings/theme'
  },
  {
    id: 'banking',
    name: 'Paiements',
    description: 'Configurer vos comptes bancaires',
    icon: CreditCard,
    path: '/admin/settings/stripe-connect'
  },
  {
    id: 'profile',
    name: 'Mon profil',
    description: 'Gérer votre compte et vos accès',
    icon: User,
    path: '/admin/settings/profile'
  },
  {
    id: 'driver',
    name: 'Mes livreurs',
    description: 'Gérer vos livreurs et leurs accès',
    icon: User,
    path: '/admin/settings/drivers'
  },
];

export default function Settings() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsMenus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => navigate(menu.path)}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <menu.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{menu.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{menu.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}