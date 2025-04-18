import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { Order } from '../../types/firebase';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40
  },
  logo: {
    width: 150
  },
  restaurantInfo: {
    alignItems: 'flex-end'
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981'
  },
  restaurantAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10
  },
  period: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 8
  },
  metric: {
    flex: 1
  },
  metricLabel: {
    fontSize: 12,
    color: '#374151'
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 4
  },
  table: {
    marginTop: 20
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 8,
    fontSize: 10
  },
  col1: { width: '20%' },
  col2: { width: '20%' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  col5: { width: '20%' }
});

interface AccountingDocumentProps {
  restaurant: any;
  orders: Order[];
  metrics: any;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export function AccountingDocument({ restaurant, orders, metrics, dateRange }: AccountingDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            src="https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png"
            style={styles.logo}
          />
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>{restaurant?.name}</Text>
            <Text style={styles.restaurantAddress}>{restaurant?.address}</Text>
          </View>
        </View>

        {/* Title & Period */}
        <Text style={styles.title}>Rapport comptable</Text>
        <Text style={styles.period}>
          Période : {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
        </Text>

        {/* Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Chiffre d'affaires</Text>
            <Text style={styles.metricValue}>{metrics.totalRevenue.toFixed(2)} €</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>TVA collectée</Text>
            <Text style={styles.metricValue}>{metrics.totalTax.toFixed(2)} €</Text>
          </View>
        </View>

        {/* Transactions Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Date</Text>
            <Text style={styles.col2}>N° Commande</Text>
            <Text style={styles.col3}>Montant</Text>
            <Text style={styles.col4}>TVA</Text>
            <Text style={styles.col5}>Paiement</Text>
          </View>

          {orders.map((order, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>
                {new Date(order.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.col2}>{order.orderNumber}</Text>
              <Text style={styles.col3}>{order.total.toFixed(2)} €</Text>
              <Text style={styles.col4}>{order.tax.toFixed(2)} €</Text>
              <Text style={styles.col5}>
                {order.paymentMethod === 'card' ? 'CB' :
                  order.paymentMethod === 'cash' ? 'ESP' : 'AP'}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}