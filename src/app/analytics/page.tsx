'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../components/ui/toast';
import { getTrades } from '../../services/db';
import { Trade } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Award,
  AlertTriangle,
  Percent,
  Activity,
  Calendar,
  Layers,
  ArrowDownRight,
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
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTradesData() {
      if (!user) return;
      try {
        const allTrades = await getTrades(user.id);
        setTrades(allTrades);
      } catch (err) {
        showToast('Failed to load analytics', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadTradesData();
  }, [user]);

  // Calculations
  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.status === 'WIN');
  const losses = trades.filter((t) => t.status === 'LOSS');
  const breakEvens = trades.filter((t) => t.status === 'BREAKEVEN');

  const winRate = totalTrades > 0 ? (wins.length / (wins.length + losses.length || 1)) * 100 : 0;
  
  const totalProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
  const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit;
  const netProfit = totalProfit - totalLoss;

  const avgWin = wins.length > 0 ? totalProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLoss / losses.length : 0;

  const largestWin = wins.length > 0 ? Math.max(...wins.map((t) => t.pnl)) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map((t) => t.pnl)) : 0;

  const avgRewardRatio = totalTrades > 0 ? trades.reduce((sum, t) => sum + t.rewardRatio, 0) / totalTrades : 0;

  // 1. Equity & Drawdown (Chronological order)
  const sortedChronological = [...trades].sort(
    (a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()
  );

  const STARTING_BALANCE = user?.startingBalance || 10000;
  let balance = STARTING_BALANCE;
  let peakBalance = STARTING_BALANCE;
  
  const performanceTimeline = [
    { name: 'Start', Balance: STARTING_BALANCE, Drawdown: 0 }
  ];

  sortedChronological.forEach((t) => {
    balance += t.pnl;
    if (balance > peakBalance) {
      peakBalance = balance;
    }
    const drawdownAmount = peakBalance - balance;
    const drawdownPct = peakBalance > 0 ? (drawdownAmount / peakBalance) * 100 : 0;

    performanceTimeline.push({
      name: t.date.substring(5), // MM-DD
      Balance: Number(balance.toFixed(2)),
      Drawdown: Number(drawdownPct.toFixed(2)),
    });
  });

  // Aggregated charts data
  // 2. Performance by Strategy
  const strategyMap: { [strat: string]: { win: number; loss: number; pnl: number; count: number } } = {};
  trades.forEach((t) => {
    const strat = t.strategyUsed || 'Discretionary';
    if (!strategyMap[strat]) {
      strategyMap[strat] = { win: 0, loss: 0, pnl: 0, count: 0 };
    }
    strategyMap[strat].count += 1;
    strategyMap[strat].pnl += t.pnl;
    if (t.status === 'WIN') strategyMap[strat].win += 1;
    if (t.status === 'LOSS') strategyMap[strat].loss += 1;
  });

  const strategyChartData = Object.keys(strategyMap).map((strat) => ({
    name: strat,
    PnL: Number(strategyMap[strat].pnl.toFixed(2)),
    WinRate: Number(((strategyMap[strat].win / (strategyMap[strat].win + strategyMap[strat].loss || 1)) * 100).toFixed(1)),
  })).sort((a, b) => b.PnL - a.PnL);

  // 3. Performance by Timeframe
  const timeframeMap: { [tf: string]: number } = {};
  trades.forEach((t) => {
    const tf = t.timeframe || 'Unknown';
    timeframeMap[tf] = (timeframeMap[tf] || 0) + t.pnl;
  });
  const timeframeChartData = Object.keys(timeframeMap).map((tf) => ({
    name: tf,
    PnL: Number(timeframeMap[tf].toFixed(2)),
  })).sort((a, b) => b.PnL - a.PnL);

  // 4. Distribution by Asset Class
  const assetClassMap: { [market: string]: number } = {};
  trades.forEach((t) => {
    assetClassMap[t.market] = (assetClassMap[t.market] || 0) + t.pnl;
  });
  const assetChartData = Object.keys(assetClassMap).map((market) => ({
    name: market,
    value: Number(Math.max(0, assetClassMap[market]).toFixed(2)), // Keep positive values for Pie
    PnL: Number(assetClassMap[market].toFixed(2)),
  })).filter(item => Math.abs(item.PnL) > 0.01);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-primary-main border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-border-color pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            Advanced Analytics Portal
          </h2>
          <p className="text-xs text-fg-muted mt-1">Mathematical diagnostic checks on strategy efficacy, risk drawdown, and performance metrics.</p>
        </div>
      </div>

      {totalTrades === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-border-color bg-bg-card-solid max-w-lg mx-auto p-8">
          <BarChart3 className="text-fg-muted w-14 h-14 stroke-1 mb-4 mx-auto" />
          <h3 className="text-white font-bold text-md mb-1">Awaiting Data Compilation</h3>
          <p className="text-xs text-fg-muted leading-relaxed">
            Please log a set of trades inside your journal card deck. Once logged, advanced analytics will compile charts automatically.
          </p>
        </div>
      ) : (
        <>
          {/* Detailed Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border-color bg-bg-card-solid">
              <span className="text-[10px] text-fg-muted uppercase tracking-wider block font-bold">Profit Factor</span>
              <span className="text-lg font-bold text-white block mt-1">{profitFactor.toFixed(2)}</span>
              <span className="text-[10px] text-fg-muted mt-0.5 block">Total Profit / Total Loss</span>
            </div>

            <div className="p-4 rounded-xl border border-border-color bg-bg-card-solid">
              <span className="text-[10px] text-fg-muted uppercase tracking-wider block font-bold">Win / Loss Ratio</span>
              <span className="text-lg font-bold text-white block mt-1">
                {(wins.length / (losses.length || 1)).toFixed(2)}
              </span>
              <span className="text-[10px] text-fg-muted mt-0.5 block">{wins.length} Wins vs {losses.length} Losses</span>
            </div>

            <div className="p-4 rounded-xl border border-border-color bg-bg-card-solid">
              <span className="text-[10px] text-fg-muted uppercase tracking-wider block font-bold">Avg Win vs Avg Loss</span>
              <span className="text-lg font-bold text-white block mt-1">
                ${Math.round(avgWin)} / <span className="text-danger-main">${Math.round(avgLoss)}</span>
              </span>
              <span className="text-[10px] text-fg-muted mt-0.5 block">Expectancy ratio: {(avgWin / (avgLoss || 1)).toFixed(2)}</span>
            </div>

            <div className="p-4 rounded-xl border border-border-color bg-bg-card-solid">
              <span className="text-[10px] text-fg-muted uppercase tracking-wider block font-bold">Peak Drawdown</span>
              <span className="text-lg font-bold text-danger-main block mt-1">
                {performanceTimeline.length > 0 ? Math.max(...performanceTimeline.map((t) => t.Drawdown)) : 0}%
              </span>
              <span className="text-[10px] text-fg-muted mt-0.5 block">Max peak-to-trough drop</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border-color bg-bg-card-solid">
              <span className="text-[10px] text-fg-muted uppercase tracking-wider block font-bold">Largest Win</span>
              <span className="text-sm font-semibold text-success-main block mt-1">+${largestWin.toLocaleString()}</span>
            </div>

            <div className="p-4 rounded-xl border border-border-color bg-bg-card-solid">
              <span className="text-[10px] text-fg-muted uppercase tracking-wider block font-bold">Largest Loss</span>
              <span className="text-sm font-semibold text-danger-main block mt-1">-${Math.abs(largestLoss).toLocaleString()}</span>
            </div>

            <div className="p-4 rounded-xl border border-border-color bg-bg-card-solid">
              <span className="text-[10px] text-fg-muted uppercase tracking-wider block font-bold">Gross Return</span>
              <span className="text-sm font-semibold text-success-main block mt-1">+${totalProfit.toLocaleString()}</span>
            </div>

            <div className="p-4 rounded-xl border border-border-color bg-bg-card-solid">
              <span className="text-[10px] text-fg-muted uppercase tracking-wider block font-bold">Gross Loss</span>
              <span className="text-sm font-semibold text-danger-main block mt-1">-${totalLoss.toLocaleString()}</span>
            </div>
          </div>

          {/* Core Performance Timeline Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Equity Curve */}
            <div className="p-5 rounded-2xl border border-border-color bg-bg-card-solid flex flex-col min-h-[350px]">
              <h3 className="font-bold text-white text-sm mb-4">Account Equity Curve</h3>
              <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBalanceA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} domain={['dataMin - 500', 'dataMax + 500']} />
                    <Tooltip
                      contentStyle={{ background: '#0d1426', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      labelClassName="text-xs font-semibold text-white"
                    />
                    <Area type="monotone" dataKey="Balance" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorBalanceA)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Peak-to-Trough Drawdown Chart */}
            <div className="p-5 rounded-2xl border border-border-color bg-bg-card-solid flex flex-col min-h-[350px]">
              <h3 className="font-bold text-white text-sm mb-4 text-danger-main">Peak-to-Trough Drawdown (%)</h3>
              <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} domain={[0, 'dataMax + 2']} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: '#0d1426', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      labelClassName="text-xs font-semibold text-white"
                      itemStyle={{ color: '#ef4444' }}
                    />
                    <Area type="monotone" dataKey="Drawdown" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDrawdown)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Breakdown Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Strategy Efficacy */}
            <div className="p-5 rounded-2xl border border-border-color bg-bg-card-solid flex flex-col lg:col-span-2">
              <h3 className="font-bold text-white text-sm mb-4">PnL ($) by Strategy</h3>
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={strategyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0d1426', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      labelClassName="text-xs font-semibold text-white"
                    />
                    <Bar dataKey="PnL" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Market Distribution */}
            <div className="p-5 rounded-2xl border border-border-color bg-bg-card-solid flex flex-col">
              <h3 className="font-bold text-white text-sm mb-4">PnL Contribution by Asset</h3>
              <div className="w-full h-[280px] flex items-center justify-center relative">
                {assetChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {assetChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#0d1426', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ fontSize: '12px' }}
                        formatter={(value, name, props) => [`$${props.payload.PnL}`, name]}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-xs text-fg-muted italic">Awaiting positive returns distribution.</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeframe Analysis */}
            <div className="p-5 rounded-2xl border border-border-color bg-bg-card-solid flex flex-col">
              <h3 className="font-bold text-white text-sm mb-4">PnL ($) by Timeframe</h3>
              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeframeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0d1426', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      labelClassName="text-xs font-semibold text-white"
                    />
                    <Bar dataKey="PnL" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Win Rates by Strategy */}
            <div className="p-5 rounded-2xl border border-border-color bg-bg-card-solid flex flex-col">
              <h3 className="font-bold text-white text-sm mb-4">Win Rate (%) by Strategy</h3>
              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={strategyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: '#0d1426', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      labelClassName="text-xs font-semibold text-white"
                      formatter={(v) => `${v}%`}
                    />
                    <Bar dataKey="WinRate" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
