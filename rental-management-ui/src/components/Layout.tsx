import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Users,
  Building2,
  DoorOpen,
  UserCheck,
  TrendingUp,
  DollarSign,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRoleAccess } from '../hooks';
import { USER_ROLES } from '../constants';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const { user, isAdmin, isOwner, isTenant } = useRoleAccess();

  // Define all navigation items with role restrictions
  const allNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: TrendingUp, roles: [USER_ROLES.ADMIN, USER_ROLES.OWNER, USER_ROLES.TENANT] },
    { name: 'Owners', href: '/owners', icon: Users, roles: [USER_ROLES.ADMIN] },
    { name: 'Properties', href: '/properties', icon: Building2, roles: [USER_ROLES.ADMIN, USER_ROLES.OWNER] },
    { name: 'Rooms', href: '/rooms', icon: DoorOpen, roles: [USER_ROLES.ADMIN, USER_ROLES.OWNER] },
    { name: 'Tenants', href: '/tenants', icon: UserCheck, roles: [USER_ROLES.ADMIN, USER_ROLES.OWNER] },
    { name: 'Rent Track', href: '/rents', icon: DollarSign, roles: [USER_ROLES.ADMIN, USER_ROLES.OWNER, USER_ROLES.TENANT] },
  ];

  // Filter navigation based on user role
  const navigation = allNavigation.filter(item => {
    if (isAdmin()) return true; // Admin can see all navigation
    if (isOwner()) return item.roles.includes(USER_ROLES.OWNER);
    if (isTenant()) return item.roles.includes(USER_ROLES.TENANT);
    return false;
  });

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">RentWiz</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-2" />
                  <span className="font-medium">{user.fullName || user.loginId}</span>
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded-full">
                    {user.role}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-4">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${isActive
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-500'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;