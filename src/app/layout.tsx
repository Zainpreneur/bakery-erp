import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/auth-provider';
import { ToastProvider } from '@/components/toast-provider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Crumb & Co. — Bakery Manager',
    template: '%s · Crumb & Co.',
  },
  description: 'Bakery operations dashboard for orders, recipes, inventory, customers and reporting.',
  applicationName: 'Crumb & Co. Bakery Manager',
};

export const viewport: Viewport = {
  themeColor: '#fdfaf5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
