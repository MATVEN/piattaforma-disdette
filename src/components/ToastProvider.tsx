/**
 * Toast Provider Component
 * Setup globale per react-hot-toast con styling personalizzato
 */

'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
    position="top-right"
    reverseOrder={false}
    gutter={8}
    containerStyle={{
        top: 80,  // Sotto la navbar
    }}
    toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: '#fff',
          color: '#1f2937',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '400px',
        },
        
        // Success style
        success: {
          duration: 3000,
          style: {
            background: '#dcfce7',
            border: '1px solid #10b981',
          },
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        
        // Error style
        error: {
          duration: 5000,
          style: {
            background: '#fee2e2',
            border: '1px solid #ef4444',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
        
        // Loading style
        loading: {
          style: {
            background: '#e0e7ff',
            border: '1px solid #6366f1',
          },
          iconTheme: {
            primary: '#6366f1',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}