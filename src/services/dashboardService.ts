import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Order } from '../types/firebase';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  pendingOrders: number;
  dailyRevenue: Record<string, number>;
  dailyOrders: Record<string, number>;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
    trend: number;
  }>;
  paymentMethodBreakdown: Record<string, number>;
}

export async function getDashboardStats(restaurantId: string, period: string = 'week'): Promise<DashboardStats> {
  try {
    // Get effective restaurant ID (impersonated or real)
    const impersonationData = localStorage.getItem('impersonationData');
    const effectiveRestaurantId = impersonationData ? 
      JSON.parse(impersonationData).restaurantId : 
      restaurantId;
    
    if (!effectiveRestaurantId) {
      throw new Error('Restaurant ID is required');
    }

    // Get restaurant doc
    const restaurantRef = doc(db, 'restaurants', effectiveRestaurantId);
    const restaurantDoc = await getDoc(restaurantRef);

    if (!restaurantDoc.exists()) {
      console.warn('Restaurant not found:', effectiveRestaurantId);
      return {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        pendingOrders: 0,
        dailyRevenue: {},
        dailyOrders: {},
        topProducts: [],
        paymentMethodBreakdown: {}
      };
    }

    // Get stats from restaurant document
    const restaurantData = restaurantDoc.data();
    const stats = restaurantData?.stats || {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      pendingOrders: 0,
      dailyRevenue: {},
      dailyOrders: {},
      paymentMethodBreakdown: {},
      topProducts: []
    };

    // Filter stats based on selected period
    const now = new Date();
    const startDate = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'week':
        // Get current day of week (0 = Sunday, 1 = Monday, etc.)
        const currentDay = startDate.getDay();
        // Calculate days to subtract to get to Monday
        const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - daysToMonday);
        break;

      case 'month':
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(1);
        break;

      case 'year':
        startDate.setHours(0, 0, 0, 0);
        startDate.setMonth(0, 1);
        break;
    }

    // Filter daily stats for the selected period
    const filteredDailyRevenue: Record<string, number> = {};
    const filteredDailyOrders: Record<string, number> = {};
    let periodTotalRevenue = 0;
    let periodTotalOrders = 0;

    Object.entries(stats.dailyRevenue || {}).forEach(([date, amount]) => {
      const dateObj = new Date(date);
      if (dateObj >= startDate && dateObj <= endDate) {
        filteredDailyRevenue[date] = amount;
        periodTotalRevenue += Number(amount) || 0;
      }
    });

    Object.entries(stats.dailyOrders || {}).forEach(([date, count]) => {
      const dateObj = new Date(date);
      if (dateObj >= startDate && dateObj <= endDate) {
        filteredDailyOrders[date] = count;
        periodTotalOrders += Number(count) || 0;
      }
    });

    // Update stats with filtered data
    stats.dailyRevenue = filteredDailyRevenue;
    stats.dailyOrders = filteredDailyOrders;
    stats.totalRevenue = periodTotalRevenue;
    stats.totalOrders = periodTotalOrders;

    // Calculate average order value for the period
    stats.averageOrderValue = periodTotalOrders > 0 ? periodTotalRevenue / periodTotalOrders : 0;
    // Get pending orders count
    const ordersRef = collection(db, 'restaurants', effectiveRestaurantId, 'orders');
    const pendingOrdersQuery = query(
      ordersRef,
      where('status', 'in', ['pending', 'confirmed', 'preparing'])
    );
    const pendingOrdersSnapshot = await getDocs(pendingOrdersQuery);
    const pendingOrdersCount = pendingOrdersSnapshot.size;

    return {
      totalRevenue: stats.totalRevenue || 0,
      totalOrders: stats.totalOrders || 0, 
      averageOrderValue: stats.averageOrderValue || 0,
      pendingOrders: pendingOrdersCount,
      dailyRevenue: stats.dailyRevenue || {},
      dailyOrders: stats.dailyOrders || {},
      topProducts: stats.topProducts || [],
      paymentMethodBreakdown: stats.paymentMethodBreakdown || {}
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error instanceof Error ? error : new Error('Erreur lors du chargement des statistiques');
  }
}

async function getPreviousPeriodOrders(restaurantId: string, currentPeriodStart: Date): Promise<Order[]> {
  const periodLength = new Date().getTime() - currentPeriodStart.getTime();
  const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodLength);
  
  const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
  const q = query(
    ordersRef,
    where('createdAt', '>=', previousPeriodStart),
    where('createdAt', '<', currentPeriodStart)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date()
  })) as Order[];
}