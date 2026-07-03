'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../components/ui/toast';
import { getTrades } from '../../services/db';
import { Trade, MarketType, TradeDirection, TradeStatus } from '../../types';
import {
  Search,
  SlidersHorizontal,
  Bookmark,
  Calendar,
  Layers,
  Star,
  Pin,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  X,
  FileImage,
} from 'lucide-react';
import TradeDetailModal from '../../components/trade/trade-detail-modal';
import TradeForm from '../../components/trade/trade-form';

export default function JournalPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDirection, setSelectedDirection] = useState<string>('ALL');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('ALL');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('ALL');
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);

  // Modal controls
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);

  const loadTradesData = async () => {
    if (!user) return;
    try {
      const allTrades = await getTrades(user.id);
      // Sort: pinned first, then chronological descending
      const sorted = allTrades.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime();
      });
      setTrades(sorted);
      setFilteredTrades(sorted);
    } catch (err) {
      console.error(err);
      showToast('Failed to load journal trades', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTradesData();
    const handleRefresh = () => loadTradesData();
    window.addEventListener('trade_saved', handleRefresh);
    return () => window.removeEventListener('trade_saved', handleRefresh);
  }, [user]);

  // Apply Search & Filter Pipeline
  useEffect(() => {
    let result = [...trades];

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.assetName.toLowerCase().includes(q) ||
          (t.strategyUsed && t.strategyUsed.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }

    // Market Filter
    if (selectedMarket !== 'ALL') {
      result = result.filter((t) => t.market === selectedMarket);
    }

    // Status Filter
    if (selectedStatus !== 'ALL') {
      result = result.filter((t) => t.status === selectedStatus);
    }

    // Direction Filter
    if (selectedDirection !== 'ALL') {
      result = result.filter((t) => t.direction === selectedDirection);
    }

    // Timeframe Filter
    if (selectedTimeframe !== 'ALL') {
      result = result.filter((t) => t.timeframe.toUpperCase() === selectedTimeframe.toUpperCase());
    }

    // Strategy Filter
    if (selectedStrategy !== 'ALL') {
      result = result.filter((t) => t.strategyUsed === selectedStrategy);
    }

    setFilteredTrades(result);
  }, [searchQuery, selectedMarket, selectedStatus, selectedDirection, selectedTimeframe, selectedStrategy, trades]);

  // Distinct values for filter options
  const uniqueStrategies = Array.from(new Set(trades.map((t) => t.strategyUsed).filter(Boolean)));
  const uniqueTimeframes = Array.from(new Set(trades.map((t) => t.timeframe.toUpperCase()).filter(Boolean)));

  const getStatusColor = (status: string) => {
    if (status === 'WIN') return 'bg-success-main/15 text-success-main border-success-main/25';
    if (status === 'LOSS') return 'bg-danger-main/15 text-danger-main border-danger-main/25';
    return 'bg-slate-800 text-fg-muted border-slate-700';
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedMarket('ALL');
    setSelectedStatus('ALL');
    setSelectedDirection('ALL');
    setSelectedTimeframe('ALL');
    setSelectedStrategy('ALL');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-primary-main border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative min-h-screen">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-border-color pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            Trading Journal Logs
          </h2>
          <p className="text-xs text-fg-muted mt-1">Review, filter, and inspect your full execution logs history.</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Search Input */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-2.5 text-fg-muted w-4.5 h-4.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol, strategy, notes or tags..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3 text-fg-muted hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFiltersSidebar(!showFiltersSidebar)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all w-full sm:w-auto justify-center ${
            showFiltersSidebar
              ? 'bg-primary-main/20 border-primary-main text-white'
              : 'border-border-color bg-bg-card-solid text-fg-muted hover:text-white'
          }`}
        >
          <SlidersHorizontal size={16} />
          Filters
          {(selectedMarket !== 'ALL' || selectedStatus !== 'ALL' || selectedDirection !== 'ALL' || selectedTimeframe !== 'ALL' || selectedStrategy !== 'ALL') && (
            <span className="w-2 h-2 rounded-full bg-primary-main" />
          )}
        </button>
      </div>

      {/* Advanced Filters Expandable Bar */}
      {showFiltersSidebar && (
        <div className="p-5 rounded-2xl glass-panel border border-border-color bg-[#0a0f1d]/60 space-y-4">
          <div className="flex justify-between items-center border-b border-border-color pb-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-primary-main">Advanced Queries</h4>
            <button
              onClick={handleClearFilters}
              className="text-xs text-primary-main hover:underline font-semibold"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Market */}
            <div>
              <label className="block text-[10px] uppercase text-fg-muted font-bold mb-1.5">Asset Class</label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-bg-card-solid border border-border-color text-xs text-white focus:outline-none focus:border-primary-main"
              >
                <option value="ALL">All Markets</option>
                <option value="Crypto">Crypto</option>
                <option value="Forex">Forex</option>
                <option value="Stocks">Stocks</option>
                <option value="Options">Options</option>
                <option value="Futures">Futures</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] uppercase text-fg-muted font-bold mb-1.5">Outcome</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-bg-card-solid border border-border-color text-xs text-white focus:outline-none focus:border-primary-main"
              >
                <option value="ALL">All Status</option>
                <option value="WIN">Win</option>
                <option value="LOSS">Loss</option>
                <option value="BREAKEVEN">Break Even</option>
              </select>
            </div>

            {/* Direction */}
            <div>
              <label className="block text-[10px] uppercase text-fg-muted font-bold mb-1.5">Direction</label>
              <select
                value={selectedDirection}
                onChange={(e) => setSelectedDirection(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-bg-card-solid border border-border-color text-xs text-white focus:outline-none focus:border-primary-main"
              >
                <option value="ALL">All Directions</option>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </div>

            {/* Timeframe */}
            <div>
              <label className="block text-[10px] uppercase text-fg-muted font-bold mb-1.5">Timeframe</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-bg-card-solid border border-border-color text-xs text-white focus:outline-none focus:border-primary-main"
              >
                <option value="ALL">All Timeframes</option>
                {uniqueTimeframes.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </div>

            {/* Strategy */}
            <div>
              <label className="block text-[10px] uppercase text-fg-muted font-bold mb-1.5">Strategy</label>
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-bg-card-solid border border-border-color text-xs text-white focus:outline-none focus:border-primary-main"
              >
                <option value="ALL">All Strategies</option>
                {uniqueStrategies.map((strat) => (
                  <option key={strat} value={strat}>
                    {strat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {filteredTrades.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredTrades.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTrade(t)}
              className="group rounded-2xl glass-panel border border-border-color hover:border-border-color-strong transition-all duration-300 overflow-hidden cursor-pointer flex flex-col hover:shadow-xl hover:-translate-y-1 relative"
            >
              {/* Card Screenshot/Visual top header */}
              <div className="w-full aspect-video bg-[#0c1222] border-b border-border-color relative flex items-center justify-center overflow-hidden">
                {t.images && t.images.length > 0 ? (
                  <img
                    src={t.images[0]}
                    alt={t.symbol}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-fg-muted/65 group-hover:text-primary-main transition-colors">
                    <FileImage size={28} className="stroke-1" />
                    <span className="text-[10px] font-semibold tracking-widest uppercase">No Screenshots</span>
                  </div>
                )}

                {/* Favorite & Pinned floating indicators */}
                <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                  {t.isPinned && (
                    <div className="p-1 rounded-md bg-orange-500/10 border border-orange-500/25 text-orange-400">
                      <Pin size={12} />
                    </div>
                  )}
                  {t.isFavorite && (
                    <div className="p-1 rounded-md bg-yellow-500/10 border border-yellow-500/25 text-yellow-400">
                      <Star size={12} />
                    </div>
                  )}
                </div>

                {/* Floating outcome badge */}
                <span className={`absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(t.status)}`}>
                  {t.status}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-bg-card-solid/65">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-md group-hover:text-primary-main transition-colors flex items-center gap-1">
                      {t.symbol}
                      <span className="text-[10px] text-fg-muted font-normal">#{t.tradeNumber}</span>
                    </h3>
                    <span className={`font-bold text-sm ${t.pnl > 0 ? 'text-success-main' : t.pnl < 0 ? 'text-danger-main' : 'text-white'}`}>
                      {t.pnl > 0 ? `+$${t.pnl}` : t.pnl < 0 ? `-$${Math.abs(t.pnl)}` : '$0.00'}
                    </span>
                  </div>

                  <p className="text-[10px] font-bold text-fg-muted tracking-wider uppercase flex items-center gap-1.5">
                    {t.market} • {t.type} {t.direction} • {t.timeframe}
                  </p>

                  <p className="text-xs text-fg-muted line-clamp-2 leading-relaxed pt-1.5">
                    {t.notes || t.lessonsLearned || 'No comments or context annotated.'}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="flex justify-between items-center pt-3 border-t border-border-color/60 text-[10px] text-fg-muted font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {t.date}
                  </span>
                  <span>{t.strategyUsed || 'Discretionary'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <Layers className="text-fg-muted w-14 h-14 stroke-1 mb-4" />
          <h3 className="text-white font-bold text-md mb-1">No matches found</h3>
          <p className="text-xs text-fg-muted leading-relaxed">
            Your searches didn't return any logs. Try broadening your keywords or resetting active filtration widgets.
          </p>
          <button
            onClick={handleClearFilters}
            className="mt-4 px-4 py-2 bg-[#1e293b] border border-slate-800 rounded-xl text-xs font-semibold text-white hover:bg-slate-800 transition-all"
          >
            Clear Active Filters
          </button>
        </div>
      )}

      {/* Trade detail Modal Overlay */}
      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
          onRefresh={loadTradesData}
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
          onSuccess={loadTradesData}
        />
      )}
    </div>
  );
}
