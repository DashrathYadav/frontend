import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Building2,
  DoorOpen,
  UserCheck,
  TrendingUp,
  DollarSign,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { dashboardApi, propertyApi, rentTrackApi } from '../services/api';
import { useRoleAccess } from '../hooks';
import {
  USER_ROLES,
  getAvailabilityStatusValue,
  getAvailabilityStatusBadgeClass,
  AvailabilityStatus,
  RentStatus,
  getRentStatusValue,
  getRentStatusBadgeClass
} from '../constants';
import { formatDate, formatCurrency } from '../utils';
import { AdminOnly, AdminOrOwner } from '../components/RoleBasedRender';

const Dashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  // Fetch recent properties
  const { data: recentProperties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['recent-properties'],
    queryFn: () => propertyApi.search({
      pageNumber: 1,
      pageSize: 3,
      sortBy: 'creationDate',
      sortDirection: 'desc'
    }),
  });

  // Fetch recent rent tracks
  const { data: recentRents, isLoading: rentsLoading } = useQuery({
    queryKey: ['recent-rents'],
    queryFn: () => rentTrackApi.search({
      pageNumber: 1,
      pageSize: 5,
      sortBy: 'createdDate',
      sortDirection: 'desc'
    }),
  });

  const { isAdmin, isOwner } = useRoleAccess();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-error-600">Failed to load dashboard data</p>
      </div>
    );
  }

  // Define quick actions for different roles
  const adminActions = [
    { name: 'Add Owner', href: '/owners/new', icon: Users, color: 'bg-blue-500' },
    { name: 'Add Property', href: '/properties/new', icon: Building2, color: 'bg-green-500' },
    { name: 'Add Room', href: '/rooms/new', icon: DoorOpen, color: 'bg-purple-500' },
    { name: 'Add Tenant', href: '/tenants/new', icon: UserCheck, color: 'bg-orange-500' },
  ];

  const ownerActions = [
    { name: 'Add Property', href: '/properties/new', icon: Building2, color: 'bg-green-500' },
    { name: 'Add Room', href: '/rooms/new', icon: DoorOpen, color: 'bg-purple-500' },
    { name: 'Add Tenant', href: '/tenants/new', icon: UserCheck, color: 'bg-orange-500' },
  ];

  const quickActions = isAdmin() ? adminActions : isOwner() ? ownerActions : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your property management overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminOnly>
          <StatsCard
            title="Total Owners"
            value={stats?.totalOwners || 0}
            icon={Users}
          />
        </AdminOnly>
        <StatsCard
          title="Properties"
          value={stats?.totalProperties || 0}
          icon={Building2}
        />
        <StatsCard
          title="Rooms"
          value={stats?.totalRooms || 0}
          icon={DoorOpen}
        />
        <StatsCard
          title="Tenants"
          value={stats?.totalTenants || 0}
          icon={UserCheck}
        />
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        {quickActions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.name}
                  to={action.href}
                  className="group flex items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200"
                >
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 group-hover:text-primary-700">
                      {action.name}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors duration-200" />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No quick actions available for your role.</p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Properties</h2>
          {propertiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : recentProperties?.data && recentProperties.data.length > 0 ? (
            <div className="space-y-3">
              {recentProperties.data.map((property) => (
                <div key={property.propertyId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{property.propertyName}</p>
                    <p className="text-sm text-gray-600">
                      {property.address?.area && property.address?.city
                        ? `${property.address.area}, ${property.address.city}`
                        : property.address?.area || property.address?.city || 'Location not specified'
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {property.propertySize} • {formatCurrency(property.propertyRent, property.currencyCode)}
                    </p>
                  </div>
                  <span className={`badge-${getAvailabilityStatusBadgeClass(property.status)}`}>
                    {getAvailabilityStatusValue(property.status)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No properties found</p>
            </div>
          )}
          <Link
            to="/properties"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mt-4 text-sm font-medium"
          >
            View all properties
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Rents</h2>
          {rentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : recentRents?.data && recentRents.data.length > 0 ? (
            <div className="space-y-3">
              {recentRents.data.map((rent) => (
                <div key={rent.rentTrackId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Rent #{rent.rentTrackId}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(rent.rentPeriodStartDate)} - {formatDate(rent.rentPeriodEndDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`badge-${getRentStatusBadgeClass(rent.status)}`}>
                      {getRentStatusValue(rent.status)}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatCurrency(rent.expectedRentValue || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent rent records found</p>
            </div>
          )}
          <Link
            to="/rents"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mt-4 text-sm font-medium"
          >
            View all rent track
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;