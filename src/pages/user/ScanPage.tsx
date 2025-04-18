import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import QrScanner from 'qr-scanner';
import BottomNavigation from '../../components/layout/BottomNavigation';

export default function ScanPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let scanner: QrScanner | null = null;

    const initializeScanner = async () => {
      if (!videoRef.current) return;

      try {
        // Create scanner instance
        scanner = new QrScanner(
          videoRef.current,
          result => {
            try {
              const url = new URL(result.data);
              const restaurantId = url.searchParams.get('restaurantId');
              const foodCourtId = url.searchParams.get('foodCourtId');
              const tableNumber = url.searchParams.get('table');
              
              if (mounted) {
                if (scanner) {
                  scanner.stop();
                  scanner.destroy();
                }
                
                // Determine where to navigate based on scanned URL parameters
                if (foodCourtId) {
                  navigate(`/food-court?foodCourtId=${foodCourtId}${tableNumber ? `&table=${tableNumber}` : ''}`);
                } else if (restaurantId) {
                  navigate(`/restaurant?restaurantId=${restaurantId}${tableNumber ? `&table=${tableNumber}` : ''}`);
                } else {
                  setError('QR code invalide');
                }
              }
            } catch (err) {
              console.error('Invalid QR code:', err);
              setError('QR code invalide');
            }
          },
          {
            preferredCamera: 'environment',
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 5
          }
        );

        scannerRef.current = scanner;
        await scanner.start();

      } catch (err) {
        console.error('Scanner error:', err);
        if (mounted) {
          setError('Impossible d\'accéder à la caméra');
        }
      }
    };

    // Start scanner with a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeScanner();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (scanner) {
        scanner.stop();
        scanner.destroy();
      }
      scannerRef.current = null;
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-black">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-50 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <div className="relative h-full">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm"
              >
                Réessayer
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/50 rounded-lg">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-0.5 bg-emerald-500 animate-scan"></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}