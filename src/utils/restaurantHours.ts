import { Restaurant } from '../types/firebase';

export function isRestaurantOpen(restaurant: Restaurant): boolean {
  if (!restaurant?.openingHours) return true;

  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  const currentTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const daySchedule = restaurant.openingHours[currentDay];
  
  // Si le restaurant est marqué comme fermé ce jour
  if (daySchedule?.closed) return false;

  // Si pas d'horaires définis, considérer comme ouvert
  if (!daySchedule?.open || !daySchedule?.close) return true;

  // Convertir les heures en minutes pour faciliter la comparaison
  const currentMinutes = convertTimeToMinutes(currentTime);
  const openMinutes = convertTimeToMinutes(daySchedule.open);
  const closeMinutes = convertTimeToMinutes(daySchedule.close);

  // Gérer le cas où l'heure de fermeture est après minuit (le jour suivant)
  if (closeMinutes < openMinutes) {
    // Si l'heure actuelle est après l'heure d'ouverture OU avant l'heure de fermeture
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  } else {
    // Cas normal: l'heure de fermeture est le même jour
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }
}

function convertTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}