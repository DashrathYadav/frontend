import React from 'react';
import { useRoleAccess } from '../hooks';
import { USER_ROLES } from '../constants';

interface RoleBasedRenderProps {
    children: React.ReactNode;
    allowedRoles: string[];
    fallback?: React.ReactNode;
}

export const RoleBasedRender: React.FC<RoleBasedRenderProps> = ({
    children,
    allowedRoles,
    fallback = null
}) => {
    const { canAccess } = useRoleAccess();

    if (canAccess(allowedRoles)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

// Convenience components for specific roles
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback
}) => (
    <RoleBasedRender allowedRoles={[USER_ROLES.ADMIN]} fallback={fallback}>
        {children}
    </RoleBasedRender>
);

export const OwnerOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback
}) => (
    <RoleBasedRender allowedRoles={[USER_ROLES.OWNER]} fallback={fallback}>
        {children}
    </RoleBasedRender>
);

export const AdminOrOwner: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback
}) => (
    <RoleBasedRender allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.OWNER]} fallback={fallback}>
        {children}
    </RoleBasedRender>
);

export const AdminOrOwnerOrTenant: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback
}) => (
    <RoleBasedRender allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.OWNER, USER_ROLES.TENANT]} fallback={fallback}>
        {children}
    </RoleBasedRender>
); 