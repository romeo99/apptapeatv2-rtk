import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { db } from '../config/firebase';
import type { Order, Restaurant } from '../types/firebase';

interface DateRange {
  start: Date;
  end: Date;
}

export async function getAccountingData(restaurantId: string, period: string, customRange?: DateRange) {
  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'custom':
        if (customRange) {
          startDate = customRange.start;
          endDate = customRange.end;
          endDate.setHours(23, 59, 59, 999);
        }
        break;
    }

    // Query orders from both collections
    const [historyRef, ordersRef] = [
      collection(db, 'restaurants', restaurantId, 'history'),
      collection(db, 'restaurants', restaurantId, 'orders')
    ];

    const [historyQuery, ordersQuery] = [
      query(historyRef, where('createdAt', '>=', startDate), where('createdAt', '<=', endDate)),
      query(ordersRef, where('createdAt', '>=', startDate), where('createdAt', '<=', endDate))
    ];

    const [historySnapshot, ordersSnapshot] = await Promise.all([
      getDocs(historyQuery),
      getDocs(ordersQuery)
    ]);

    // Combine and process orders
    const allOrders = [
      ...historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      })),
      ...ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }))
    ] as Order[];

    // Filter and sort orders
    const completedOrders = allOrders
      .filter(order => order.status === 'completed' || order.paymentStatus === 'paid')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Calculate daily metrics
    const dailyRevenue: Record<string, number> = {};
    const dailyOrders: Record<string, number> = {};

    completedOrders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + order.total;
      dailyOrders[dateKey] = (dailyOrders[dateKey] || 0) + 1;
    });

    // Calculate metrics
    const metrics = {
      totalRevenue: completedOrders.reduce((sum, order) => sum + order.total, 0),
      totalComptoir: completedOrders
        .filter(order => order.table === 'caisse')
        .reduce((sum, order) => sum + order.total, 0),
      orderCount: completedOrders.length,
      averageOrderValue: completedOrders.length > 0
        ? completedOrders.reduce((sum, order) => sum + order.total, 0) / completedOrders.length
        : 0,
      paymentMethodBreakdown: completedOrders.reduce((acc, order) => {
        const method = order.paymentMethod || 'unknown';
        acc[method] = (acc[method] || 0) + order.total;
        return acc;
      }, {} as Record<string, number>),
      dailyRevenue,
      dailyOrders
    };

    return {
      orders: completedOrders,
      metrics,
      dateRange: { startDate, endDate }
    };
  } catch (error) {
    console.error('Error fetching accounting data:', error);
    throw error;
  }
}

export async function exportAccountingData(
  restaurantId: string,
  format: 'pdf' | 'csv',
  period: string,
  customRange?: DateRange
) {
  try {
    const { orders, metrics, dateRange } = await getAccountingData(restaurantId, period, customRange);
    const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
    const restaurant = restaurantDoc.data();

    if (format === 'csv') {
      return generateCSV(orders, metrics, dateRange);
    } else {
      return generatePDF(orders, metrics, dateRange, restaurant);
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}

function generateCSV(orders: Order[], metrics: any, dateRange: { startDate: Date; endDate: Date }) {
  const headers = ['Date', 'N° Commande', 'Type'/* , 'Montant HT', 'TVA' */, 'Total', 'Paiement'];
  const rows = orders.map(order => [
    new Date(order.createdAt).toLocaleDateString('fr-FR'),
    order.orderNumber,
    order.type,
    /* (order.total - order.tax).toFixed(2),
    order.tax.toFixed(2), */
    order.total.toFixed(2),
    order.paymentMethod
  ]);

  // Add summary
  rows.push([]);
  rows.push(['Période', `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`]);
  rows.push(['CA Total', '', '', '', '', metrics.totalRevenue.toFixed(2)]);
  /* rows.push(['TVA Totale', '', '', '', '', metrics.totalTax.toFixed(2)]); */

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

async function generatePDF(orders: Order[], metrics: any, dateRange: any, restaurant: any) {
  // Create temporary container
  const container = document.createElement('div');
  container.style.padding = '20px';
  container.style.width = '800px';
  container.style.position = 'absolute';
  container.style.left = '-9999px';

  // Add content
  container.innerHTML = `
    <div style="margin-bottom: 30px;">
      <img src="https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png" style="height: 50px;" />
      <div style="float: right; text-align: right;">
        <h2 style="margin: 0; color: #10B981;">${restaurant?.name || ''}</h2>
        <p style="margin: 5px 0; color: #6B7280;">${restaurant?.address || ''}</p>
      </div>
    </div>
    
    <h1 style="font-size: 24px; margin-bottom: 10px;">Rapport comptable</h1>
    <p style="color: #6B7280; margin-bottom: 20px;">
      Période : ${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}
    </p>

    <div style="margin-bottom: 30px;">
      <div style="display: inline-block; margin-right: 50px;">
        <p style="margin: 0; color: #6B7280;">Chiffre d'affaires</p>
        <p style="margin: 0; font-size: 24px; color: #10B981;">${metrics.totalRevenue.toFixed(2)} €</p>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #F3F4F6;">
          <th style="text-align: left; padding: 8px;">Date</th>
          <th style="text-align: left; padding: 8px;">N° Commande</th>
          <th style="text-align: right; padding: 8px;">Montant</th>
          <th style="text-align: left; padding: 8px;">Paiement</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map(order => `
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 8px;">${new Date(order.createdAt).toLocaleDateString()}</td>
            <td style="padding: 8px;">${order.orderNumber}</td>
            <td style="padding: 8px; text-align: right;">${order.total.toFixed(2)} €</td>
            <td style="padding: 8px;">${order.paymentMethod === 'card' ? 'CB' :
      order.paymentMethod === 'cash' ? 'ESP' : 'AP'
    }</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  document.body.appendChild(container);

  try {
    // Convert to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      logging: false,
      useCORS: true
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Return blob
    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

export async function getTicketData(restaurant: Restaurant, startDate: Date, endDate: Date) {

  try {
    // Query orders from both collections
    const [historyRef, ordersRef] = [
      collection(db, 'restaurants', restaurant.id, 'history'),
      collection(db, 'restaurants', restaurant.id, 'orders')
    ];

    const [historyQuery, ordersQuery] = [
      query(historyRef, where('createdAt', '>=', startDate), where('createdAt', '<=', endDate)),
      query(ordersRef, where('createdAt', '>=', startDate), where('createdAt', '<=', endDate))
    ];

    const [historySnapshot, ordersSnapshot] = await Promise.all([
      getDocs(historyQuery),
      getDocs(ordersQuery)
    ]);

    // Combine and process orders
    const allOrders = [
      ...historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      })),
      ...ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }))
    ] as Order[];

    // Filter and sort orders
    const completedOrders = allOrders
      .filter(order => order.status === 'completed' || order.paymentStatus === 'paid')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Calculate daily metrics
    const revenue: Record<string, number> = {};
    const orders: Record<string, number> = {};

    completedOrders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      revenue[dateKey] = (revenue[dateKey] || 0) + order.total;
      orders[dateKey] = (orders[dateKey] || 0) + 1;
    });

    const dailyRevenue: number = Object.values(revenue).reduce((sum, value) => sum + value, 0);
    const dailyOrders: number = Object.values(orders).reduce((sum, value) => sum + value, 0);

    // Calculate metrics
    const metrics = {
      totalRevenue: completedOrders.reduce((sum, order) => sum + order.subtotal, 0),
      orderCount: completedOrders.length,
      averageOrderValue: completedOrders.length > 0
        ? completedOrders.reduce((sum, order) => sum + order.subtotal, 0) / completedOrders.length
        : 0,
      paymentMethodBreakdown: completedOrders.reduce((acc, order) => {
        const method = order.paymentMethod || 'unknown';
        acc[method] = { amount: (acc[method]?.amount || 0) + order.subtotal, count: (acc[method]?.count || 0) + 1 };
        return acc;
      }, {} as Record<string, Record<string, number>>),
      dailyRevenue,
      dailyOrders
    };

    return {
      orders: completedOrders,
      metrics,
    };
  } catch (error) {
    console.error('Error fetching accounting data:', error);
    throw error;
  }
}

