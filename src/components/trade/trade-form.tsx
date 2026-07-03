'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../ui/toast';
import { addTrade, updateTrade, getTradeDraft, saveTradeDraft, clearTradeDraft } from '../../services/db';
import { Trade, MarketType, TradeType, TradeDirection, TradeStatus, TradeChecklist } from '../../types';
import { calculatePositionSize, calculatePnL, calculateRewardRatio } from '../../utils/calculations';
import { X, Upload, Trash, ClipboardCheck, Calculator, AlertTriangle, Eye, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface TradeFormProps {
  onClose: () => void;
  onSuccess: () => void;
  tradeToEdit?: Trade;
}

const DEFAULT_CHECKLIST: TradeChecklist = {
  trendConfirmed: false,
  riskCalculated: false,
  stopLossPlaced: false,
  targetIdentified: false,
  positionSizeCorrect: false,
  newsChecked: false,
  followedStrategy: false,
};

const EMOTIONS = ['Calm', 'Focused', 'Greedy', 'Fearful', 'FOMO', 'Confident', 'Anxious', 'Impulsive', 'Regretful', 'Relieved'];
const MISTAKES = ['FOMO Entry', 'Overleveraged', 'Moved Stop Loss', 'Chased Market', 'Early Exit', 'Overtraded', 'None'];

export default function TradeForm({ onClose, onSuccess, tradeToEdit }: TradeFormProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [market, setMarket] = useState<MarketType>('Crypto');
  const [exchange, setExchange] = useState<string>('');
  const [assetName, setAssetName] = useState<string>('');
  const [symbol, setSymbol] = useState<string>('');
  const [type, setType] = useState<TradeType>('BUY');
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [strategyUsed, setStrategyUsed] = useState<string>('');
  const [setupName, setSetupName] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('1h');
  
  // Numbers
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [takeProfit, setTakeProfit] = useState<number>(0);
  const [exitPrice, setExitPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [rewardRatio, setRewardRatio] = useState<number>(0);
  const [positionSize, setPositionSize] = useState<number>(0);
  const [fees, setFees] = useState<number>(0);
  const [pnl, setPnl] = useState<number>(0);
  const [pnlPercent, setPnlPercent] = useState<number>(0);
  const [status, setStatus] = useState<TradeStatus>('BREAKEVEN');

  // Psychological & Notes
  const [emotionBefore, setEmotionBefore] = useState<string>('Calm');
  const [emotionAfter, setEmotionAfter] = useState<string>('Calm');
  const [confidence, setConfidence] = useState<number>(5);
  const [selectedMistakes, setSelectedMistakes] = useState<string[]>([]);
  const [lessonsLearned, setLessonsLearned] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<TradeChecklist>(DEFAULT_CHECKLIST);

  // Modal control for the pre-save Checklist
  const [showChecklistModal, setShowChecklistModal] = useState<boolean>(false);

  // Load editing trade or draft
  useEffect(() => {
    if (tradeToEdit) {
      setDate(tradeToEdit.date);
      setTime(tradeToEdit.time);
      setMarket(tradeToEdit.market);
      setExchange(tradeToEdit.exchange);
      setAssetName(tradeToEdit.assetName);
      setSymbol(tradeToEdit.symbol);
      setType(tradeToEdit.type);
      setDirection(tradeToEdit.direction);
      setStrategyUsed(tradeToEdit.strategyUsed);
      setSetupName(tradeToEdit.setupName);
      setTimeframe(tradeToEdit.timeframe);
      setEntryPrice(tradeToEdit.entryPrice);
      setStopLoss(tradeToEdit.stopLoss);
      setTakeProfit(tradeToEdit.takeProfit);
      setExitPrice(tradeToEdit.exitPrice);
      setQuantity(tradeToEdit.quantity);
      setRiskPercent(tradeToEdit.riskPercent);
      setRewardRatio(tradeToEdit.rewardRatio);
      setPositionSize(tradeToEdit.positionSize);
      setFees(tradeToEdit.fees);
      setPnl(tradeToEdit.pnl);
      setPnlPercent(tradeToEdit.pnlPercent);
      setStatus(tradeToEdit.status);
      setEmotionBefore(tradeToEdit.emotionBefore);
      setEmotionAfter(tradeToEdit.emotionAfter);
      setConfidence(tradeToEdit.confidence);
      setSelectedMistakes(tradeToEdit.mistakes || []);
      setLessonsLearned(tradeToEdit.lessonsLearned);
      setNotes(tradeToEdit.notes);
      setImages(tradeToEdit.images || []);
      setChecklist(tradeToEdit.checklist || DEFAULT_CHECKLIST);
    } else if (user) {
      // Look for draft
      const draft = getTradeDraft(user.id);
      if (draft) {
        setDate(draft.date || date);
        setTime(draft.time || time);
        setMarket(draft.market || 'Crypto');
        setExchange(draft.exchange || '');
        setAssetName(draft.assetName || '');
        setSymbol(draft.symbol || '');
        setType(draft.type || 'BUY');
        setDirection(draft.direction || 'LONG');
        setStrategyUsed(draft.strategyUsed || '');
        setSetupName(draft.setupName || '');
        setTimeframe(draft.timeframe || '1h');
        setEntryPrice(draft.entryPrice || 0);
        setStopLoss(draft.stopLoss || 0);
        setTakeProfit(draft.takeProfit || 0);
        setExitPrice(draft.exitPrice || 0);
        setQuantity(draft.quantity || 0);
        setRiskPercent(draft.riskPercent || 1);
        setEmotionBefore(draft.emotionBefore || 'Calm');
        setEmotionAfter(draft.emotionAfter || 'Calm');
        setConfidence(draft.confidence || 5);
        setSelectedMistakes(draft.mistakes || []);
        setLessonsLearned(draft.lessonsLearned || '');
        setNotes(draft.notes || '');
        setImages(draft.images || []);
      }
    }
  }, [tradeToEdit, user]);

  // Draft Autosave Hook
  useEffect(() => {
    if (!tradeToEdit && user) {
      const draftObj = {
        date, time, market, exchange, assetName, symbol, type, direction,
        strategyUsed, setupName, timeframe, entryPrice, stopLoss, takeProfit,
        exitPrice, quantity, riskPercent, emotionBefore, emotionAfter, confidence,
        mistakes: selectedMistakes, lessonsLearned, notes, images
      };
      saveTradeDraft(user.id, draftObj);
    }
  }, [
    date, time, market, exchange, assetName, symbol, type, direction,
    strategyUsed, setupName, timeframe, entryPrice, stopLoss, takeProfit,
    exitPrice, quantity, riskPercent, emotionBefore, emotionAfter, confidence,
    selectedMistakes, lessonsLearned, notes, images, user, tradeToEdit
  ]);

  // Auto Calculations
  useEffect(() => {
    // 1. Position Sizing
    // We assume default balance of 10,000 for size calculations if user is loading details
    const balance = 10000;
    const { positionSize: calculatedSize } = calculatePositionSize({
      balance,
      riskPercent,
      entryPrice,
      stopLossPrice: stopLoss,
    });
    
    // Auto populate quantity if not manually modified
    if (quantity === 0 && calculatedSize > 0) {
      setQuantity(Number(calculatedSize.toFixed(4)));
    }
    setPositionSize(Number((calculatedSize * entryPrice).toFixed(2)));

    // 2. Reward Ratio
    const rr = calculateRewardRatio(direction, entryPrice, stopLoss, takeProfit);
    setRewardRatio(Number(rr.toFixed(2)));

    // 3. PnL
    const { pnl: calcPnl, pnlPercent: calcPct, status: calcStatus } = calculatePnL({
      direction,
      entryPrice,
      exitPrice,
      quantity: quantity || calculatedSize,
      fees,
    });
    setPnl(Number(calcPnl.toFixed(2)));
    setPnlPercent(Number(calcPct.toFixed(2)));
    setStatus(calcStatus);
  }, [direction, entryPrice, stopLoss, takeProfit, exitPrice, quantity, riskPercent, fees]);

  // Image upload base64 converter
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handlePreSaveCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !assetName || !entryPrice || !stopLoss) {
      showToast('Please fill in Symbol, Asset Name, Entry Price, and Stop Loss', 'error');
      return;
    }
    // Show checklist before final save
    setShowChecklistModal(true);
  };

  const handleFinalSave = async () => {
    if (!user) return;

    const tradeData: Omit<Trade, 'tradeNumber' | 'createdAt'> = {
      userId: user.id,
      date,
      time,
      market,
      exchange,
      assetName,
      symbol: symbol.toUpperCase(),
      type,
      direction,
      strategyUsed,
      setupName,
      timeframe,
      entryPrice,
      stopLoss,
      takeProfit,
      exitPrice,
      quantity,
      riskPercent,
      rewardRatio,
      positionSize,
      fees,
      pnl,
      pnlPercent,
      status,
      emotionBefore,
      emotionAfter,
      confidence,
      mistakes: selectedMistakes,
      lessonsLearned,
      notes,
      images,
      checklist,
      isFavorite: tradeToEdit?.isFavorite || false,
      isPinned: tradeToEdit?.isPinned || false,
      tags: tradeToEdit?.tags || [strategyUsed].filter(Boolean),
    };

    try {
      if (tradeToEdit && tradeToEdit.id) {
        await updateTrade({
          ...tradeData,
          id: tradeToEdit.id,
          tradeNumber: tradeToEdit.tradeNumber,
          createdAt: tradeToEdit.createdAt,
        });
        showToast('Trade updated successfully', 'success');
      } else {
        await addTrade({
          ...tradeData,
          createdAt: new Date().toISOString(),
        });
        clearTradeDraft(user.id);
        showToast('Trade logged successfully', 'success');
        
        // Trigger confetti for a winning trade!
        if (status === 'WIN') {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#10b981', '#3b82f6', '#ffffff']
          });
        }
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to save trade', 'error');
    }
  };

  const toggleChecklist = (key: keyof TradeChecklist) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleMistakeToggle = (mistake: string) => {
    setSelectedMistakes((prev) =>
      prev.includes(mistake) ? prev.filter((m) => m !== mistake) : [...prev, mistake]
    );
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="relative w-full max-w-4xl rounded-2xl glass-panel text-fg-main border border-border-color shadow-[0_25px_60px_rgba(0,0,0,0.6)] my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-color bg-bg-card-solid">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-main/15 border border-primary-main/30 text-primary-main">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {tradeToEdit ? `Edit Trade #${tradeToEdit.tradeNumber}` : 'Log New Position'}
              </h3>
              {!tradeToEdit && (
                <p className="text-xs text-fg-muted">Draft autosaves locally in your browser.</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-bg-card-hover text-fg-muted hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handlePreSaveCheck} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Market & Asset Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-primary-main uppercase tracking-widest border-b border-border-color pb-1.5">
              1. Market & Setup
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Asset Class</label>
                <select
                  value={market}
                  onChange={(e) => setMarket(e.target.value as MarketType)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
                >
                  <option value="Crypto">Crypto</option>
                  <option value="Forex">Forex</option>
                  <option value="Stocks">Stocks</option>
                  <option value="Options">Options</option>
                  <option value="Futures">Futures</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. BTCUSDT"
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm font-semibold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Asset Name</label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="e.g. Bitcoin"
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Exchange</label>
                <input
                  type="text"
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                  placeholder="e.g. Binance"
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Type</label>
                <div className="flex gap-2 p-0.5 bg-bg-card-solid rounded-lg border border-border-color">
                  <button
                    type="button"
                    onClick={() => setType('BUY')}
                    className={`flex-1 py-1 rounded text-xs font-semibold transition-all ${
                      type === 'BUY' ? 'bg-success-main/20 text-success-main' : 'text-fg-muted hover:text-white'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('SELL')}
                    className={`flex-1 py-1 rounded text-xs font-semibold transition-all ${
                      type === 'SELL' ? 'bg-danger-main/20 text-danger-main' : 'text-fg-muted hover:text-white'
                    }`}
                  >
                    SELL
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Direction</label>
                <div className="flex gap-2 p-0.5 bg-bg-card-solid rounded-lg border border-border-color">
                  <button
                    type="button"
                    onClick={() => setDirection('LONG')}
                    className={`flex-1 py-1 rounded text-xs font-semibold transition-all ${
                      direction === 'LONG' ? 'bg-primary-main/20 text-primary-main' : 'text-fg-muted hover:text-white'
                    }`}
                  >
                    LONG
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('SHORT')}
                    className={`flex-1 py-1 rounded text-xs font-semibold transition-all ${
                      direction === 'SHORT' ? 'bg-orange-500/20 text-orange-400' : 'text-fg-muted hover:text-white'
                    }`}
                  >
                    SHORT
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Strategy Used</label>
                <input
                  type="text"
                  value={strategyUsed}
                  onChange={(e) => setStrategyUsed(e.target.value)}
                  placeholder="e.g. SMC / Order Block"
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Setup Name</label>
                <input
                  type="text"
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  placeholder="e.g. MSS + FVG Fill"
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Timeframe</label>
                <input
                  type="text"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  placeholder="e.g. 5m, 15m, 1h, 4h"
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Numbers, Calculations and PnL */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-primary-main uppercase tracking-widest border-b border-border-color pb-1.5">
              2. Transaction Pricing & Analytics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Entry Price ($)</label>
                <input
                  type="number"
                  step="any"
                  value={entryPrice || ''}
                  onChange={(e) => setEntryPrice(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Stop Loss ($)</label>
                <input
                  type="number"
                  step="any"
                  value={stopLoss || ''}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Take Profit ($)</label>
                <input
                  type="number"
                  step="any"
                  value={takeProfit || ''}
                  onChange={(e) => setTakeProfit(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Exit Price ($)</label>
                <input
                  type="number"
                  step="any"
                  value={exitPrice || ''}
                  onChange={(e) => setExitPrice(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Risk Per Trade (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Quantity (Units)</label>
                <input
                  type="number"
                  step="any"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="Auto calculated"
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Fees ($)</label>
                <input
                  type="number"
                  step="any"
                  value={fees || ''}
                  onChange={(e) => setFees(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">R:R Ratio</label>
                <div className="w-full px-3 py-2 rounded-lg bg-[#0e172a] border border-border-color text-white text-sm font-bold flex items-center gap-1.5">
                  <Calculator size={14} className="text-fg-muted" />
                  {rewardRatio > 0 ? `${rewardRatio} R` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Calculations Output Summary Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-border-color bg-gradient-to-br from-bg-card-solid to-transparent">
              <div>
                <span className="block text-xs text-fg-muted uppercase mb-1">Position Value</span>
                <span className="text-base font-bold text-white">${positionSize.toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-xs text-fg-muted uppercase mb-1">PnL Result</span>
                <span
                  className={`text-base font-bold ${
                    pnl > 0
                      ? 'text-success-main'
                      : pnl < 0
                      ? 'text-danger-main'
                      : 'text-white'
                  }`}
                >
                  {pnl > 0 ? `+$${pnl.toLocaleString()}` : pnl < 0 ? `-$${Math.abs(pnl).toLocaleString()}` : '$0.00'}
                </span>
              </div>
              <div>
                <span className="block text-xs text-fg-muted uppercase mb-1">PnL Percentage</span>
                <span
                  className={`text-base font-bold ${
                    pnlPercent > 0
                      ? 'text-success-main'
                      : pnlPercent < 0
                      ? 'text-danger-main'
                      : 'text-white'
                  }`}
                >
                  {pnlPercent > 0 ? `+${pnlPercent}%` : pnlPercent < 0 ? `${pnlPercent}%` : '0.00%'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Psychology & Review */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-primary-main uppercase tracking-widest border-b border-border-color pb-1.5">
              3. Trading Psychology & Mistakes
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Emotion Before Trade</label>
                <select
                  value={emotionBefore}
                  onChange={(e) => setEmotionBefore(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
                >
                  {EMOTIONS.map((emo) => (
                    <option key={emo} value={emo}>
                      {emo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Emotion After Trade</label>
                <select
                  value={emotionAfter}
                  onChange={(e) => setEmotionAfter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
                >
                  {EMOTIONS.map((emo) => (
                    <option key={emo} value={emo}>
                      {emo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex justify-between text-xs font-medium text-fg-muted mb-1.5">
                  <span>Confidence Level</span>
                  <span className="text-primary-main font-bold">{confidence}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                  className="w-full h-2 bg-bg-card-solid rounded-lg appearance-none cursor-pointer accent-primary-main mt-2.5"
                />
              </div>
            </div>

            {/* Mistakes selection */}
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-2">Mistakes Made</label>
              <div className="flex flex-wrap gap-2">
                {MISTAKES.map((mistake) => {
                  const isSelected = selectedMistakes.includes(mistake);
                  return (
                    <button
                      key={mistake}
                      type="button"
                      onClick={() => handleMistakeToggle(mistake)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        isSelected
                          ? 'bg-red-500/10 border-red-500/40 text-red-400'
                          : 'bg-bg-card-solid border-border-color hover:border-border-color-strong text-fg-muted hover:text-white'
                      }`}
                    >
                      {mistake}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Lessons Learned</label>
                <textarea
                  rows={3}
                  value={lessonsLearned}
                  onChange={(e) => setLessonsLearned(e.target.value)}
                  placeholder="Summarize lessons learned from this trade..."
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Trade Notes / Execution Context</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record market context, news flow, or trade management details..."
                  className="w-full px-3 py-2 rounded-lg bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Screenshot Upload & Gallery */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-primary-main uppercase tracking-widest border-b border-border-color pb-1.5">
              4. Chart Screenshots & Markup
            </h4>
            
            {/* Upload Area */}
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border-color hover:border-primary-main/50 rounded-xl cursor-pointer bg-bg-card-solid hover:bg-bg-card transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-fg-muted mb-2 group-hover:scale-110 transition-transform" />
                  <p className="mb-1 text-sm text-white font-medium">Click to upload screenshots</p>
                  <p className="text-xs text-fg-muted">Support Entry, Exit, Markup images (Max 3MB per file)</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Gallery */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                {images.map((img, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden border border-border-color aspect-video bg-[#0d1426]">
                    <img src={img} alt={`Trade Attachment ${index}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                        title="Delete Image"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="flex justify-end gap-3 border-t border-border-color pt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-border-color hover:bg-bg-card text-sm text-fg-muted hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-primary-main hover:bg-primary-hover text-white text-sm font-semibold transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              Save Trade
            </button>
          </div>
        </form>

        {/* Pre-save Checklist Modal */}
        <AnimatePresence>
          {showChecklistModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-xl glass-panel text-fg-main border border-border-color shadow-2xl p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardCheck className="w-6 h-6 text-primary-main" />
                  <h4 className="font-bold text-lg text-white">Pre-Trade Compliance</h4>
                </div>
                
                <p className="text-xs text-fg-muted mb-4 leading-relaxed">
                  Verify compliance checkpoints before logging this transaction into your records.
                </p>

                <div className="space-y-3.5 mb-6">
                  {Object.keys(DEFAULT_CHECKLIST).map((key) => {
                    const typedKey = key as keyof TradeChecklist;
                    const isChecked = checklist[typedKey];
                    const labels: Record<keyof TradeChecklist, string> = {
                      trendConfirmed: 'Trend Confirmed',
                      riskCalculated: 'Risk Calculated (Position sizing validated)',
                      stopLossPlaced: 'Stop Loss Placed in trading terminal',
                      targetIdentified: 'Take Profit Target identified',
                      positionSizeCorrect: 'Position Size matched account leverage rules',
                      newsChecked: 'Economic News checked (no red folders soon)',
                      followedStrategy: 'Followed Strategy rules strictly',
                    };

                    return (
                      <label
                        key={key}
                        className="flex items-start gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleChecklist(typedKey)}
                          className="mt-0.5 w-4 h-4 rounded bg-bg-card-solid border-border-color text-primary-main focus:ring-primary-main accent-primary-main cursor-pointer"
                        />
                        <span className={`text-sm transition-colors ${isChecked ? 'text-white' : 'text-fg-muted group-hover:text-white'}`}>
                          {labels[typedKey]}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowChecklistModal(false)}
                    className="flex-1 py-2 rounded-xl border border-border-color text-sm text-fg-muted hover:text-white transition-all"
                  >
                    Back to Form
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalSave}
                    className="flex-1 py-2 rounded-xl bg-success-main hover:bg-success-main/90 text-white text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    Confirm & Save
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
