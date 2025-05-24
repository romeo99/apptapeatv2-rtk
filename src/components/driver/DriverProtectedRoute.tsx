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
        console.log('DriverProtectedRoute: checking role...');

        const checkDriverRole = async () => {
            if (!user?.uid) {
                console.log('DriverProtectedRoute: No user ID found');

                setCheckingRole(false);
                return;
            }

            try {
                console.log('DriverProtectedRoute: Fetching user document...');

                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const userData = userDoc.data();
                if (!userData) {
                    console.log('DriverProtectedRoute: User document not found');
                    setIsDriver(false);
                    return;
                }

                console.log('DriverProtectedRoute: User document found:', userData);
                setIsDriver(userData.role === 'driver');
                setCheckingRole(false);
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