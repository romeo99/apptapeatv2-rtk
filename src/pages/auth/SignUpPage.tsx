import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import SignUpEmail from '../../components/auth/signup/SignUpEmail';
import SignUpPassword from '../../components/auth/signup/SignUpPassword';
import SignUpProfile from '../../components/auth/signup/SignUpProfile';
import SignUpPhone from '../../components/auth/signup/SignUpPhone';
import SignUpSuccess from '../../components/auth/signup/SignUpSuccess';
import { registerUser } from '../../services/authService';
import BottomNavigation from '../../components/layout/BottomNavigation';

type SignUpStep = 'email' | 'password' | 'profile' | 'phone' | 'success';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<SignUpStep>('email');
  const [error, setError] = useState<string | null>(null);
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const redirect = new URLSearchParams(window.location.search).get('redirect');

  const handleStepComplete = async (data: Partial<typeof signUpData>) => {
    try {
      setError(null);
      const updatedData = { ...signUpData, ...data };
      setSignUpData(updatedData);

      // If we're on the phone step, complete registration
      if (currentStep === 'phone') {
        await registerUser(updatedData);
        setCurrentStep('success');
        return;
      }

      // Otherwise, move to next step
      const steps: SignUpStep[] = ['email', 'password', 'profile', 'phone', 'success'];
      const currentIndex = steps.indexOf(currentStep);
      setCurrentStep(steps[currentIndex + 1]);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : "Une erreur est survenue lors de l'inscription");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <button onClick={() => navigate(-1)} className="fixed top-4 left-4 z-50 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white">
        <ChevronLeft className="h-6 w-6" />
      </button>

      <div className="flex-1 flex flex-col pt-8 pb-28">
        {/* Progress bar */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{
              width: `${currentStep === 'email' ? '20%' : currentStep === 'password' ? '40%' : currentStep === 'profile' ? '60%' : currentStep === 'phone' ? '80%' : '100%'}`,
            }}
          />
        </div>

        {/* Error message */}
        {error && <div className="fixed top-4 left-4 right-4 bg-red-50 text-red-500 p-4 rounded-xl text-sm text-center">{error}</div>}

        {currentStep === 'email' && <SignUpEmail onComplete={handleStepComplete} />}

        {currentStep === 'password' && <SignUpPassword onComplete={handleStepComplete} />}

        {currentStep === 'profile' && <SignUpProfile onComplete={handleStepComplete} />}

        {currentStep === 'phone' && <SignUpPhone onComplete={handleStepComplete} />}

        {currentStep === 'success' && <SignUpSuccess onComplete={() => navigate(`/${redirect || 'discover'}`)} />}
      </div>

      <BottomNavigation />
    </div>
  );
}
