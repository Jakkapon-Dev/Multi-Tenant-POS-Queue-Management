import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant, User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  tenants: Tenant[];
  currentTenant: Tenant | null;
  currentUser: User | null;
  currentRole: 'OWNER' | 'CASHIER' | 'KITCHEN' | 'CUSTOMER';
  activeView: 'CUSTOMER' | 'POS' | 'KDS' | 'DASHBOARD' | 'INVENTORY';
  setActiveView: (view: 'CUSTOMER' | 'POS' | 'KDS' | 'DASHBOARD' | 'INVENTORY') => void;
  switchTenant: (tenantId: string) => void;
  switchRole: (role: 'OWNER' | 'CASHIER' | 'KITCHEN' | 'CUSTOMER') => void;
  loading: boolean;
  refreshTenants: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<'OWNER' | 'CASHIER' | 'KITCHEN' | 'CUSTOMER'>('POS' as any);
  const [activeView, setActiveView] = useState<'CUSTOMER' | 'POS' | 'KDS' | 'DASHBOARD' | 'INVENTORY'>('POS');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await api.getTenants();
      setTenants(data);
      if (data.length > 0) {
        if (!currentTenant) {
          setCurrentTenant(data[0]);
          // Default user
          if (data[0].users && data[0].users.length > 0) {
            setCurrentUser(data[0].users[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const switchTenant = (tenantId: string) => {
    const found = tenants.find((t) => t.id === tenantId);
    if (found) {
      setCurrentTenant(found);
      if (found.users && found.users.length > 0) {
        setCurrentUser(found.users[0]);
      }
    }
  };

  const switchRole = (role: 'OWNER' | 'CASHIER' | 'KITCHEN' | 'CUSTOMER') => {
    setCurrentRole(role);
    if (role === 'CUSTOMER') setActiveView('CUSTOMER');
    else if (role === 'CASHIER') setActiveView('POS');
    else if (role === 'KITCHEN') setActiveView('KDS');
    else if (role === 'OWNER') setActiveView('DASHBOARD');
  };

  return (
    <AuthContext.Provider
      value={{
        tenants,
        currentTenant,
        currentUser,
        currentRole,
        activeView,
        setActiveView,
        switchTenant,
        switchRole,
        loading,
        refreshTenants: fetchTenants,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
