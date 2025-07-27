import React from 'react';
import {
  AvailabilityStatus,
  RentStatus,
  getAvailabilityStatusValue,
  getAvailabilityStatusBadgeClass,
  getRentStatusValue,
  getRentStatusBadgeClass
} from '../constants';

interface StatusBadgeProps {
  status: AvailabilityStatus | RentStatus | number;
  type?: 'availability' | 'rent' | 'tenant';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'availability' }) => {
  const getStatusConfig = () => {
    if (type === 'availability') {
      const label = getAvailabilityStatusValue(status);
      const className = `badge-${getAvailabilityStatusBadgeClass(status)}`;
      return { label, className };
    } else if (type === 'rent') {
      const label = getRentStatusValue(status);
      const className = `badge-${getRentStatusBadgeClass(status)}`;
      return { label, className };
    } else if (type === 'tenant') {
      return status ?
        { label: 'Active', className: 'badge-success' } :
        { label: 'Inactive', className: 'badge-error' };
    }

    return { label: 'Unknown', className: 'badge-secondary' };
  };

  const { label, className } = getStatusConfig();

  return (
    <span className={`badge ${className}`}>
      {label}
    </span>
  );
};

export default StatusBadge;