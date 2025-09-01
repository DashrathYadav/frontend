import React from 'react';
import { LookupProvider } from '../contexts/LookupContext';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import Layout from './Layout';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

// Inner component that uses the currency formatter hook
const AuthenticatedLayoutInner: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  // Initialize currency formatter with dynamic lookup data
  useCurrencyFormatter();
  
  return (
    <Layout>
      {children}
    </Layout>
  );
};

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  return (
    <LookupProvider>
      <AuthenticatedLayoutInner>
        {children}
      </AuthenticatedLayoutInner>
    </LookupProvider>
  );
};

export default AuthenticatedLayout;
