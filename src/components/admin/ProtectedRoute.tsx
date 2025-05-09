import { collectionGroup, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const [checkingRole, setCheckingRole] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Redirect to admin if trying to access user routes
  useEffect(() => {
    if (userRole === 'owner' || userRole === 'staff') {
      const userRoutes = ['/discover', '/scan', '/profile', '/history', '/favourites', '/signin'];
      if (userRoutes.some(route => location.pathname.startsWith(route))) {
        navigate('/admin/live-orders', { replace: true });
      }
    }
  }, [userRole, location.pathname, navigate]);

  useEffect(() => {
    const storedImpersonationData = localStorage.getItem('impersonationData');
    if (storedImpersonationData) {
      try {
        const data = JSON.parse(storedImpersonationData);
        if (data && Date.now() < data.expiresAt) {
          setUserRole('owner');
          setRestaurantId(data.restaurantId);
          setCheckingRole(false);
          return;
        }
        localStorage.removeItem('impersonationData');
      } catch (err) {
        console.error('Error checking impersonation:', err);
        localStorage.removeItem('impersonationData');
      }
    }
    const checkUserRole = async () => {
      if (!user?.uid) {
        setCheckingRole(false);
        return;
      }

      try {
        // First check if user is a restaurant owner
        const restaurantDoc = await getDoc(doc(db, 'restaurants', user.uid));
        if (restaurantDoc.exists()) {
          setUserRole('owner');
          setRestaurantId(user.uid);
          setCheckingRole(false);
          return;
        } else {
          // Then check if user is staff
          const staffQuery = query(
            collectionGroup(db, 'staff'),
            where('uid', '==', user.uid)
          );
          const staffDocs = await getDocs(staffQuery);

          if (!staffDocs.empty) {
            setUserRole('staff');
            const restaurantId = staffDocs.docs[0].ref.parent.parent?.id;
            if (restaurantId) {
              setRestaurantId(restaurantId);
            }
          } else {
            // User is neither owner nor staff
            setUserRole(null);
            setRestaurantId(null);
            navigate('/admin/login', { replace: true });
          }
        }
        setCheckingRole(false);
      } catch (error) {
        console.error('Error checking user role:', error);
        setCheckingRole(false);
      }
    };

    if (isAuthenticated && user) {
      checkUserRole();
    } else {
      setCheckingRole(false);
    }
  }, [isAuthenticated, user]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const storedImpersonationData = localStorage.getItem('impersonationData');
  if (!isAuthenticated && !storedImpersonationData) {
    return <Navigate to="/admin/login" replace />;
  }

  // Verify user has either staff role or is restaurant owner
  if (!userRole || !restaurantId) {
    return <Navigate to="/admin/login" replace />;
  }

  // Restrict staff access to certain pages
  if (userRole === 'staff') {
    const allowedPaths = ['/admin/live-orders', '/admin/settings/profile'];
    if (!allowedPaths.some(path => location.pathname.startsWith(path))) {
      return <Navigate to="/admin/live-orders" replace />;
    }
  }

  return <>{children}</>;
}