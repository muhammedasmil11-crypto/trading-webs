'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/auth-context';
import Sidebar from './sidebar';
import PositionCalculator from './trade/calculator';
import TradeForm from './trade/trade-form';
import { Plus, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isTradeFormOpen, setIsTradeFormOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Sync with sidebar local storage collapse status
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sidebar_collapsed');
      setIsSidebarCollapsed(saved === 'true');
    };

    handleStorageChange(); // initial check
    
    // Check local storage updates periodically since it's updated in Sidebar
    const interval = setInterval(handleStorageChange, 500);
    return () => clearInterval(interval);
  }, []);

  const handleTradeSuccess = () => {
    // Refresh active route data if possible or refresh window
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trade_saved'));
    }
  };

  const isAuthPage = pathname && pathname.startsWith('/auth');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#060913] text-white">
        <div className="w-10 h-10 border-4 border-primary-main border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-semibold tracking-wider text-fg-muted uppercase">Syncing Journal Database...</span>
      </div>
    );
  }

  // If not authenticated and not on login page, we let AuthProvider handle redirection
  if (!isAuthenticated && !isAuthPage) {
    return null;
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-bg-main text-fg-main">
      {/* Sidebar */}
      <Sidebar onCalculatorOpen={() => setIsCalculatorOpen(true)} />

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-200"
        style={{
          paddingLeft: isSidebarCollapsed ? '72px' : '260px',
        }}
      >
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 relative">
          {children}
        </main>
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-3.5 no-print">
        {/* Quick Position Calculator */}
        <button
          onClick={() => setIsCalculatorOpen(true)}
          className="p-3 bg-slate-900 border border-slate-800 text-fg-muted hover:text-white rounded-full hover:bg-slate-800 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          title="Open Calculator (Alt+K)"
        >
          <Calculator size={20} />
        </button>

        {/* Quick Log Trade */}
        <button
          id="new-trade-btn"
          onClick={() => setIsTradeFormOpen(true)}
          className="p-4 bg-primary-main text-white rounded-full hover:bg-primary-hover shadow-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:scale-110 transition-all flex items-center justify-center animate-bounce-slow"
          title="Log New Trade (Alt+T)"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Modals & Dialogs */}
      <AnimatePresence>
        {isTradeFormOpen && (
          <TradeForm
            onClose={() => setIsTradeFormOpen(false)}
            onSuccess={handleTradeSuccess}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCalculatorOpen && (
          <PositionCalculator
            isOpen={isCalculatorOpen}
            onClose={() => setIsCalculatorOpen(false)}
            initialBalance={user?.startingBalance || 10000}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
