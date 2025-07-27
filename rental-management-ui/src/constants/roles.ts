export const USER_ROLES = {
    ADMIN: 'Admin',
    OWNER: 'Owner',
    TENANT: 'Tenant'
} as const;

export const USER_ROLE_IDS = {
    ADMIN: 1,
    OWNER: 2,
    TENANT: 3
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type UserRoleId = typeof USER_ROLE_IDS[keyof typeof USER_ROLE_IDS];

// Helper function to get role name by ID
export const getRoleNameById = (roleId: number): UserRole => {
    switch (roleId) {
        case USER_ROLE_IDS.ADMIN:
            return USER_ROLES.ADMIN;
        case USER_ROLE_IDS.OWNER:
            return USER_ROLES.OWNER;
        case USER_ROLE_IDS.TENANT:
            return USER_ROLES.TENANT;
        default:
            throw new Error(`Unknown role ID: ${roleId}`);
    }
};

// Helper function to get role ID by name
export const getRoleIdByName = (roleName: string): UserRoleId => {
    switch (roleName) {
        case USER_ROLES.ADMIN:
            return USER_ROLE_IDS.ADMIN;
        case USER_ROLES.OWNER:
            return USER_ROLE_IDS.OWNER;
        case USER_ROLES.TENANT:
            return USER_ROLE_IDS.TENANT;
        default:
            throw new Error(`Unknown role name: ${roleName}`);
    }
}; 