import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
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
import TenantDocuments from './pages/tenants/TenantDocuments';
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
            <Route path="/register" element={<RegistrationPage />} />

            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Dashboard />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Dashboard />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/owners" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <OwnersList />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/owners/new" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <OwnerForm />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/properties" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <PropertiesList />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/properties/new" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <PropertyForm />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/properties/:id" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <PropertyDetail />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/properties/:id/edit" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <PropertyForm />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/rooms" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <RoomsList />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/rooms/new" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <RoomForm />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/rooms/:id" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <RoomDetail />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/rooms/:id/edit" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <RoomForm />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/tenants" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <TenantsList />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/tenants/new" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <TenantForm />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/tenants/:id" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <TenantDetail />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/tenants/:id/edit" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <TenantForm />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/tenants/:id/documents" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <TenantDocuments />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/rents" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <RentsList />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/rents/new" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <RentForm />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/rents/:id" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <RentDetail />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/rents/:id/edit" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <RentForm />
                </AuthenticatedLayout>
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