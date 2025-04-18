import { useEffect } from 'react';

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: any;
  }
}

export function useTawkTo(propertyId: string) {
  useEffect(() => {
    try {
      // Remove any existing Tawk.to elements first
      const existingElements = document.querySelectorAll('[class*="tawk"]');
      existingElements.forEach(el => el.remove());

      const s1 = document.createElement('script');
      s1.async = true;
      s1.src = `https://embed.tawk.to/${propertyId}`;
      s1.setAttribute('crossorigin', '*');
      
      document.head.appendChild(s1);

      return () => {
        // Remove the script tag
        if (document.head.contains(s1)) {
          document.head.removeChild(s1);
        }

        // Remove all Tawk.to elements and iframes
        const tawkElements = document.querySelectorAll('[class*="tawk"]');
        tawkElements.forEach(el => el.remove());

        // Remove any Tawk.to iframes
        const tawkIframes = document.querySelectorAll('iframe[title*="chat"]');
        tawkIframes.forEach(el => el.remove());

        // Reset Tawk_API
        if (window.Tawk_API) {
          window.Tawk_API = undefined;
        }
      };
    } catch (error) {
      console.error('Error initializing Tawk.to:', error);
    }
  }, [propertyId]);
}