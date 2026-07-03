'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/auth-context';
import { useToast } from '../components/ui/toast';
import { getTrades, getGoals, getGoalForPeriod } from '../services/db';
import { seedDemoData } from '../services/seed';
import { Trade, PerformanceGoal } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Activity,
  Layers,
  Calendar,
  Briefcase,
  ChevronRight,
  Sparkles,
  Database,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import TradeDetailModal from '../components/trade/trade-detail-modal';
import TradeForm from '../components/trade/trade-form';
import EconomicCalendar from '../components/widgets/economic-calendar';

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [trades, setTrades] = useState<Trade[]>([]);
  const [goal, setGoal] = useState<PerformanceGoal | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  
  const loadDashboardData = async () => {
    if (!user) return;
    try {
      const allTrades = await getTrades(user.id);
      
      // Sort trades chronologically for calculations, but store display order sorted by latest
      setTrades(allTrades.sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime()));
      
      const currentMonth = new Date().toISOString().substring(0, 7);
      const activeGoal = await getGoalForPeriod(user.id, currentMonth);
      setGoal(activeGoal);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Listen to custom trade saved event
    const handleRefresh = () => loadDashboardData();
    window.addEventListener('trade_saved', handleRefresh);
    return () => window.removeEventListener('trade_saved', handleRefresh);
  }, [user]);

  const handleSeedData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await seedDemoData(user.id);
      showToast('Demo trading database seeded successfully!', 'success');
      await loadDashboardData();
    } catch (err) {
      showToast('Failed to seed demo data', 'error');
      setIsLoading(false);
    }
  };

  // Math metrics
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.status === 'WIN');
  const losses = trades.filter(t => t.status === 'LOSS');
  const breakEvens = trades.filter(t => t.status === 'BREAKEVEN');
  
  const winRate = totalTrades > 0 ? (wins.length / (wins.length + losses.length || 1)) * 100 : 0;
  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  
  const STARTING_BALANCE = user?.startingBalance || 10000;
  const currentBalance = STARTING_BALANCE + totalPnL;
  const averageRisk = totalTrades > 0 ? trades.reduce((sum, t) => sum + t.riskPercent, 0) / totalTrades : 0;

  // Prepare Chart Data
  // 1. Equity Curve Data (chronological order)
  const sortedChronological = [...trades].sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  
  let runningBalance = STARTING_BALANCE;
  const equityCurveData = [
    { name: 'Start', Balance: STARTING_BALANCE },
    ...sortedChronological.map((t, idx) => {
      runningBalance += t.pnl;
      return {
        name: t.date.substring(5), // YYYY-MM-DD -> MM-DD
        Balance: Number(runningBalance.toFixed(2)),
      };
    })
  ];

  // 2. Weekly Performance Data (grouped by date)
  // Get last 7 trade entries grouped
  const dailyPnLMap: { [date: string]: number } = {};
  sortedChronological.slice(-10).forEach(t => {
    dailyPnLMap[t.date] = (dailyPnLMap[t.date] || 0) + t.pnl;
  });
  const dailyChartData = Object.keys(dailyPnLMap).map(d => ({
    date: d.substring(5),
    PnL: Number(dailyPnLMap[d].toFixed(2)),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-primary-main border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-color pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            Welcome back, {user?.username} <Sparkles size={18} className="text-primary-main animate-pulse" />
          </h2>
          <p className="text-xs text-fg-muted mt-1 font-medium flex items-center gap-1.5">
            <Calendar size={14} /> {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {totalTrades === 0 && (
          <button
            onClick={handleSeedData}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-main to-blue-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)]"
          >
            <Database size={16} />
            Simulate Demo Journal
          </button>
        )}
      </div>

      {/* Seeding Alert for New Users */}
      {totalTrades === 0 && (
        <div className="p-5 rounded-2xl glass-panel border border-primary-main/20 bg-primary-main/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles size={16} className="text-primary-main" /> Start Exploring Your Trading Dashboard
            </h4>
            <p className="text-xs text-fg-muted leading-relaxed">
              Your journal database is empty. You can write your first trade by clicking the floating <strong className="text-white">+ Button</strong> in the bottom right corner, or click the simulate button to seed the database with realistic logs.
            </p>
          </div>
          <button
            onClick={handleSeedData}
            className="px-4 py-2 bg-[#1e293b] hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white transition-all w-fit"
          >
            Populate Demo Dataset
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Current Balance */}
        <div className="p-4 rounded-2xl border border-border-color bg-bg-card-solid">
          <span className="text-[10px] text-fg-muted uppercase tracking-wider block font-bold">Balance</span>
          <span className="text-lg font-bold text-white block mt-1.5">${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          <span className="text-[10px] text-fg-muted mt-1 block">Baseline: $10,000</span>
        </div>

        {/* Profit/Loss */}
        <div className="p-4 rounded-2xl border border-border-color bg-bg-card-solid">
          <span className="text-[10px] text-fg-muted uppercase tracking-wider block font-bold">Total Return</span>
          <span className={`text-lg font-bold block mt-1.5 ${totalPnL > 0 ? 'text-success-main' : totalPnL < 0 ? 'text-danger-main' : 'text-white'}`}>
            {totalPnL > 0 ? `+$${totalPnL.toLocaleString()}` : totalPnL < 0 ? `-$${Math.abs(totalPnL).toLocaleString()}` : '$0.00'}
          </span>
          <span className="text-[10px] text-fg-muted mt-1 block flex items-center gap-0.5">
            {totalPnL > 0 ? <TrendingUp size={12} className="text-success-main" /> : totalPnL < 0 ? <TrendingDown size={12} className="text-danger-main" /> : null}
            {totalPnL > 0 ? `+${((totalPnL/STARTING_BALANCE)*100).toFixed(1)}%` : totalPnL < 0 ? `${((totalPnL/STARTING_BALANCE)*100).toFixed(1)}%` : '0.00%'} growth
          </span>
        </div>

        {/* Win Rate */}
        <div className="p-4 rounded-2xl border border-border-color bg-bg-card-solid">
          <span className="text-[10px] text-fg-muted uppercase tracking-wider block font-bold">Win Rate</span>
          <span className="text-lg font-bold text-primary-main block mt-1.5">{winRate.toFixed(1)}%</span>
          <span className="text-[10px] text-fg-muted mt-1 block">W: {wins.length} | L: {losses.length}</span>
        </div>

        {/* Total Trades */}
        <div className="p-4 rounded-2xl border border-border-color bg-bg-card-solid">
          <span className="text-[10px] text-fg-muted uppercase tracking-wider block font-bold">Total Trades</span>
          <span className="text-lg font-bold text-white block mt-1.5">{totalTrades}</span>
          <span className="text-[10px] text-fg-muted mt-1 block">BE: {breakEvens.length} positions</span>
        </div>

        {/* Goals Progress */}
        <div className="p-4 rounded-2xl border border-border-color bg-bg-card-solid">
          <span className="text-[10px] text-fg-muted uppercase tracking-wider block font-bold">Goal Target</span>
          <span className="text-lg font-bold text-white block mt-1.5">
            {goal ? `$${goal.monthlyProfitTarget}` : 'N/A'}
          </span>
          {goal ? (
            <div className="w-full bg-border-color h-1 rounded-full overflow-hidden mt-2 border border-transparent">
              <div
                className="bg-success-main h-full"
                style={{ width: `${Math.min(100, Math.max(0, (totalPnL / goal.monthlyProfitTarget) * 100))}%` }}
              />
            </div>
          ) : (
            <span className="text-[10px] text-fg-muted mt-1 block">No goal configured</span>
          )}
        </div>

        {/* Risk Percentage */}
        <div className="p-4 rounded-2xl border border-border-color bg-bg-card-solid">
          <span className="text-[10px] text-fg-muted uppercase tracking-wider block font-bold">Avg Risk</span>
          <span className="text-lg font-bold text-orange-400 block mt-1.5">{averageRisk.toFixed(2)}%</span>
          <span className="text-[10px] text-fg-muted mt-1 block">per trade sizing</span>
        </div>
      </div>

      {/* Charts Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Curve (2/3 width on desktop) */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border-color bg-bg-card-solid flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-white text-sm">Account Equity Curve</h3>
              <p className="text-xs text-fg-muted">Balance trajectory including aggregate closed P&L</p>
            </div>
            <Briefcase size={16} className="text-primary-main" />
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                  domain={['dataMin - 500', 'dataMax + 500']}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{ background: '#0d1426', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelClassName="text-xs font-semibold text-white"
                  itemStyle={{ fontSize: '12px', color: '#60a5fa' }}
                />
                <Area type="monotone" dataKey="Balance" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Profit Distribution (1/3 width on desktop) */}
        <div className="p-5 rounded-2xl border border-border-color bg-bg-card-solid flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-white text-sm">Recent Trades P&L</h3>
              <p className="text-xs text-fg-muted">Return breakdown of last 10 trading dates</p>
            </div>
            <Activity size={16} className="text-primary-main" />
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            {dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0d1426', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelClassName="text-xs font-semibold text-white"
                    itemStyle={{ fontSize: '12px', color: '#60a5fa' }}
                  />
                  <Bar
                    dataKey="PnL"
                    radius={[4, 4, 0, 0]}
                    fill="#3b82f6"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-fg-muted italic">
                Awaiting trade logs to compile returns distribution.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Trades & Economic Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trades Panel (2/3 width) */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border-color bg-bg-card-solid space-y-4">
          <div className="flex justify-between items-center border-b border-border-color pb-3">
            <h3 className="font-bold text-white text-sm">Recent Activity Log</h3>
            <span className="text-xs text-fg-muted flex items-center gap-1 cursor-pointer hover:text-white transition-colors" onClick={() => window.location.pathname = '/journal'}>
              View All Journal <ChevronRight size={14} />
            </span>
          </div>

          {trades.length > 0 ? (
            <div className="divide-y divide-border-color max-h-[350px] overflow-y-auto pr-1">
              {trades.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTrade(t)}
                  className="flex items-center justify-between py-3.5 hover:bg-bg-card-hover/20 cursor-pointer px-2 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.type === 'BUY' ? 'bg-success-main/10 text-success-main border border-success-main/20' : 'bg-danger-main/10 text-danger-main border border-danger-main/20'}`}>
                      {t.type}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm group-hover:text-primary-main transition-colors flex items-center gap-1.5">
                        {t.symbol}
                        <span className="text-[10px] text-fg-muted font-normal">#{t.tradeNumber}</span>
                      </h4>
                      <p className="text-xs text-fg-muted mt-0.5">{t.date} | {t.market}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`font-semibold text-sm ${t.pnl > 0 ? 'text-success-main' : t.pnl < 0 ? 'text-danger-main' : 'text-white'}`}>
                        {t.pnl > 0 ? `+$${t.pnl}` : t.pnl < 0 ? `-$${Math.abs(t.pnl)}` : '$0.00'}
                      </span>
                      <p className="text-[10px] text-fg-muted">{t.strategyUsed || 'Discretionary'}</p>
                    </div>
                    <ArrowUpRight size={16} className="text-fg-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <Layers className="text-fg-muted w-10 h-10 stroke-1 mb-2" />
              <p className="text-xs font-medium text-fg-muted">No journal cards recorded. Use the Quick Log button (+).</p>
            </div>
          )}
        </div>

        {/* Economic Calendar Widget Panel (1/3 width) */}
        <div className="p-5 rounded-2xl border border-border-color bg-bg-card-solid flex flex-col">
          <h3 className="font-bold text-white text-sm border-b border-border-color pb-3 mb-4">
            Economic Calendar
          </h3>
          <div className="flex-1 w-full h-[350px] overflow-hidden rounded-xl">
            <EconomicCalendar theme="dark" />
          </div>
        </div>
      </div>

      {/* Trade detail Modal Overlay */}
      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
          onRefresh={loadDashboardData}
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
          onSuccess={loadDashboardData}
        />
      )}
    </div>
  );
}
