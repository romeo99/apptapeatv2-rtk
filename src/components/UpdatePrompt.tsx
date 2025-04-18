import { useState, useEffect } from 'react';
import { ArrowDownCircle } from 'lucide-react';

export default function UpdatePrompt() {
  const [showReload, setShowReload] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Check if we're in StackBlitz environment
    const isStackBlitz = window.location.hostname.includes('stackblitz') || 
                        window.location.hostname.includes('webcontainer');
    
    // Only register service worker if not in StackBlitz and browser supports it
    if (!isStackBlitz && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        setInterval(() => {
          registration.update();
        }, 1000 * 60 * 60);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowReload(true);
              }
            });
          }
        });
      }).catch(error => {
        console.log('Service worker registration failed:', error);
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (showReload) {
          window.location.reload();
        }
      });
    }
  }, []);

  const reloadPage = () => {
    waitingWorker?.postMessage('skipWaiting');
  };

  if (!showReload) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-white rounded-xl shadow-lg p-4 animate-slide-up z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowDownCircle className="h-6 w-6 text-emerald-500" />
          <div>
            <p className="font-medium">Mise à jour disponible</p>
            <p className="text-sm text-gray-500">Une nouvelle version est disponible</p>
          </div>
        </div>
        <button
          onClick={reloadPage}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium"
        >
          Mettre à jour
        </button>
      </div>
    </div>
  );
}