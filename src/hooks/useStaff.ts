import { useState, useEffect } from 'react';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'server' | 'kitchen';
  status: 'active' | 'inactive';
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = 'staff_members';

export function useStaff(restaurantId: string = 'default-restaurant') {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data from localStorage
  useEffect(() => {
    try {
      const savedStaff = localStorage.getItem(STORAGE_KEY);
      if (savedStaff) {
        const parsedStaff = JSON.parse(savedStaff).map((member: any) => ({
          ...member,
          createdAt: new Date(member.createdAt),
          updatedAt: new Date(member.updatedAt)
        }));
        setStaff(parsedStaff.filter((member: StaffMember) => member.restaurantId === restaurantId));
      }
    } catch (err) {
      console.error('Error loading staff from localStorage:', err);
      setError('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  // Save to localStorage whenever staff changes
  useEffect(() => {
    try {
      const allStaff = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const otherStaff = allStaff.filter((member: StaffMember) => member.restaurantId !== restaurantId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...otherStaff, ...staff]));
    } catch (err) {
      console.error('Error saving staff to localStorage:', err);
    }
  }, [staff, restaurantId]);

  const addStaff = async (data: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newStaff = {
        ...data,
        id: `staff-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setStaff(prev => [...prev, newStaff]);
    } catch (err) {
      console.error('Error adding staff member:', err);
      throw err;
    }
  };

  const updateStaff = async (staffId: string, data: Partial<StaffMember>) => {
    try {
      setStaff(prev => prev.map(member => 
        member.id === staffId
          ? { ...member, ...data, updatedAt: new Date() }
          : member
      ));
    } catch (err) {
      console.error('Error updating staff member:', err);
      throw err;
    }
  };

  const deleteStaff = async (staffId: string) => {
    try {
      setStaff(prev => prev.filter(member => member.id !== staffId));
    } catch (err) {
      console.error('Error deleting staff member:', err);
      throw err;
    }
  };

  return {
    staff,
    loading,
    error,
    addStaff,
    updateStaff,
    deleteStaff
  };
}