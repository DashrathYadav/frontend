import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options for all toasts
        duration: 4000,
        style: {
          background: '#fff',
          color: '#374151',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          fontSize: '14px',
          maxWidth: '400px',
        },

        // Customize based on type
        success: {
          duration: 4000,
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
          style: {
            borderLeft: '4px solid #10b981',
          },
        },

        error: {
          duration: 6000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
          style: {
            borderLeft: '4px solid #ef4444',
          },
        },

        loading: {
          duration: Infinity,
          iconTheme: {
            primary: '#3b82f6',
            secondary: '#fff',
          },
          style: {
            borderLeft: '4px solid #3b82f6',
          },
        },
      }}
    />
  );
};

export default ToastProvider;