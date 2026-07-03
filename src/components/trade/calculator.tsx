'use client';

import React, { useState, useEffect } from 'react';
import { X, Calculator, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  initialBalance?: number;
}

export default function PositionCalculator({ isOpen, onClose, initialBalance = 10000 }: CalculatorProps) {
  const [balance, setBalance] = useState<number>(initialBalance);
  const [riskPercent, setRiskPercent] = useState<number>(1); // default 1%
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number>(0);
  
  // Calculations
  const [riskAmount, setRiskAmount] = useState<number>(0);
  const [slPercent, setSlPercent] = useState<number>(0);
  const [positionSize, setPositionSize] = useState<number>(0);
  const [positionCost, setPositionCost] = useState<number>(0);

  useEffect(() => {
    // Risk Amount = Balance * (Risk % / 100)
    const riskAmt = balance * (riskPercent / 100);
    setRiskAmount(riskAmt);

    if (entryPrice > 0 && stopLoss > 0) {
      // SL distance = |Entry - SL|
      const slDistance = Math.abs(entryPrice - stopLoss);
      // SL distance % = (SL distance / Entry) * 100
      const slPct = (slDistance / entryPrice) * 100;
      setSlPercent(slPct);

      // Position Size (Qty) = Risk Amount / SL distance
      if (slDistance > 0) {
        const qty = riskAmt / slDistance;
        setPositionSize(qty);
        // Position Cost (Notional Value) = Qty * Entry
        setPositionCost(qty * entryPrice);
      } else {
        setPositionSize(0);
        setPositionCost(0);
      }
    } else {
      setSlPercent(0);
      setPositionSize(0);
      setPositionCost(0);
    }
  }, [balance, riskPercent, entryPrice, stopLoss]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl glass-panel text-fg-main border border-border-color shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-color bg-bg-card-solid">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary-main" />
              <h3 className="font-bold text-lg text-white">Risk & Position Calculator</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-bg-card-hover text-fg-muted hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Balance */}
            <div>
              <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">
                Account Balance ($)
              </label>
              <input
                type="number"
                value={balance || ''}
                onChange={(e) => setBalance(Number(e.target.value))}
                placeholder="e.g. 10000"
                className="w-full px-4 py-2.5 rounded-xl bg-bg-card-solid border border-border-color hover:border-border-color-strong focus:border-primary-main focus:outline-none text-white text-sm"
              />
            </div>

            {/* Risk % */}
            <div>
              <label className="flex justify-between text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">
                <span>Risk Percentage (%)</span>
                <span className="text-primary-main font-bold">{riskPercent}%</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  className="flex-1 h-1.5 rounded-lg bg-bg-card-solid appearance-none cursor-pointer accent-primary-main"
                />
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  className="w-20 px-3 py-1 rounded-lg bg-bg-card-solid border border-border-color text-center text-white text-sm focus:outline-none focus:border-primary-main"
                />
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">
                  Entry Price ($)
                </label>
                <input
                  type="number"
                  value={entryPrice || ''}
                  onChange={(e) => setEntryPrice(Number(e.target.value))}
                  placeholder="e.g. 50000"
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-card-solid border border-border-color hover:border-border-color-strong focus:border-primary-main focus:outline-none text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">
                  Stop Loss Price ($)
                </label>
                <input
                  type="number"
                  value={stopLoss || ''}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  placeholder="e.g. 49500"
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-card-solid border border-border-color hover:border-border-color-strong focus:border-primary-main focus:outline-none text-white text-sm"
                />
              </div>
            </div>

            {/* Calculations Card */}
            <div className="p-4 rounded-xl border border-border-color bg-gradient-to-br from-bg-card-solid to-transparent space-y-3.5 mt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-fg-muted">Cash at Risk:</span>
                <span className="font-semibold text-white">
                  ${riskAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-fg-muted">Stop Loss Distance:</span>
                <span className={`font-semibold ${slPercent > 0 ? 'text-orange-400' : 'text-white'}`}>
                  {slPercent.toFixed(2)}%
                </span>
              </div>

              <div className="h-px bg-border-color" />

              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">Position Size (Units):</span>
                <span className="text-lg font-bold text-primary-main">
                  {positionSize.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-fg-muted">Total Position Value:</span>
                <span className="font-semibold text-white">
                  ${positionCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
          
          {/* Footer Info */}
          <div className="px-6 py-4 border-t border-border-color bg-bg-card-solid flex items-center gap-2 text-xs text-fg-muted">
            <HelpCircle size={14} className="text-primary-main shrink-0" />
            <span>Position Size = Cash Risk / ($ Entry Price - $ Stop Loss Price)</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
