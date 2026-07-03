'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/auth-context';
import { useTheme } from '../context/theme-context';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Calendar,
  FileText,
  User,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calculator,
  Compass,
} from 'lucide-react';

interface SidebarProps {
  onCalculatorOpen: () => void;
}

export default function Sidebar({ onCalculatorOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapse state from localstorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, shortcut: 'D' },
    { name: 'Journal', path: '/journal', icon: BookOpen, shortcut: 'J' },
    { name: 'Calendar', path: '/calendar', icon: Calendar, shortcut: 'C' },
    { name: 'Analytics', path: '/analytics', icon: BarChart3, shortcut: 'A' },
    { name: 'Notes', path: '/notes', icon: FileText, shortcut: 'N' },
    { name: 'Profile & Goals', path: '/profile', icon: User, shortcut: 'P' },
  ];

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in inputs/textareas
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'd':
            router.push('/');
            break;
          case 'j':
            router.push('/journal');
            break;
          case 'c':
            router.push('/calendar');
            break;
          case 'a':
            router.push('/analytics');
            break;
          case 'n':
            router.push('/notes');
            break;
          case 'p':
            router.push('/profile');
            break;
          case 't':
            // Shortcut for new trade
            const btn = document.getElementById('new-trade-btn');
            if (btn) btn.click();
            break;
          case 'k':
            onCalculatorOpen();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, onCalculatorOpen]);

  // Hide sidebar on auth pages
  if (pathname && pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="no-print fixed top-0 left-0 z-30 h-full flex flex-col border-r border-border-color bg-[#0a0f1d]/90 backdrop-blur-md text-fg-main"
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border-color">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-main to-accent bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Compass className="w-5 h-5 text-white animate-pulse" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              T-Journal
            </span>
          )}
        </Link>
        <button
          onClick={toggleCollapse}
          className="p-1 rounded-md hover:bg-bg-card-hover border border-transparent hover:border-border-color transition-all"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group relative cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-main/20 to-transparent border-l-2 border-primary-main text-white'
                    : 'text-fg-muted hover:bg-bg-card hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={20}
                    className={`transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-primary-main' : 'text-fg-muted'
                    }`}
                  />
                  {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                </div>
                {!isCollapsed && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-border-color opacity-0 group-hover:opacity-100 transition-opacity bg-bg-card-solid text-fg-muted">
                    Alt+{item.shortcut}
                  </span>
                )}
                {isCollapsed && (
                  <div className="absolute left-16 px-2 py-1 bg-[#0d1426] border border-border-color rounded text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 transform translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-50">
                    {item.name} (Alt+{item.shortcut})
                  </div>
                )}
              </div>
            </Link>
          );
        })}

        {/* Risk Calculator Trigger Button */}
        <div
          onClick={onCalculatorOpen}
          className="flex items-center justify-between px-3 py-2.5 rounded-lg text-fg-muted hover:bg-bg-card hover:text-white transition-all group relative cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Calculator
              size={20}
              className="text-fg-muted group-hover:scale-110 transition-transform duration-200"
            />
            {!isCollapsed && <span className="text-sm font-medium">Calculator</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-border-color opacity-0 group-hover:opacity-100 transition-opacity bg-bg-card-solid text-fg-muted">
              Alt+K
            </span>
          )}
          {isCollapsed && (
            <div className="absolute left-16 px-2 py-1 bg-[#0d1426] border border-border-color rounded text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 transform translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-50">
              Calculator (Alt+K)
            </div>
          )}
        </div>
      </nav>

      {/* User Session and Theme Toggle Footer */}
      <div className="p-3 border-t border-border-color space-y-3 bg-[#070b14]/50">
        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 px-2 py-1">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.username}
                className="w-8 h-8 rounded-full border border-border-color object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 border border-border-color font-bold text-white text-sm">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-white leading-tight">
                  {user.username}
                </p>
                <p className="text-xs text-fg-muted truncate mt-0.5">{user.tradingStyle}</p>
              </div>
            )}
          </div>
        )}

        {/* Theme and Logout Operations */}
        <div className={`flex ${isCollapsed ? 'flex-col items-center gap-2' : 'items-center justify-between'} px-2`}>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-border-color hover:bg-bg-card transition-all text-fg-muted hover:text-white"
            title="Toggle Dark/Light Mode"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg border border-border-color hover:bg-red-950/20 hover:border-red-900/50 hover:text-red-400 transition-all text-fg-muted"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