export async function getZTicketData(restaurant: Restaurant) {

  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate = now //La date de debut et l'heure de debut de la journée
    startDate.setHours(0, 0, 0, 0); // Set to the start of the day
    let endDate = now; //La date de fin et l'heure de fin de la journée
    endDate.setHours(23, 59, 59, 999); // Set to the end of the day

    // Query orders from both collections
    const [historyRef, ordersRef] = [
      collection(db, 'restaurants', restaurant.id, 'history'),
      collection(db, 'restaurants', restaurant.id, 'orders')
    ];

    const [historyQuery, ordersQuery] = [
      query(historyRef, where('createdAt', '>=', startDate), where('createdAt', '<=', endDate)),
      query(ordersRef, where('createdAt', '>=', startDate), where('createdAt', '<=', endDate))
    ];

    const [historySnapshot, ordersSnapshot] = await Promise.all([
      getDocs(historyQuery),
      getDocs(ordersQuery)
    ]);

    // Combine and process orders
    const allOrders = [
      ...historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      })),
      ...ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }))
    ] as Order[];

    // Filter and sort orders
    const completedOrders = allOrders
      .filter(order => order.status === 'completed' || order.paymentStatus === 'paid')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Calculate daily metrics
    const revenue: Record<string, number> = {};
    const orders: Record<string, number> = {};

    completedOrders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      revenue[dateKey] = (revenue[dateKey] || 0) + order.total;
      orders[dateKey] = (orders[dateKey] || 0) + 1;
    });

    const dailyRevenue: number = Object.values(revenue).reduce((sum, value) => sum + value, 0);
    const dailyOrders: number = Object.values(orders).reduce((sum, value) => sum + value, 0);

    // Calculate metrics
    const metrics = {
      totalRevenue: completedOrders.reduce((sum, order) => sum + order.subtotal, 0),
      orderCount: completedOrders.length,
      averageOrderValue: completedOrders.length > 0
        ? completedOrders.reduce((sum, order) => sum + order.subtotal, 0) / completedOrders.length
        : 0,
      paymentMethodBreakdown: completedOrders.reduce((acc, order) => {
        const method = order.paymentMethod || 'unknown';
        acc[method] = { amount: (acc[method]?.amount || 0) + order.subtotal, count: (acc[method]?.count || 0) + 1 };
        return acc;
      }, {} as Record<string, Record<string, number>>),
      dailyRevenue,
      dailyOrders
    };

    return {
      orders: completedOrders,
      metrics,
    };
  } catch (error) {
    console.error('Error fetching accounting data:', error);
    throw error;
  }
}