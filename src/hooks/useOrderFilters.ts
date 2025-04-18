import { useState } from 'react';
import type { Order } from '../types/firebase';

export function useOrderFilters(orders: Order[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPayment = !selectedPaymentMethod || order.paymentMethod === selectedPaymentMethod;
    const matchesType = !selectedOrderType || order.type === selectedOrderType;
    const matchesStatus = !selectedStatus || order.status === selectedStatus;

    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const orderDate = new Date(order.createdAt);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      matchesDate = orderDate >= startDate && orderDate <= endDate;
    }

    return matchesSearch && matchesPayment && matchesType && matchesStatus && matchesDate;
  });

  return {
    filters: {
      searchQuery,
      selectedPaymentMethod,
      selectedOrderType,
      selectedStatus,
      dateRange
    },
    setters: {
      setSearchQuery,
      setSelectedPaymentMethod,
      setSelectedOrderType,
      setSelectedStatus,
      setDateRange
    },
    filteredOrders
  };
}