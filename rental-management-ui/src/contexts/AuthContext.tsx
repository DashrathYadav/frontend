import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { type UserRole } from '../constants';
import { decodeJwtToken, TokenStorage } from '../utils';
import { type LoginResponse, type ApiResponse } from '../types';

interface User {
    token: string;
    loginId?: string;
    role: UserRole; // "Admin", "Owner", "Tenant"
    roleId?: number; // 1, 2, 3
    userId?: number;
    fullName?: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (loginId: string, password: string, role: string) => Promise<boolean>;
    logout: () => Promise<void>;
    logoutAll: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check for existing token on app load
    useEffect(() => {
        const token = TokenStorage.getAccessToken();
        const refreshToken = TokenStorage.getRefreshToken();

        if (token && refreshToken) {
            try {
                // Decode JWT token to get user info
                const tokenPayload = decodeJwtToken(token);
                const roleId = parseInt(tokenPayload.roleId);

                // Check if token is expired (will be refreshed automatically by interceptor on next API call)
                const isExpired = TokenStorage.isTokenExpired();

                // Set authenticated even if expired - the interceptor will handle refresh
                setIsAuthenticated(true);
                setUser({
                    token,
                    role: tokenPayload.role as UserRole,
                    roleId: roleId,
                    userId: parseInt(tokenPayload.userId),
                });
            } catch (error) {
                // Token is invalid, remove it
                console.error('Invalid token on app load:', error);
                TokenStorage.clearTokens();
                setIsAuthenticated(false);
                setUser(null);
            }
        }
        setLoading(false);
    }, []);

    const login = async (loginId: string, password: string, role: string): Promise<boolean> => {
        try {
            setLoading(true);
            const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', { loginId, password, role });
            const data = response.data;

            if (data.status && data.data?.token && data.data?.refreshToken) {
                // CRITICAL: Store both access token and refresh token
                TokenStorage.saveTokens(data.data.token, data.data.refreshToken, 900); // 900 seconds = 15 minutes

                setIsAuthenticated(true);

                // Decode JWT token to get roleId
                const tokenPayload = decodeJwtToken(data.data.token);
                const roleId = parseInt(tokenPayload.roleId);

                setUser({
                    token: data.data.token,
                    loginId: data.data.loginId,
                    role: data.data.userType as UserRole,
                    roleId: roleId,
                    userId: data.data.owner?.ownerId || data.data.tenant?.tenantId || data.data.admin?.adminId,
                    fullName: data.data.owner?.fullName || data.data.tenant?.tenantName || data.data.admin?.adminName,
                });
                return true;
            } else {
                console.error('Login failed:', data.message);
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            const refreshToken = TokenStorage.getRefreshToken();
            if (refreshToken) {
                // Call backend API to revoke refresh token
                await api.post('/auth/logout', { refreshToken });
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Continue with local logout even if API call fails
        } finally {
            // Always clear tokens and reset state
            TokenStorage.clearTokens();
            setIsAuthenticated(false);
            setUser(null);
        }
    };

    const logoutAll = async () => {
        try {
            // Call backend API to revoke all refresh tokens for this user
            await api.post('/auth/logout-all');
        } catch (error) {
            console.error('Logout all error:', error);
            // Continue with local logout even if API call fails
        } finally {
            // Always clear tokens and reset state
            TokenStorage.clearTokens();
            setIsAuthenticated(false);
            setUser(null);
        }
    };

    const value: AuthContextType = {
        isAuthenticated,
        user,
        login,
        logout,
        logoutAll,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 