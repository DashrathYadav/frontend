import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, Phone, MapPin, Users, Eye, Edit } from 'lucide-react';
import { ownerApi } from '../../services/api';
import ListPageWrapper from '../../components/ListPageWrapper';
import DataTable, { DataTableColumn, DataTableAction } from '../../components/DataTable';
import { useEnhancedPagination } from '../../hooks/useEnhancedPagination';
import { useLookup } from '../../contexts/LookupContext';

const OwnersList: React.FC = () => {
  const { getStateName } = useLookup();
  
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

  // Define table columns
  const columns: DataTableColumn<typeof owners[0]>[] = [
    {
      key: 'fullName',
      label: 'Owner Name',
      sortable: true,
      render: (owner) => (
        <div>
          <div className="font-medium text-gray-900">{owner.fullName}</div>
          <div className="text-sm text-gray-500 line-clamp-1">{owner.note || 'No notes available'}</div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (owner) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="w-4 h-4 text-gray-400" />
          <span>{owner.email || 'No email'}</span>
        </div>
      ),
    },
    {
      key: 'mobileNumber',
      label: 'Mobile',
      render: (owner) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="w-4 h-4 text-gray-400" />
          <span>{owner.mobileNumber}</span>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (owner) => (
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{owner.address ? `${owner.address.city}, ${getStateName(owner.address.stateId)}` : 'No address'}</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      align: 'center',
      render: (owner) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            owner.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {owner.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  // Define table actions
  const actions: DataTableAction<typeof owners[0]>[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      href: (owner) => `/owners/${owner.ownerId}`,
      variant: 'ghost',
    },
    {
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      href: (owner) => `/owners/${owner.ownerId}/edit`,
      variant: 'ghost',
    },
  ];

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
      <DataTable
        data={owners}
        columns={columns}
        actions={actions}
        getRowId={(owner) => owner.ownerId.toString()}
        emptyMessage="No owners found"
        hoverable
      />
    </ListPageWrapper>
  );
};

export default OwnersList;