'use client';

import React, { useState } from 'react';
import { Trade, TradeComment, TradeChecklist } from '../../types';
import { updateTrade, deleteTrade } from '../../services/db';
import { useToast } from '../ui/toast';
import { useAuth } from '../../context/auth-context';
import {
  X,
  Calendar,
  Clock,
  Coins,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Award,
  CheckCircle,
  HelpCircle,
  Printer,
  Trash,
  Edit3,
  Star,
  Pin,
  MessageSquare,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TradeDetailModalProps {
  trade: Trade;
  onClose: () => void;
  onRefresh: () => void;
  onEdit: (trade: Trade) => void;
}

export default function TradeDetailModal({ trade, onClose, onRefresh, onEdit }: TradeDetailModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [commentText, setCommentText] = useState('');
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Toggle Pinned
  const handleTogglePin = async () => {
    try {
      const updated = { ...trade, isPinned: !trade.isPinned };
      await updateTrade(updated);
      showToast(updated.isPinned ? 'Trade pinned to top' : 'Trade unpinned', 'success');
      onRefresh();
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async () => {
    try {
      const updated = { ...trade, isFavorite: !trade.isFavorite };
      await updateTrade(updated);
      showToast(updated.isFavorite ? 'Added to favorites' : 'Removed from favorites', 'success');
      onRefresh();
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  // Delete trade
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trade? This cannot be undone.')) return;
    try {
      if (trade.id) {
        await deleteTrade(trade.id);
        showToast('Trade deleted successfully', 'success');
        onRefresh();
        onClose();
      }
    } catch (err) {
      showToast('Delete failed', 'error');
    }
  };

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    const newComment: TradeComment = {
      id: crypto.randomUUID(),
      author: user.username,
      text: commentText.trim(),
      date: new Date().toISOString(),
    };

    try {
      const updatedComments = [...(trade.comments || []), newComment];
      const updatedTrade = { ...trade, comments: updatedComments };
      await updateTrade(updatedTrade);
      setCommentText('');
      showToast('Comment added', 'success');
      onRefresh();
    } catch (err) {
      showToast('Failed to save comment', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'WIN') return 'text-success-main border-success-main/30 bg-success-main/10';
    if (status === 'LOSS') return 'text-danger-main border-danger-main/30 bg-danger-main/10';
    return 'text-white border-border-color bg-bg-card-solid';
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl rounded-2xl glass-panel text-fg-main border border-border-color shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-color bg-bg-card-solid no-print">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(trade.status)}`}>
              {trade.status}
            </span>
            <h3 className="font-bold text-white text-md">
              Trade #{trade.tradeNumber} - {trade.symbol}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePin}
              className={`p-1.5 rounded-lg border transition-all ${
                trade.isPinned
                  ? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
                  : 'border-border-color hover:bg-bg-card text-fg-muted hover:text-white'
              }`}
              title={trade.isPinned ? 'Unpin Trade' : 'Pin Trade'}
            >
              <Pin size={15} />
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`p-1.5 rounded-lg border transition-all ${
                trade.isFavorite
                  ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                  : 'border-border-color hover:bg-bg-card text-fg-muted hover:text-white'
              }`}
              title={trade.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
            >
              <Star size={15} />
            </button>
            <button
              onClick={() => onEdit(trade)}
              className="p-1.5 rounded-lg border border-border-color hover:bg-bg-card text-fg-muted hover:text-white transition-all"
              title="Edit Trade"
            >
              <Edit3 size={15} />
            </button>
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-lg border border-border-color hover:bg-bg-card text-fg-muted hover:text-white transition-all"
              title="Print PDF"
            >
              <Printer size={15} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg border border-red-950/20 hover:border-red-900/50 hover:bg-red-950/20 text-fg-muted hover:text-red-400 transition-all"
              title="Delete Trade"
            >
              <Trash size={15} />
            </button>
            <div className="h-4 w-px bg-border-color mx-1" />
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-bg-card-hover text-fg-muted hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Printable Header */}
          <div className="hidden print-only border-b border-gray-300 pb-4 mb-4">
            <h2 className="text-2xl font-bold">Trading Journal Record</h2>
            <p className="text-sm text-gray-500">
              Trade #{trade.tradeNumber} | Date: {trade.date} {trade.time} | Asset: {trade.assetName} ({trade.symbol})
            </p>
            <p className="text-sm text-gray-600">
              Result: {trade.status} | PnL: ${trade.pnl} ({trade.pnlPercent}%)
            </p>
          </div>

          {/* Grid Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border-color bg-bg-card-solid">
              <span className="block text-xs text-fg-muted uppercase tracking-wider mb-1">Asset Class</span>
              <span className="text-sm font-semibold text-white">{trade.market}</span>
              <span className="block text-[10px] text-fg-muted mt-0.5">{trade.exchange || 'Direct'}</span>
            </div>
            
            <div className="p-4 rounded-xl border border-border-color bg-bg-card-solid">
              <span className="block text-xs text-fg-muted uppercase tracking-wider mb-1">Execution</span>
              <span className={`text-sm font-bold ${trade.type === 'BUY' ? 'text-success-main' : 'text-danger-main'}`}>
                {trade.type} / {trade.direction}
              </span>
              <span className="block text-[10px] text-fg-muted mt-0.5">Timeframe: {trade.timeframe}</span>
            </div>

            <div className="p-4 rounded-xl border border-border-color bg-bg-card-solid">
              <span className="block text-xs text-fg-muted uppercase tracking-wider mb-1">Profit / Loss</span>
              <span className={`text-sm font-bold ${trade.pnl > 0 ? 'text-success-main' : trade.pnl < 0 ? 'text-danger-main' : 'text-white'}`}>
                {trade.pnl > 0 ? `+$${trade.pnl}` : trade.pnl < 0 ? `-$${Math.abs(trade.pnl)}` : '$0.00'}
              </span>
              <span className={`block text-[10px] ${trade.pnlPercent > 0 ? 'text-success-main' : trade.pnlPercent < 0 ? 'text-danger-main' : 'text-fg-muted'} mt-0.5`}>
                {trade.pnlPercent > 0 ? `+${trade.pnlPercent}%` : `${trade.pnlPercent}%`}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border-color bg-bg-card-solid">
              <span className="block text-xs text-fg-muted uppercase tracking-wider mb-1">Risk Reward</span>
              <span className="text-sm font-bold text-primary-main">
                {trade.rewardRatio > 0 ? `${trade.rewardRatio} R` : 'N/A'}
              </span>
              <span className="block text-[10px] text-fg-muted mt-0.5">Fees: ${trade.fees}</span>
            </div>
          </div>

          {/* Detailed Transaction Prices */}
          <div className="p-4 rounded-xl border border-border-color bg-gradient-to-br from-bg-card-solid to-transparent space-y-4">
            <h4 className="text-xs font-bold text-fg-muted uppercase tracking-widest">Pricing Matrix</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-fg-muted block text-xs">Entry Price</span>
                <span className="font-semibold text-white">${trade.entryPrice.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-fg-muted block text-xs">Exit Price</span>
                <span className="font-semibold text-white">${trade.exitPrice > 0 ? trade.exitPrice.toLocaleString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-fg-muted block text-xs">Stop Loss</span>
                <span className="font-semibold text-orange-400">${trade.stopLoss.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-fg-muted block text-xs">Take Profit</span>
                <span className="font-semibold text-success-main">${trade.takeProfit > 0 ? trade.takeProfit.toLocaleString() : 'N/A'}</span>
              </div>
            </div>
            
            <div className="h-px bg-border-color" />
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-fg-muted block text-xs">Position Quantity</span>
                <span className="font-semibold text-white">{trade.quantity.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-fg-muted block text-xs">Notional Position Cost</span>
                <span className="font-semibold text-white">${trade.positionSize.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-fg-muted block text-xs">Risk Accounted</span>
                <span className="font-semibold text-white">{trade.riskPercent}%</span>
              </div>
              <div>
                <span className="text-fg-muted block text-xs">Date / Time logged</span>
                <span className="font-semibold text-white flex items-center gap-1">
                  <Calendar size={12} className="text-fg-muted" />
                  {trade.date}
                </span>
              </div>
            </div>
          </div>

          {/* Strategy, Setup and Compliance Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-primary-main uppercase tracking-widest border-b border-border-color pb-1">
                Strategy & Setup
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-fg-muted block text-xs">Strategy Applied</span>
                  <span className="text-white font-medium">{trade.strategyUsed || 'Discretionary / No Tag'}</span>
                </div>
                <div>
                  <span className="text-fg-muted block text-xs">Setup Trigger</span>
                  <span className="text-white font-medium">{trade.setupName || 'Unspecified'}</span>
                </div>
                {trade.tags && trade.tags.length > 0 && (
                  <div>
                    <span className="text-fg-muted block text-xs mb-1">Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {trade.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-bg-card-solid border border-border-color text-fg-muted">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Checklist items list */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-primary-main uppercase tracking-widest border-b border-border-color pb-1">
                Pre-Trade Compliance
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {trade.checklist &&
                  Object.keys(trade.checklist).map((key) => {
                    const isChecked = trade.checklist[key as keyof TradeChecklist];
                    const labels: Record<string, string> = {
                      trendConfirmed: 'Trend Confirmed',
                      riskCalculated: 'Risk Calculated',
                      stopLossPlaced: 'Stop Loss Placed',
                      targetIdentified: 'Target Identified',
                      positionSizeCorrect: 'Position Size Valid',
                      newsChecked: 'News Checked',
                      followedStrategy: 'Followed Strategy Rules',
                    };
                    return (
                      <div key={key} className="flex items-center gap-2">
                        {isChecked ? (
                          <CheckCircle size={14} className="text-success-main shrink-0" />
                        ) : (
                          <X size={14} className="text-danger-main shrink-0" />
                        )}
                        <span className={isChecked ? 'text-white' : 'text-fg-muted'}>{labels[key]}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Psychological metrics & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-primary-main uppercase tracking-widest border-b border-border-color pb-1">
                Psychology & Performance Rules
              </h4>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-fg-muted text-xs">Emotion (Before entry)</span>
                  <span className="font-semibold px-2 py-0.5 rounded bg-bg-card-solid border border-border-color text-white">
                    {trade.emotionBefore}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-fg-muted text-xs">Emotion (After exit)</span>
                  <span className="font-semibold px-2 py-0.5 rounded bg-bg-card-solid border border-border-color text-white">
                    {trade.emotionAfter}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-fg-muted text-xs">Confidence Rating</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary-main">{trade.confidence} / 10</span>
                    <div className="w-16 h-1.5 rounded-full bg-bg-card-solid overflow-hidden border border-border-color">
                      <div className="bg-primary-main h-full" style={{ width: `${trade.confidence * 10}%` }} />
                    </div>
                  </div>
                </div>
                {trade.mistakes && trade.mistakes.length > 0 && (
                  <div>
                    <span className="text-fg-muted block text-xs mb-1">Violations / Mistakes</span>
                    <div className="flex flex-wrap gap-1.5">
                      {trade.mistakes.map((m) => (
                        <span key={m} className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${m === 'None' ? 'bg-success-main/10 border-success-main/20 text-success-main' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-primary-main uppercase tracking-widest border-b border-border-color pb-1">
                Lessons Learned
              </h4>
              <p className="text-sm text-fg-main leading-relaxed italic bg-bg-card-solid/35 p-3 rounded-lg border border-border-color/50 min-h-[80px]">
                {trade.lessonsLearned || 'No notes on lessons compiled.'}
              </p>
            </div>
          </div>

          {/* Notes */}
          {trade.notes && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-primary-main uppercase tracking-widest border-b border-border-color pb-1">
                Execution Notes & Context
              </h4>
              <p className="text-sm text-fg-main leading-relaxed bg-bg-card-solid/20 p-4 rounded-xl border border-border-color whitespace-pre-wrap">
                {trade.notes}
              </p>
            </div>
          )}

          {/* Attachments & Images Gallery */}
          {trade.images && trade.images.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-primary-main uppercase tracking-widest border-b border-border-color pb-1">
                Attached Screenshots
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {trade.images.map((img, index) => (
                  <div
                    key={index}
                    onClick={() => setActiveImage(img)}
                    className="relative group rounded-xl overflow-hidden border border-border-color aspect-video cursor-zoom-in bg-[#0d1426]"
                  >
                    <img src={img} alt={`Screenshot Attachment ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="text-white w-6 h-6 drop-shadow" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="border-t border-border-color pt-6 space-y-4 no-print">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-main" />
              <h4 className="font-bold text-sm text-white">Review Comments ({trade.comments?.length || 0})</h4>
            </div>

            {/* Comments List */}
            {trade.comments && trade.comments.length > 0 ? (
              <div className="space-y-3">
                {trade.comments.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl border border-border-color bg-bg-card-solid/60 text-sm">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-white text-xs">{c.author}</span>
                      <span className="text-[10px] text-fg-muted">{new Date(c.date).toLocaleString()}</span>
                    </div>
                    <p className="text-fg-main leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-fg-muted italic">No comments written yet. Add a review comment below.</p>
            )}

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a feedback or review comment..."
                className="flex-1 px-4 py-2 rounded-xl bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#1e293b] hover:bg-slate-800 border border-slate-700 text-white font-medium rounded-xl text-sm transition-all"
              >
                Comment
              </button>
            </form>
          </div>
        </div>

        {/* Zoomed Image Lightbox Overlay */}
        <AnimatePresence>
          {activeImage && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 cursor-zoom-out"
              onClick={() => setActiveImage(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center"
              >
                <img
                  src={activeImage}
                  alt="Expanded Attachment"
                  className="max-w-full max-h-full object-contain rounded-lg border border-border-color"
                />
                <button
                  onClick={() => setActiveImage(null)}
                  className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-all"
                >
                  <X size={20} />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
