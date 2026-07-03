'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/auth-context';
import { useToast } from '../../../components/ui/toast';
import { MarketType } from '../../../types';
import { Compass, Sparkles, DollarSign, Briefcase, Award, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MARKETS: MarketType[] = ['Crypto', 'Forex', 'Stocks', 'Options', 'Futures'];

export default function OnboardingPage() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [balance, setBalance] = useState<number>(10000);
  const [tradingStyle, setTradingStyle] = useState('Day Trader');
  const [experience, setExperience] = useState(1);
  const [preferredMarkets, setPreferredMarkets] = useState<MarketType[]>([]);

  // Prevent onboarded users from returning
  useEffect(() => {
    if (user?.isOnboarded) {
      router.push('/');
    }
  }, [user, router]);

  const handleMarketToggle = (market: MarketType) => {
    setPreferredMarkets((prev) =>
      prev.includes(market) ? prev.filter((m) => m !== market) : [...prev, market]
    );
  };

  const handleNext = () => {
    if (step === 1 && (!balance || balance <= 0)) {
      showToast('Please enter a valid starting balance', 'error');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
  };

  const handleComplete = async () => {
    if (preferredMarkets.length === 0) {
      showToast('Please select at least one preferred asset class', 'error');
      return;
    }

    try {
      await updateProfile({
        startingBalance: balance,
        tradingStyle,
        yearsOfExperience: experience,
        preferredMarkets,
        isOnboarded: true,
      });
      
      showToast('Setup complete! Welcome to your journal.', 'success');
      router.push('/');
    } catch (err) {
      showToast('Failed to complete onboarding setup', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060913] px-4 md:px-6 py-10 relative overflow-hidden">
      {/* Background blur accents */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary-main/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-blue-700/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg p-8 rounded-2xl glass-panel border border-border-color shadow-2xl relative bg-[#0d1426]/60 flex flex-col min-h-[460px] justify-between">
        {/* Header step progress indicators */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-main/15 text-primary-main">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-sm">Onboarding Wizard</span>
            </div>
            <span className="text-xs text-fg-muted font-semibold tracking-wider uppercase">
              Step {step} of 3
            </span>
          </div>

          <div className="w-full bg-border-color h-1 rounded-full overflow-hidden border border-transparent">
            <motion.div
              className="bg-primary-main h-full"
              initial={{ width: '33.3%' }}
              animate={{ width: `${step * 33.3}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>

        {/* Step Contents */}
        <div className="my-8 flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-md flex items-center gap-1.5">
                    Account Sizing <Sparkles className="text-primary-main w-4 h-4" />
                  </h3>
                  <p className="text-xs text-fg-muted leading-relaxed">
                    Set up your initial account size. This starting balance is used to compute cumulative return growth rates and drawdowns.
                  </p>
                </div>

                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-3.5 text-fg-muted w-5 h-5" />
                  <input
                    type="number"
                    value={balance || ''}
                    onChange={(e) => setBalance(Number(e.target.value))}
                    placeholder="e.g. 10000"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm font-semibold"
                    required
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-md flex items-center gap-1.5">
                    Trading Profile <Briefcase className="text-primary-main w-4 h-4" />
                  </h3>
                  <p className="text-xs text-fg-muted leading-relaxed">
                    Specify your primary execution style and how long you've been active in financial markets.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-fg-muted uppercase tracking-wider mb-1.5">Trading Style</label>
                    <select
                      value={tradingStyle}
                      onChange={(e) => setTradingStyle(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-bg-card-solid border border-border-color text-xs text-white focus:outline-none focus:border-primary-main"
                    >
                      <option value="Day Trader">Day Trader</option>
                      <option value="Swing Trader">Swing Trader</option>
                      <option value="Scalper">Scalper</option>
                      <option value="Position Trader">Position Trader</option>
                      <option value="Algorithmic">Algorithmic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-fg-muted uppercase tracking-wider mb-1.5">Experience (Years)</label>
                    <input
                      type="number"
                      value={experience || ''}
                      onChange={(e) => setExperience(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2.5 rounded-xl bg-bg-card-solid border border-border-color text-xs text-white focus:outline-none focus:border-primary-main font-semibold"
                      required
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-md flex items-center gap-1.5">
                    Preferred Asset Classes <Award className="text-primary-main w-4 h-4" />
                  </h3>
                  <p className="text-xs text-fg-muted leading-relaxed">
                    Select the asset markets you routinely trade or monitor. Select all that apply.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  {MARKETS.map((market) => {
                    const isChecked = preferredMarkets.includes(market);
                    return (
                      <button
                        key={market}
                        type="button"
                        onClick={() => handleMarketToggle(market)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                          isChecked
                            ? 'bg-primary-main/20 border-primary-main text-white'
                            : 'bg-bg-card-solid border-border-color text-fg-muted hover:text-white'
                        }`}
                      >
                        {isChecked && <Check size={14} className="text-primary-main" />}
                        {market}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Wizard Actions Footer */}
        <div className="flex justify-between items-center pt-5 border-t border-border-color/60">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className={`px-4 py-2 border border-border-color hover:bg-bg-card rounded-xl text-xs font-semibold text-fg-muted hover:text-white transition-all ${
              step === 1 ? 'opacity-0 pointer-events-none' : ''
            }`}
          >
            Back
          </button>
          
          {step < 3 ? (
            <button
              onClick={handleNext}
              className="px-5 py-2 bg-primary-main hover:bg-primary-hover rounded-xl text-xs font-semibold text-white transition-all shadow-[0_0_15px_rgba(59,130,246,0.25)]"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-gradient-to-r from-success-main to-emerald-600 hover:opacity-95 rounded-xl text-xs font-bold text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)]"
            >
              Complete Setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
