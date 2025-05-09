import { useState, useEffect } from 'react';
import { doc, getDoc, query, getDocs, collectionGroup, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { User, Bell, Lock, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { signOut } from '../../../services/authService';
import ProfileMenuItem from './ProfileMenuItem';

export default function AuthenticatedProfile() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;
      
      // Check if restaurant owner
      const restaurantDoc = await getDoc(doc(db, 'restaurants', user.uid));
      if (restaurantDoc.exists()) {
        setUserRole('owner');
        return;
      }

      // Check if staff
      const staffQuery = query(
        collectionGroup(db, 'staff'),
        where('uid', '==', user.uid)
      );
      const staffDocs = await getDocs(staffQuery);
      if (!staffDocs.empty) {
        setUserRole('staff');
      }
    };

    checkRole();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut({});
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const profileMenuItems = [
    {
      section: 'Profile',
      items: [{ icon: User, label: 'Modifier le profil', path: '/profile/edit' }]
    },
    {
      section: 'Paramètres',
      items: [
        { icon: Lock, label: 'Mot de passe', path: '/profile/password' },
        { icon: Bell, label: 'Notifications', path: '/profile/notifications' },
        { icon: Settings, label: 'Gérer le compte', path: '/profile/account' }
      ]
    }
  ];

  return (
    <>
      {/* Header avec photo de profil */}
      <div className="bg-white px-4 pt-12 pb-6 text-center">
        <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
          <img
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'U'}&background=10B981&color=fff`}
            alt={user?.displayName || "Profile"}
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-xl font-bold">{user?.displayName || "Utilisateur"}</h1>
        <p className="text-gray-500">{user?.email}</p>
      </div>

      {/* Menu items */}
      <div className="px-4 py-6 space-y-6">
        {/* Admin button for restaurant owners/staff */}
        {(userRole === 'owner' || userRole === 'staff') && (
          <div>
            <button
              onClick={() => window.location.href = '/admin/live-orders'}
              className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition-colors mb-4"
            >
              <Settings className="h-5 w-5" />
              <span>Accéder à l'administration</span>
            </button>
          </div>
        )}

        {profileMenuItems.map((section) => (
          <div key={section.section}>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              {section.section}
            </h2>
            <div className="space-y-1">
              {section.items.map((item) => (
                <ProfileMenuItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Logout button */}
        <div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>
    </>
  );
}