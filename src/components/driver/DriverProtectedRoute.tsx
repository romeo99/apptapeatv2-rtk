import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

interface DriverProtectedRouteProps {
    children: React.ReactNode;
}

export default function DriverProtectedRoute({ children }: DriverProtectedRouteProps) {
    const { isAuthenticated, user, loading } = useAuth();
    const [isDriver, setIsDriver] = useState(false);
    const [checkingRole, setCheckingRole] = useState(true);

    useEffect(() => {
        const checkDriverRole = async () => {
            if (!user?.uid) {
                setCheckingRole(false);
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                setIsDriver(userDoc.exists() && userDoc.data().role === 'driver');
            } catch (error) {
                console.error('Error checking driver role:', error);
            } finally {
                setCheckingRole(false);
            }
        };

        if (isAuthenticated && user) {
            checkDriverRole();
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

    if (!isAuthenticated || !isDriver) {
        return <Navigate to="/driver/login" replace />;
    }

    return <>{children}</>;
}