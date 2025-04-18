import { Download, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installMethod, setInstallMethod] = useState<'native' | 'manual' | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Only show on discovery page
    if (location.pathname !== '/discover') {
      setShowPrompt(false);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallMethod('native');
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    // Detect if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Auto-hide after 10 seconds
    let hideTimeout: NodeJS.Timeout;

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      setInstallMethod('manual');
      setShowPrompt(true);
      hideTimeout = setTimeout(() => {
        setShowPrompt(false);
      }, 3000);
      return;
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(hideTimeout);
    };
  }, [location.pathname]);

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const renderInstallInstructions = () => {
    if (installMethod === 'manual') {
      return (
        <div className="flex-1 z-10">
          <h3 className="font-medium text-gray-900 mb-2">Pour installer TapEat :</h3>
          <ol className="text-sm space-y-2 text-gray-600">
            <li>1. Appuyez sur <Plus className="h-4 w-4 inline" /></li>
            <li>2. Sélectionnez "Sur l'écran d'accueil"</li>
            <li>3. Confirmez en appuyant sur "Ajouter"</li>
          </ol>
        </div>
      );
    }

    return (
      <div className="flex-1 z-10">
        <h3 className="font-medium text-gray-900 mb-2">Installer TapEat</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Ajoutez TapEat à votre écran d'accueil pour une expérience optimale
        </p>
      </div>
    );
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-xl safe-bottom z-50 overflow-hidden">
      <div className="flex items-center justify-between gap-4 p-4 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />

        <div className="flex items-center gap-4 z-10">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <img
              src="https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png"
              alt="TapEat"
              className="w-8 h-8 object-contain"
            />
          </div>
          {renderInstallInstructions()}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrompt(false)}
            className="p-2 text-gray-400 hover:text-gray-600 z-10"
          >
            <X className="h-5 w-5" />
          </button>
          {installMethod === 'native' && (
            <button
              onClick={handleNativeInstall}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 z-10"
            >
              <Download className="h-4 w-4" />
              Installer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}