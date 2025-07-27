import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import OwnersList from './pages/owners/OwnersList';
import OwnerForm from './pages/owners/OwnerForm';
import PropertiesList from './pages/properties/PropertiesList';
import PropertyForm from './pages/properties/PropertyForm';
import PropertyDetail from './pages/properties/PropertyDetail';
import RoomsList from './pages/rooms/RoomsList';
import RoomForm from './pages/rooms/RoomForm';
import RoomDetail from './pages/rooms/RoomDetail';
import TenantsList from './pages/tenants/TenantsList';
import TenantForm from './pages/tenants/TenantForm';
import TenantDetail from './pages/tenants/TenantDetail';
import RentsList from './pages/rents/RentsList';
import RentForm from './pages/rents/RentForm';
import RentDetail from './pages/rents/RentDetail';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/owners" element={
              <ProtectedRoute>
                <Layout>
                  <OwnersList />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/owners/new" element={
              <ProtectedRoute>
                <Layout>
                  <OwnerForm />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/properties" element={
              <ProtectedRoute>
                <Layout>
                  <PropertiesList />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/properties/new" element={
              <ProtectedRoute>
                <Layout>
                  <PropertyForm />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/properties/:id" element={
              <ProtectedRoute>
                <Layout>
                  <PropertyDetail />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/properties/:id/edit" element={
              <ProtectedRoute>
                <Layout>
                  <PropertyForm />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/rooms" element={
              <ProtectedRoute>
                <Layout>
                  <RoomsList />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/rooms/new" element={
              <ProtectedRoute>
                <Layout>
                  <RoomForm />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/rooms/:id" element={
              <ProtectedRoute>
                <Layout>
                  <RoomDetail />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/tenants" element={
              <ProtectedRoute>
                <Layout>
                  <TenantsList />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/tenants/new" element={
              <ProtectedRoute>
                <Layout>
                  <TenantForm />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/tenants/:id" element={
              <ProtectedRoute>
                <Layout>
                  <TenantDetail />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/rents" element={
              <ProtectedRoute>
                <Layout>
                  <RentsList />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/rents/new" element={
              <ProtectedRoute>
                <Layout>
                  <RentForm />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/rents/:id" element={
              <ProtectedRoute>
                <Layout>
                  <RentDetail />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Redirect root to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;