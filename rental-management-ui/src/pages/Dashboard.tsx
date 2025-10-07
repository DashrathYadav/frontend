import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Building2,
  DoorOpen,
  UserCheck,
  TrendingUp,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import FinancialSummaryCard from '../components/FinancialSummaryCard';
import RoomOccupancyCard from '../components/RoomOccupancyCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { dashboardApi, rentTrackApi } from '../services/api';
import { useRoleAccess } from '../hooks';
import { useLookup } from '../contexts/LookupContext';
import { formatDate, formatCurrency } from '../utils';
import { AdminOnly } from '../components/RoleBasedRender';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, isOwner } = useRoleAccess();
  const { 
    getRentStatusName, 
    getRentStatusBadgeClass,
    isLoading: lookupsLoading,
    error: lookupsError,
    retryLookups
  } = useLookup();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    enabled: !lookupsLoading, // Wait for lookups to load first
  });

  // Fetch monthly summary (only for Admin/Owner)
  const { data: monthlySummary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['dashboard-monthly-summary'],
    queryFn: () => dashboardApi.getMonthlySummary(),
    enabled: !lookupsLoading && (isAdmin() || isOwner()), // Only fetch for Admin/Owner
  });

  // Fetch recent rent tracks
  const { data: recentRents, isLoading: rentsLoading } = useQuery({
    queryKey: ['recent-rents'],
    queryFn: () => rentTrackApi.search({
      pageNumber: 1,
      pageSize: 8,
      sortBy: 'createdDate',
      sortDirection: 'desc'
    }),
    enabled: !lookupsLoading, // Wait for lookups to load first
  });

  if (isLoading || lookupsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-error-600">{t('dashboard.errorLoadingData')}</p>
      </div>
    );
  }

  // Show warning if lookup data has issues but allow page to render
  const hasLookupIssues = lookupsError && lookupsError.includes('cached data');

  // Define quick actions for different roles
  const adminActions = [
    { name: t('dashboard.addOwner'), href: '/owners/new', icon: Users, color: 'bg-blue-500' },
    { name: t('dashboard.addProperty'), href: '/properties/new', icon: Building2, color: 'bg-green-500' },
    { name: t('dashboard.addRoom'), href: '/rooms/new', icon: DoorOpen, color: 'bg-purple-500' },
    { name: t('dashboard.addTenant'), href: '/tenants/new', icon: UserCheck, color: 'bg-orange-500' },
  ];

  const ownerActions = [
    { name: t('dashboard.addProperty'), href: '/properties/new', icon: Building2, color: 'bg-green-500' },
    { name: t('dashboard.addRoom'), href: '/rooms/new', icon: DoorOpen, color: 'bg-purple-500' },
    { name: t('dashboard.addTenant'), href: '/tenants/new', icon: UserCheck, color: 'bg-orange-500' },
  ];

  const quickActions = isAdmin() ? adminActions : isOwner() ? ownerActions : [];

  return (
    <div className="space-y-8">
      {/* Warning banner for lookup issues */}
      {hasLookupIssues && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-yellow-700">
                {lookupsError}
                <button
                  onClick={retryLookups}
                  className="ml-2 text-yellow-800 underline hover:text-yellow-900"
                >
                  {t('dashboard.retry')}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-gray-600 mt-2">{t('dashboard.welcomeMessage')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminOnly>
          <StatsCard
            title={t('dashboard.totalOwners')}
            value={stats?.totalOwners || 0}
            icon={Users}
          />
        </AdminOnly>
        <StatsCard
          title={t('dashboard.totalProperties')}
          value={stats?.totalProperties || 0}
          icon={Building2}
        />
        <StatsCard
          title={t('dashboard.totalRooms')}
          value={stats?.totalRooms || 0}
          icon={DoorOpen}
        />
        <StatsCard
          title={t('dashboard.totalTenants')}
          value={stats?.totalTenants || 0}
          icon={UserCheck}
        />
      </div>

      {/* Monthly Summary Section - Only for Admin/Owner */}
      {(isAdmin() || isOwner()) && (
        <>
          {summaryLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : summaryError ? (
            <div className="card p-6 bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm">{t('dashboard.errorLoadingSummary')}</p>
            </div>
          ) : monthlySummary ? (
            <>
              {/* Financial & Occupancy Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FinancialSummaryCard
                  monthName={monthlySummary.monthName}
                  totalExpectedRent={monthlySummary.totalExpectedRent}
                  totalCollectedRent={monthlySummary.totalCollectedRent}
                  totalPendingRent={monthlySummary.totalPendingRent}
                  collectionPercentage={monthlySummary.collectionPercentage}
                  currencySymbol={monthlySummary.currencySymbol}
                />
                <RoomOccupancyCard
                  totalRooms={monthlySummary.totalRooms}
                  occupiedRooms={monthlySummary.occupiedRooms}
                  availableRooms={monthlySummary.availableRooms}
                  occupancyPercentage={monthlySummary.occupancyPercentage}
                />
              </div>

              {/* Alerts Section */}
              {(monthlySummary.overduePaymentsCount > 0 || monthlySummary.expiringLeasesCount > 0) && (
                <div className="card p-6 bg-yellow-50 border border-yellow-200">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-yellow-900 mb-2">{t('dashboard.actionRequired')}</h3>
                      <div className="space-y-2">
                        {monthlySummary.overduePaymentsCount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-yellow-800">
                              {monthlySummary.overduePaymentsCount} {t('dashboard.overduePayment', { count: monthlySummary.overduePaymentsCount })}
                            </span>
                            <Link
                              to="/rents"
                              className="text-sm font-medium text-yellow-900 hover:text-yellow-700 underline"
                            >
                              {t('dashboard.viewDetails')}
                            </Link>
                          </div>
                        )}
                        {monthlySummary.expiringLeasesCount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-yellow-800">
                              {monthlySummary.expiringLeasesCount} {t('dashboard.expiringLease', { count: monthlySummary.expiringLeasesCount })}
                            </span>
                            <Link
                              to="/board-tenants"
                              className="text-sm font-medium text-yellow-900 hover:text-yellow-700 underline"
                            >
                              {t('dashboard.viewDetails')}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </>
      )}

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.quickActions')}</h2>
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
            <p>{t('dashboard.noQuickActions')}</p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.recentRents')}</h2>
          {rentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : recentRents?.data && recentRents.data.length > 0 ? (
            <div className="space-y-3">
              {recentRents.data.map((rent) => (
                  <div key={rent.rentTrackId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{rent.tenantName}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(rent.rentPeriodStartDate)} - {formatDate(rent.rentPeriodEndDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`badge-${getRentStatusBadgeClass(rent.statusId)}`}>
                        {getRentStatusName(rent.statusId)}
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
              <p>{t('dashboard.noRecentRents')}</p>
            </div>
          )}
          <Link
            to="/rents"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mt-4 text-sm font-medium"
          >
            {t('dashboard.viewAllRents')}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
      </div>
    </div>
  );
};

export default Dashboard;