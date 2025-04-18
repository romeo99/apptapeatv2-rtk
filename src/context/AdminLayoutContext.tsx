import { createContext } from 'react';

interface AdminLayoutContextType {
  isRegisterMode: boolean;
}

export const AdminLayoutContext = createContext<AdminLayoutContextType>({
  isRegisterMode: false
});