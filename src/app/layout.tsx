import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/auth-context';
import { ThemeProvider } from '../context/theme-context';
import { ToastProvider } from '../components/ui/toast';
import LayoutWrapper from '../components/layout-wrapper';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Trading Journal - Premium Analytics & Notebook',
  description: 'A modern, responsive, and secure trading journal for professional assets tracking, psychological review, and market compliance.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-bg-main text-fg-main">
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <LayoutWrapper>{children}</LayoutWrapper>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
