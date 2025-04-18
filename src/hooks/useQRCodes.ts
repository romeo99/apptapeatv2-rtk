import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { QRCodeData } from '../services/qrCodeService';

export function useQRCodes(restaurantId: string) {
  const [qrCodes, setQRCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'restaurants', restaurantId, 'qrCodes'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const codes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          })) as QRCodeData[];
          
          setQRCodes(codes);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching QR codes:', err);
          setError('Failed to fetch QR codes');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up QR codes listener:', err);
      setError('Failed to initialize QR codes');
      setLoading(false);
    }
  }, [restaurantId]);

  return {
    qrCodes,
    loading,
    error
  };
}