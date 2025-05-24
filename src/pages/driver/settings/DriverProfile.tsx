import { Bell, ChevronLeft, Clock, Lock, LogOut, User, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileMenuItem from '../../../components/user/profile/ProfileMenuItem';
import { useAuth } from '../../../context/AuthContext';
import { signOut } from '../../../services/authService';

export default function DriverProfile() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut({});
        } catch (err) {
            console.error('Error logging out:', err);
        }
    };

    const profileMenuItems = [
        {
            section: 'Profil',
            items: [{ icon: User, label: 'Modifier le profil', path: '/driver/profile/edit' }]
        },
        {
            section: 'Portefeuille',
            items: [{ icon: Wallet, label: 'Compte stripe', path: '/driver/profile/stripe-connect' }]
        },
        {
            section: 'Paramètres',
            items: [
                { icon: Clock, label: 'Historique', path: '/driver/profile/history' },
                { icon: Lock, label: 'Mot de passe', path: '/driver/profile/password' },
                { icon: Bell, label: 'Notifications', path: '/driver/profile/notifications' }
            ]
        }
    ];

    return (
        <>
            <div className="bg-white px-4 py-4 flex items-center gap-4">
                <button
                    onClick={() => navigate('/driver')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-semibold">Profil</h1>
            </div>
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