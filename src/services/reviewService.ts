import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export async function submitReview(
  restaurantId: string,
  orderId: string,
  rating: number,
  comment: string
) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be authenticated');

    // Check if user has already reviewed this order
    const reviewsRef = collection(db, 'restaurants', restaurantId, 'reviews');
    const q = query(reviewsRef, where('orderId', '==', orderId));
    const existingReviews = await getDocs(q);

    if (!existingReviews.empty) {
      throw new Error('Vous avez déjà noté cette commande');
    }

    // Create the review
    await addDoc(reviewsRef, {
      orderId,
      userId: user.uid,
      userName: user.displayName || 'Utilisateur',
      rating,
      comment: comment.trim() || null,
      createdAt: serverTimestamp()
    });

    // Update restaurant average rating
    // This should ideally be done in a Cloud Function
    const allReviews = await getDocs(collection(db, 'restaurants', restaurantId, 'reviews'));
    const ratings = allReviews.docs.map(doc => doc.data().rating);
    const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

    // You would update the restaurant's average rating here
    // This is just a placeholder as it should be handled by a Cloud Function
    console.log('New average rating:', averageRating);

  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
}

export async function hasUserReviewedOrder(restaurantId: string, orderId: string): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const reviewsRef = collection(db, 'restaurants', restaurantId, 'reviews');
    const q = query(reviewsRef, where('orderId', '==', orderId));
    const snapshot = await getDocs(q);

    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking review status:', error);
    return false;
  }
}