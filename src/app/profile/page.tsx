'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../components/ui/toast';
import { getTrades, saveGoal, getGoalForPeriod } from '../../services/db';
import { exportBackupJSON, importBackupJSON, exportTradesCSV } from '../../services/backup';
import { MarketType, PerformanceGoal, Trade } from '../../types';
import {
  User,
  Goal,
  Shield,
  Download,
  Upload,
  Trophy,
  AlertTriangle,
  Award,
  Sparkles,
  Camera,
  Check,
} from 'lucide-react';

const MARKETS: MarketType[] = ['Crypto', 'Forex', 'Stocks', 'Options', 'Futures'];

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Form States
  const [tradingStyle, setTradingStyle] = useState('');
  const [experience, setExperience] = useState(1);
  const [preferredMarkets, setPreferredMarkets] = useState<MarketType[]>([]);
  const [avatar, setAvatar] = useState<string>('');
  const [startingBalance, setStartingBalance] = useState(10000);

  // Goals Form States
  const [monthlyProfitTarget, setMonthlyProfitTarget] = useState(1000);
  const [maxDailyLoss, setMaxDailyLoss] = useState(300);
  const [weeklyWinRateTarget, setWeeklyWinRateTarget] = useState(50);
  const [tradeCountTarget, setTradeCountTarget] = useState(10);
  const [goalId, setGoalId] = useState<string | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      // Load user profile details
      setTradingStyle(user.tradingStyle || '');
      setExperience(user.yearsOfExperience || 1);
      setPreferredMarkets(user.preferredMarkets || []);
      setAvatar(user.profilePicture || '');
      setStartingBalance(user.startingBalance || 10000);

      // Load trades for goal actual values calculation
      const allTrades = await getTrades(user.id);
      setTrades(allTrades);

      // Load goals for current month
      const currentMonth = new Date().toISOString().substring(0, 7);
      const activeGoal = await getGoalForPeriod(user.id, currentMonth);
      if (activeGoal) {
        setMonthlyProfitTarget(activeGoal.monthlyProfitTarget);
        setMaxDailyLoss(activeGoal.maxDailyLoss);
        setWeeklyWinRateTarget(activeGoal.weeklyWinRateTarget);
        setTradeCountTarget(activeGoal.tradeCountTarget);
        setGoalId(activeGoal.id);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load profile details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Actual Stats for current month to match against goals
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const currentMonthTrades = trades.filter((t) => t.date.startsWith(currentMonthStr));
  
  const monthProfit = currentMonthTrades.reduce((sum, t) => sum + t.pnl, 0);
  
  // Find maximum single-day loss in this month
  const dailyPnLMap: { [date: string]: number } = {};
  currentMonthTrades.forEach((t) => {
    dailyPnLMap[t.date] = (dailyPnLMap[t.date] || 0) + t.pnl;
  });
  const maxDayLossValue = Math.abs(Math.min(0, ...Object.values(dailyPnLMap)));

  const monthWins = currentMonthTrades.filter((t) => t.status === 'WIN');
  const monthLosses = currentMonthTrades.filter((t) => t.status === 'LOSS');
  const monthWinRate = currentMonthTrades.length > 0 ? (monthWins.length / (monthWins.length + monthLosses.length || 1)) * 100 : 0;
  
  const monthTradeCount = currentMonthTrades.length;

  // Profile Save
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await updateProfile({
        tradingStyle,
        yearsOfExperience: experience,
        preferredMarkets,
        profilePicture: avatar || undefined,
        startingBalance,
      });
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast('Profile update failed', 'error');
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleMarketChoice = (market: MarketType) => {
    setPreferredMarkets((prev) =>
      prev.includes(market) ? prev.filter((m) => m !== market) : [...prev, market]
    );
  };

  // Goals Save
  const handleGoalsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const currentMonth = new Date().toISOString().substring(0, 7);
      const savedId = await saveGoal({
        id: goalId,
        userId: user.id,
        monthlyProfitTarget,
        maxDailyLoss,
        weeklyWinRateTarget,
        tradeCountTarget,
        period: currentMonth,
        createdAt: new Date().toISOString(),
      });
      setGoalId(savedId);
      showToast('Goals updated successfully', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to save goals', 'error');
    }
  };

  // Backups
  const handleExportJSON = async () => {
    if (!user) return;
    try {
      await exportBackupJSON(user.id, user.username);
      showToast('JSON backup file created', 'success');
    } catch (err) {
      showToast('Backup export failed', 'error');
    }
  };

  const handleExportCSV = async () => {
    if (!user) return;
    try {
      await exportTradesCSV(user.id, user.username);
      showToast('CSV trades file exported', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'CSV export failed', 'error');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const res = await importBackupJSON(user.id, jsonStr);
        showToast(`Imported backup successfully: ${res.tradesCount} trades updated!`, 'success');
        loadData();
      } catch (err) {
        showToast('Invalid backup file structure or parse error', 'error');
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-primary-main border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile & Goals Panel (2/3 width) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Profile Settings Card */}
        <div className="p-5 rounded-2xl border border-border-color bg-bg-card-solid space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border-color pb-3 mb-2">
            <User className="text-primary-main w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Trading Profile Customizer</h3>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Profile Avatar Uploader */}
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile Avatar"
                    className="w-20 h-20 rounded-full object-cover border-2 border-border-color group-hover:border-primary-main transition-colors"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 border border-border-color flex items-center justify-center font-bold text-xl text-white group-hover:scale-105 transition-transform">
                    {user?.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white w-5 h-5" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="flex-1 w-full space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-fg-muted mb-1">Trading Style</label>
                    <input
                      type="text"
                      value={tradingStyle}
                      onChange={(e) => setTradingStyle(e.target.value)}
                      placeholder="e.g. Swing Trader / Scalper"
                      className="w-full px-3 py-2 rounded-lg bg-[#060913]/30 border border-border-color focus:border-primary-main focus:outline-none text-white text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-fg-muted mb-1">Experience (Years)</label>
                    <input
                      type="number"
                      value={experience}
                      onChange={(e) => setExperience(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 rounded-lg bg-[#060913]/30 border border-border-color focus:border-primary-main focus:outline-none text-white text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-fg-muted mb-1">Starting Balance ($)</label>
                    <input
                      type="number"
                      value={startingBalance}
                      onChange={(e) => setStartingBalance(Number(e.target.value))}
                      min="1"
                      className="w-full px-3 py-2 rounded-lg bg-[#060913]/30 border border-border-color focus:border-primary-main focus:outline-none text-white text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Markets Checklist */}
            <div>
              <label className="block text-xs font-semibold text-fg-muted mb-2">Preferred Asset Classes</label>
              <div className="flex flex-wrap gap-2">
                {MARKETS.map((market) => {
                  const isChecked = preferredMarkets.includes(market);
                  return (
                    <button
                      key={market}
                      type="button"
                      onClick={() => toggleMarketChoice(market)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        isChecked
                          ? 'bg-primary-main/20 border-primary-main text-white'
                          : 'bg-[#060913]/30 border-border-color text-fg-muted hover:text-white'
                      }`}
                    >
                      {market}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 bg-[#1e293b] hover:bg-slate-800 border border-slate-700 font-semibold rounded-xl text-xs text-white transition-all shadow-sm"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>

        {/* Goals Input Settings Card */}
        <div className="p-5 rounded-2xl border border-border-color bg-bg-card-solid space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border-color pb-3 mb-2">
            <Goal className="text-primary-main w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Monthly Target Performance Goals</h3>
          </div>

          <form onSubmit={handleGoalsSave} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-fg-muted mb-1.5">Monthly Profit Target ($)</label>
              <input
                type="number"
                value={monthlyProfitTarget}
                onChange={(e) => setMonthlyProfitTarget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#060913]/30 border border-border-color focus:border-primary-main focus:outline-none text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg-muted mb-1.5">Max Single-day Loss ($)</label>
              <input
                type="number"
                value={maxDailyLoss}
                onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#060913]/30 border border-border-color focus:border-primary-main focus:outline-none text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg-muted mb-1.5">Win Rate Target (%)</label>
              <input
                type="number"
                value={weeklyWinRateTarget}
                onChange={(e) => setWeeklyWinRateTarget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#060913]/30 border border-border-color focus:border-primary-main focus:outline-none text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg-muted mb-1.5">Trade Volume Target (Count)</label>
              <input
                type="number"
                value={tradeCountTarget}
                onChange={(e) => setTradeCountTarget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#060913]/30 border border-border-color focus:border-primary-main focus:outline-none text-white text-xs"
              />
            </div>

            <div className="col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 bg-primary-main hover:bg-primary-hover font-semibold rounded-xl text-xs text-white transition-all shadow-[0_0_15px_rgba(59,130,246,0.25)]"
              >
                Save Goals
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Stats Progress & Database Backups sidebar (1/3 width) */}
      <div className="space-y-6">
        {/* Goal Progress Bars Panel */}
        <div className="p-5 rounded-2xl border border-border-color bg-bg-card-solid space-y-4">
          <div className="flex items-center gap-2 border-b border-border-color pb-3 mb-2">
            <Trophy className="text-primary-main w-5 h-5 animate-pulse" />
            <h3 className="font-bold text-white text-sm">Targets Tracking</h3>
          </div>

          <div className="space-y-4">
            {/* Profit target progress */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-fg-muted">Monthly Return Target</span>
                <span className="text-white font-semibold">
                  ${Math.round(monthProfit)} / ${monthlyProfitTarget}
                </span>
              </div>
              <div className="w-full bg-[#060913]/40 h-2 rounded-full overflow-hidden border border-transparent">
                <div
                  className="bg-success-main h-full"
                  style={{ width: `${Math.min(100, Math.max(0, (monthProfit / monthlyProfitTarget) * 100))}%` }}
                />
              </div>
            </div>

            {/* Daily loss limit check */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-fg-muted">Max Single-day Loss</span>
                <span className={`font-semibold ${maxDayLossValue > maxDailyLoss ? 'text-danger-main font-bold' : 'text-white'}`}>
                  ${Math.round(maxDayLossValue)} / ${maxDailyLoss} limit
                </span>
              </div>
              <div className="w-full bg-[#060913]/40 h-2 rounded-full overflow-hidden border border-transparent">
                <div
                  className={`h-full ${maxDayLossValue > maxDailyLoss ? 'bg-danger-main' : 'bg-primary-main'}`}
                  style={{ width: `${Math.min(100, Math.max(0, (maxDayLossValue / maxDailyLoss) * 100))}%` }}
                />
              </div>
            </div>

            {/* Win rate Target check */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-fg-muted">Win Rate Target</span>
                <span className="text-white font-semibold">
                  {monthWinRate.toFixed(1)}% / {weeklyWinRateTarget}%
                </span>
              </div>
              <div className="w-full bg-[#060913]/40 h-2 rounded-full overflow-hidden border border-transparent">
                <div
                  className="bg-yellow-500 h-full"
                  style={{ width: `${Math.min(100, Math.max(0, (monthWinRate / weeklyWinRateTarget) * 100))}%` }}
                />
              </div>
            </div>

            {/* Trade count limit check */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-fg-muted">Trade Volume Target</span>
                <span className="text-white font-semibold">
                  {monthTradeCount} / {tradeCountTarget} trades
                </span>
              </div>
              <div className="w-full bg-[#060913]/40 h-2 rounded-full overflow-hidden border border-transparent">
                <div
                  className="bg-indigo-500 h-full"
                  style={{ width: `${Math.min(100, Math.max(0, (monthTradeCount / tradeCountTarget) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Database Backup & Restore Panel */}
        <div className="p-5 rounded-2xl border border-border-color bg-bg-card-solid space-y-4">
          <div className="flex items-center gap-2 border-b border-border-color pb-3 mb-2">
            <Shield className="text-primary-main w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Backup operations</h3>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center justify-between px-4 py-2 border border-border-color hover:bg-bg-card text-xs font-semibold text-white rounded-xl transition-all"
            >
              <span>Export trades as CSV (Excel)</span>
              <Download size={14} className="text-fg-muted" />
            </button>

            <button
              onClick={handleExportJSON}
              className="w-full flex items-center justify-between px-4 py-2 border border-border-color hover:bg-bg-card text-xs font-semibold text-white rounded-xl transition-all"
            >
              <span>Download full JSON backup</span>
              <Download size={14} className="text-fg-muted" />
            </button>

            <div className="h-px bg-border-color my-1" />

            <button
              onClick={() => backupInputRef.current?.click()}
              className="w-full flex items-center justify-between px-4 py-2 bg-[#1e293b] hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white rounded-xl transition-all"
            >
              <span>Restore backup from JSON</span>
              <Upload size={14} />
            </button>
            
            <input
              type="file"
              ref={backupInputRef}
              onChange={handleImportBackup}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
