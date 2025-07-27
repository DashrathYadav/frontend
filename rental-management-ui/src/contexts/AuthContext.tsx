import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { USER_ROLES, type UserRole } from '../constants';
import { decodeJwtToken } from '../utils';

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
    logout: () => void;
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
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                // Decode JWT token to get user info
                const tokenPayload = decodeJwtToken(token);
                const roleId = parseInt(tokenPayload.roleId);

                setIsAuthenticated(true);
                setUser({
                    token,
                    role: tokenPayload.role as UserRole,
                    roleId: roleId,
                    userId: parseInt(tokenPayload.userId),
                });
            } catch (error) {
                // Token is invalid, remove it
                localStorage.removeItem('authToken');
                setIsAuthenticated(false);
                setUser(null);
            }
        }
        setLoading(false);
    }, []);

    const login = async (loginId: string, password: string, role: string): Promise<boolean> => {
        try {
            setLoading(true);
            const response = await api.post('/auth/login', { loginId, password, role });
            const data = response.data;
            if (data.status && data.data?.token) {
                localStorage.setItem('authToken', data.data.token);
                setIsAuthenticated(true);
                // Decode JWT token to get roleId
                const tokenPayload = decodeJwtToken(data.data.token);
                const roleId = parseInt(tokenPayload.roleId);

                setUser({
                    token: data.data.token,
                    loginId: data.data.loginId,
                    role: data.data.userType as UserRole, // Use the actual role from backend response
                    roleId: roleId, // Extract roleId from JWT token
                    userId: data.data.owner?.ownerId || data.data.tenant?.tenantId,
                    fullName: data.data.owner?.fullName || data.data.tenant?.tenantName,
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

    const logout = () => {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
        setUser(null);
    };

    const value: AuthContextType = {
        isAuthenticated,
        user,
        login,
        logout,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 