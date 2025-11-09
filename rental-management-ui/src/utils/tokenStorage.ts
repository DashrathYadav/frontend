/**
 * Token Storage Utility
 *
 * Centralized utility for managing authentication tokens in localStorage.
 * Handles both access tokens and refresh tokens with expiry tracking.
 *
 * @module tokenStorage
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  TOKEN_EXPIRY: 'tokenExpiry',
} as const;

/**
 * Utility class for managing authentication tokens
 */
export const TokenStorage = {
  /**
   * Save both access and refresh tokens to localStorage
   *
   * @param accessToken - JWT access token
   * @param refreshToken - Refresh token for obtaining new access tokens
   * @param expiresIn - Token expiry duration in seconds (default: 900 = 15 minutes)
   */
  saveTokens(accessToken: string, refreshToken: string, expiresIn: number = 900): void {
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
  },

  /**
   * Retrieve access token from localStorage
   *
   * @returns Access token or null if not found
   */
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Retrieve refresh token from localStorage
   *
   * @returns Refresh token or null if not found
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Check if the access token is expired or will expire soon
   *
   * @param thresholdSeconds - Number of seconds before expiry to consider as "expired" (default: 60)
   * @returns true if token is expired or will expire within threshold
   */
  isTokenExpired(thresholdSeconds: number = 60): boolean {
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiry) return true;

    const expiryTime = parseInt(expiry, 10);
    const now = Date.now();
    const threshold = thresholdSeconds * 1000;

    // Consider token expired if it will expire within threshold period
    return now >= (expiryTime - threshold);
  },

  /**
   * Get token expiry timestamp
   *
   * @returns Expiry timestamp in milliseconds or null if not found
   */
  getTokenExpiry(): number | null {
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    return expiry ? parseInt(expiry, 10) : null;
  },

  /**
   * Clear all authentication tokens from localStorage
   */
  clearTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  },

  /**
   * Check if tokens exist in storage
   *
   * @returns true if both access and refresh tokens exist
   */
  hasTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken());
  },
};
