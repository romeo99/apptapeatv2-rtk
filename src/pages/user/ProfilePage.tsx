import { useAuth } from '../../context/AuthContext';
import BottomNavigation from '../../components/layout/BottomNavigation';
import AuthenticatedProfile from '../../components/user/profile/AuthenticatedProfile';
import UnauthenticatedProfile from '../../components/user/profile/UnauthenticatedProfile';

export default function ProfilePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 pb-safe-with-nav">
      {isAuthenticated ? (
        <AuthenticatedProfile />
      ) : (
        <UnauthenticatedProfile />
      )}
      <BottomNavigation />
    </div>
  );
}