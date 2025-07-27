import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, Phone, MapPin, Users } from 'lucide-react';
import { ownerApi } from '../../services/api';
import ListPageWrapper from '../../components/ListPageWrapper';
import EntityCard, { EntityCardItem } from '../../components/EntityCard';
import { useEnhancedPagination } from '../../hooks/useEnhancedPagination';

const OwnersList: React.FC = () => {
  // Use enhanced pagination hook
  const {
    pagination,
    filters,
    searchTrigger,
    handlePageChange,
    handlePageSizeChange,
    handleSearchTermChange,
    handleSearch,
    handleFilterChange,
    handleClearFilters,
    updatePaginationData,
    getSearchParams,
    hasActiveFilters
  } = useEnhancedPagination({
    initialPageSize: 12,
    pageSizeOptions: [6, 12, 24, 48]
  });

  // Fetch owners with enhanced pagination
  const { data: ownersData, isLoading, error } = useQuery({
    queryKey: ['owners', searchTrigger, getSearchParams()],
    queryFn: () => ownerApi.getAll(),
  });

  // Update pagination data when query succeeds
  React.useEffect(() => {
    if (ownersData) {
      // For now, we'll use a simple pagination since ownerApi.search doesn't exist
      const totalRecords = ownersData.length;
      const totalPages = Math.ceil(totalRecords / pagination.pageSize);
      
      updatePaginationData({
        pageNumber: pagination.currentPage,
        pageSize: pagination.pageSize,
        totalPages,
        totalRecords,
        hasNextPage: pagination.currentPage < totalPages,
        hasPreviousPage: pagination.currentPage > 1
      });
    }
  }, [ownersData, pagination.currentPage, pagination.pageSize, updatePaginationData]);

  // Reset pagination on error
  React.useEffect(() => {
    if (error) {
      updatePaginationData({
        pageNumber: 1,
        pageSize: pagination.pageSize,
        totalPages: 0,
        totalRecords: 0,
        hasNextPage: false,
        hasPreviousPage: false
      });
    }
  }, [error, pagination.pageSize, updatePaginationData]);

  // Apply pagination to owners data
  const owners = React.useMemo(() => {
    if (!ownersData) return [];
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return ownersData.slice(startIndex, endIndex);
  }, [ownersData, pagination.currentPage, pagination.pageSize]);

  return (
    <ListPageWrapper
      title="Owners"
      subtitle="Manage property owners"
      addButtonText="Add Owner"
      addButtonUrl="/owners/new"
      isLoading={isLoading}
      error={error}
      data={owners}
      totalRecords={pagination.totalRecords}
      currentPage={pagination.currentPage}
      totalPages={pagination.totalPages}
      pageSize={pagination.pageSize}
      hasNextPage={pagination.hasNextPage}
      hasPreviousPage={pagination.hasPreviousPage}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      onSearch={handleSearch}
      onSearchChange={handleSearchTermChange}
      onFilterChange={handleFilterChange}
      onClearFilters={handleClearFilters}
      searchTerm={filters.searchTerm}
      filterValues={filters.filterValues}
      placeholder="Search owners by name, email, or phone..."
      emptyStateIcon={Users}
      emptyStateTitle="No owners found"
      emptyStateMessage="Get started by adding your first owner."
      hasActiveFilters={hasActiveFilters}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {owners.map((owner) => {
          const cardItem: EntityCardItem = {
            id: owner.ownerId,
            title: owner.fullName,
            subtitle: owner.note || 'No notes available',
            viewUrl: `/owners/${owner.ownerId}`,
            badges: [
              {
                label: owner.isActive ? 'Active' : 'Inactive',
                variant: owner.isActive ? 'default' as const : 'destructive' as const
              }
            ],
            details: [
              {
                icon: <Mail className="w-4 h-4" />,
                label: 'Email',
                value: owner.email || 'No email'
              },
              {
                icon: <Phone className="w-4 h-4" />,
                label: 'Mobile',
                value: owner.mobileNumber
              },
              {
                icon: <MapPin className="w-4 h-4" />,
                label: 'Location',
                value: owner.address ? `${owner.address.city}, ${owner.address.state}` : 'No address'
              }
            ]
          };

          return (
            <EntityCard
              key={owner.ownerId}
              item={cardItem}
            />
          );
        })}
      </div>
    </ListPageWrapper>
  );
};

export default OwnersList;