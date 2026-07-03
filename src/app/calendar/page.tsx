'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../components/ui/toast';
import { getTrades } from '../../services/db';
import { Trade } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import TradeDetailModal from '../../components/trade/trade-detail-modal';
import TradeForm from '../../components/trade/trade-form';

export default function CalendarPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Selected day trade details
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);
  const [selectedDayTrades, setSelectedDayTrades] = useState<Trade[]>([]);

  // Detailed Modal states
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);

  const loadTrades = async () => {
    if (!user) return;
    try {
      const allTrades = await getTrades(user.id);
      setTrades(allTrades);
    } catch (err) {
      showToast('Failed to load calendar data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
    const handleRefresh = () => loadTrades();
    window.addEventListener('trade_saved', handleRefresh);
    return () => window.removeEventListener('trade_saved', handleRefresh);
  }, [user]);

  // Sync selected day trades if the main trade list updates
  useEffect(() => {
    if (selectedDayStr) {
      const dayTrades = trades.filter((t) => t.date === selectedDayStr);
      setSelectedDayTrades(dayTrades);
    }
  }, [trades, selectedDayStr]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayStr(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayStr(null);
  };

  // Days in month
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  // Create grid days array (prev month padding, current month, next month padding)
  const calendarCells = [];

  // 1. Prev Month Days padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayVal = prevMonthTotalDays - i;
    const paddingMonth = month === 0 ? 11 : month - 1;
    const paddingYear = month === 0 ? year - 1 : year;
    const dateStr = `${paddingYear}-${String(paddingMonth + 1).padStart(2, '0')}-${String(dayVal).padStart(2, '0')}`;
    calendarCells.push({ day: dayVal, isCurrentMonth: false, dateStr });
  }

  // 2. Current Month Days
  for (let i = 1; i <= totalDays; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarCells.push({ day: i, isCurrentMonth: true, dateStr });
  }

  // 3. Next Month Days padding (to complete the 42 cells matrix)
  const totalCells = 42;
  const nextMonthPadding = totalCells - calendarCells.length;
  for (let i = 1; i <= nextMonthPadding; i++) {
    const paddingMonth = month === 11 ? 0 : month + 1;
    const paddingYear = month === 11 ? year + 1 : year;
    const dateStr = `${paddingYear}-${String(paddingMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarCells.push({ day: i, isCurrentMonth: false, dateStr });
  }

  const handleDayClick = (dateStr: string) => {
    const dayTrades = trades.filter((t) => t.date === dateStr);
    setSelectedDayStr(dateStr);
    setSelectedDayTrades(dayTrades);
  };

  const getDayTradesPnL = (dateStr: string) => {
    const dayTrades = trades.filter((t) => t.date === dateStr);
    if (dayTrades.length === 0) return null;
    const sum = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
    return {
      pnl: sum,
      count: dayTrades.length,
    };
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-primary-main border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid (2/3 width) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Calendar Header Nav */}
        <div className="flex items-center justify-between border-b border-border-color pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-main/15 text-primary-main">
              <CalendarIcon size={18} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white leading-tight">
                {monthNames[month]} {year}
              </h2>
              <p className="text-[10px] text-fg-muted font-bold uppercase tracking-wider mt-0.5">Monthly Execution Map</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={prevMonth}
              className="p-2 border border-border-color hover:bg-bg-card-solid rounded-lg text-fg-muted hover:text-white transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 border border-border-color hover:bg-bg-card-solid rounded-lg text-xs font-semibold text-fg-muted hover:text-white transition-all"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-2 border border-border-color hover:bg-bg-card-solid rounded-lg text-fg-muted hover:text-white transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-fg-muted uppercase tracking-widest pb-1 border-b border-border-color/30">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Cells Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarCells.map((cell, idx) => {
            const stats = getDayTradesPnL(cell.dateStr);
            const isSelected = selectedDayStr === cell.dateStr;

            return (
              <div
                key={idx}
                onClick={() => handleDayClick(cell.dateStr)}
                className={`min-h-[85px] rounded-xl border p-2 flex flex-col justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary-main bg-primary-main/5 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                    : 'border-border-color hover:border-border-color-strong bg-bg-card-solid/40 hover:bg-bg-card'
                } ${cell.isCurrentMonth ? '' : 'opacity-30'}`}
              >
                <div className="flex justify-between items-center text-xs font-bold text-fg-muted">
                  <span className={cell.isCurrentMonth && new Date().toISOString().split('T')[0] === cell.dateStr ? 'text-primary-main font-extrabold underline' : ''}>
                    {cell.day}
                  </span>
                  {stats && (
                    <span className="text-[9px] px-1 bg-slate-900 border border-border-color rounded text-fg-muted">
                      {stats.count}
                    </span>
                  )}
                </div>

                {/* Day Return Badge */}
                {stats && (
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold block ${
                        stats.pnl > 0.1
                          ? 'text-success-main'
                          : stats.pnl < -0.1
                          ? 'text-danger-main'
                          : 'text-white'
                      }`}
                    >
                      {stats.pnl > 0 ? `+$${Math.round(stats.pnl)}` : stats.pnl < 0 ? `-$${Math.round(Math.abs(stats.pnl))}` : '$0'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details drawer/sidebar (1/3 width) */}
      <div className="p-5 rounded-2xl border border-border-color bg-bg-card-solid flex flex-col min-h-[400px]">
        <h3 className="font-bold text-white text-sm border-b border-border-color pb-3 mb-4 flex items-center justify-between">
          <span>Inspection Drawer</span>
          {selectedDayStr && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#1e293b] border border-slate-800 text-fg-muted">
              {selectedDayStr}
            </span>
          )}
        </h3>

        {selectedDayStr ? (
          selectedDayTrades.length > 0 ? (
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[450px]">
              <p className="text-xs text-fg-muted">
                Executed {selectedDayTrades.length} positions on this date:
              </p>
              {selectedDayTrades.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTrade(t)}
                  className="p-3.5 rounded-xl border border-border-color bg-[#0a0f1d]/60 hover:bg-bg-card-hover/20 cursor-pointer group transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-white group-hover:text-primary-main transition-colors flex items-center gap-1.5">
                        {t.symbol}
                        <span className="text-[10px] text-fg-muted font-normal">#{t.tradeNumber}</span>
                      </h4>
                      <span className="text-[10px] font-bold text-fg-muted tracking-wider uppercase block mt-0.5">
                        {t.type} {t.direction} • {t.timeframe}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`font-semibold text-sm block ${t.pnl > 0 ? 'text-success-main' : t.pnl < 0 ? 'text-danger-main' : 'text-white'}`}>
                        {t.pnl > 0 ? `+$${t.pnl}` : t.pnl < 0 ? `-$${Math.abs(t.pnl)}` : '$0.00'}
                      </span>
                      <span className="text-[10px] text-fg-muted block mt-0.5">{t.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <Layers className="text-fg-muted w-10 h-10 stroke-1 mb-2" />
              <p className="text-xs font-semibold text-fg-muted">No Trades Logged</p>
              <p className="text-[10px] text-fg-muted max-w-[180px] mt-1 leading-relaxed">
                You did not close any positions on this day.
              </p>
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
            <Layers className="text-fg-muted w-10 h-10 stroke-1 mb-2" />
            <p className="text-xs font-semibold text-fg-muted">Select Date</p>
            <p className="text-[10px] text-fg-muted max-w-[180px] mt-1 leading-relaxed">
              Click on any date in the calendar grid to inspect trades taken on that day.
            </p>
          </div>
        )}
      </div>

      {/* Trade detail Modal Overlay */}
      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
          onRefresh={loadTrades}
          onEdit={(t) => {
            setSelectedTrade(null);
            setEditingTrade(t);
          }}
        />
      )}

      {/* Editing trade Modal Overlay */}
      {editingTrade && (
        <TradeForm
          tradeToEdit={editingTrade}
          onClose={() => setEditingTrade(undefined)}
          onSuccess={loadTrades}
        />
      )}
    </div>
  );
}
