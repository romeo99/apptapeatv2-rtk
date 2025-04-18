import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface SuperAdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function SuperAdminProtectedRoute({ children }: SuperAdminProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkSuperAdminRole = async () => {
      if (!user?.uid) {
        setCheckingRole(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setIsSuperAdmin(userDoc.exists() && userDoc.data().role === 'superadmin');
      } catch (error) {
        console.error('Error checking superadmin role:', error);
      } finally {
        setCheckingRole(false);
      }
    };

    if (isAuthenticated && user) {
      checkSuperAdminRole();
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

  if (!isAuthenticated || !isSuperAdmin) {
    return <Navigate to="/superadmin/login" replace />;
  }

  return <>{children}</>;
}