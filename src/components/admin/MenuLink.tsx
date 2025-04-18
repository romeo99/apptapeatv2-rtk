import { useState } from 'react';
import { Link, Copy, Check } from 'lucide-react';
import { useRestaurantContext } from '../../context/RestaurantContext';

export default function MenuLink() {
  const { restaurant } = useRestaurantContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const fullUrl = `${window.location.origin}/restaurant?restaurantId=${restaurant?.id}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return 
}