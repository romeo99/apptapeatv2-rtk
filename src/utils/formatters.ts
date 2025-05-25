export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1).replace(/\.0$/, '')}km`;
}

export function formatCurrency(amount: number): string {
  return amount.toFixed(2) + ' €';
}

export function formatLogoUrlForMarker(restaurantId: string) {
  return `https://tapeat-restaurants-logos-for-marker.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${restaurantId}-logo.png`;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}