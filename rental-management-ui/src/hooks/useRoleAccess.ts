import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES, USER_ROLE_IDS } from '../constants/roles';

export const useRoleAccess = () => {
    const { user } = useAuth();

    const isAdmin = () => user?.role === USER_ROLES.ADMIN || user?.roleId === USER_ROLE_IDS.ADMIN;
    const isOwner = () => user?.role === USER_ROLES.OWNER || user?.roleId === USER_ROLE_IDS.OWNER;
    const isTenant = () => user?.role === USER_ROLES.TENANT || user?.roleId === USER_ROLE_IDS.TENANT;

    const hasRole = (role: string) => user?.role === role;
    const hasRoleId = (roleId: number) => user?.roleId === roleId;

    const canAccess = (allowedRoles: string[]) => {
        if (!user) return false;
        return allowedRoles.includes(user.role);
    };

    const canAccessById = (allowedRoleIds: number[]) => {
        if (!user) return false;
        return user.roleId && allowedRoleIds.includes(user.roleId);
    };

    return {
        user,
        isAdmin,
        isOwner,
        isTenant,
        hasRole,
        hasRoleId,
        canAccess,
        canAccessById,
    };
}; 