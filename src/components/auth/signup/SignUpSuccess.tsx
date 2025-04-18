import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { requestNotificationPermission } from '../../../services/notificationService';
import { useAuth } from '../../../context/AuthContext';

interface SignUpSuccessProps {
  onComplete: () => void;
}

export default function SignUpSuccess({ onComplete }: SignUpSuccessProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Auto-redirect after 2 seconds if authenticated
    if (isAuthenticated) {
      // Demander la permission pour les notifications
      if (user?.uid) {
        requestNotificationPermission(user.uid);
      }
      
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, onComplete, user]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="max-w-sm mx-auto w-full text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">
          Inscription terminée !
        </h1>
        <p className="text-gray-500 mb-8">
          Votre compte a été créé avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités.
        </p>

        <button
          onClick={onComplete}
          className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium"
        >
          Commencer
        </button>
      </div>
    </div>
  );
}