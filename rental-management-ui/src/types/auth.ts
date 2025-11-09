/**
 * Authentication Type Definitions
 *
 * TypeScript interfaces for authentication-related API requests and responses
 *
 * @module types/auth
 */

/**
 * Login response from /api/auth/login endpoint
 * Updated to include refresh token support (v1.6.0)
 */
export interface LoginResponse {
  token: string;
  refreshToken: string;
  userType: 'Owner' | 'Tenant' | 'Admin';
  loginId?: string;
  owner?: {
    ownerId: number;
    fullName: string;
    mobileNumber?: string;
    email?: string;
    address?: {
      addressId: number;
      street: string;
      city: string;
      pincode: string;
    };
  };
  tenant?: {
    tenantId: number;
    tenantName: string;
    tenantMobileNo?: string;
    tenantEmail?: string;
  };
  admin?: {
    adminId: number;
    adminName: string;
    email?: string;
  };
}

/**
 * Refresh token request for /api/auth/refresh endpoint
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response from /api/auth/refresh endpoint
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

/**
 * Logout request for /api/auth/logout endpoint
 */
export interface LogoutRequest {
  refreshToken: string;
}

/**
 * User role types
 */
export type UserRole = 'Admin' | 'Owner' | 'Tenant';
