import { getTrades, getNotes, getGoals, db } from './db';
import { Trade, Note, PerformanceGoal } from '../types';

export interface BackupData {
  version: number;
  userId: string;
  timestamp: string;
  trades: Trade[];
  notes: Note[];
  goals: PerformanceGoal[];
}

// JSON Backup & Import
export async function exportBackupJSON(userId: string, username: string): Promise<void> {
  const trades = await getTrades(userId);
  const notes = await getNotes(userId);
  const goals = await getGoals(userId);

  const backup: BackupData = {
    version: 1,
    userId,
    timestamp: new Date().toISOString(),
    trades,
    notes,
    goals,
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `trading_journal_${username}_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function importBackupJSON(userId: string, jsonString: string): Promise<{ success: boolean; tradesCount: number; notesCount: number }> {
  try {
    const backup: BackupData = JSON.parse(jsonString);
    if (!backup.trades || !backup.notes || !backup.goals) {
      throw new Error('Invalid backup file structure');
    }

    // Rewrite user ID to match current session user to prevent loading other user's data on top
    const importedTrades = backup.trades.map(trade => ({
      ...trade,
      userId,
      id: trade.id || crypto.randomUUID()
    }));

    const importedNotes = backup.notes.map(note => ({
      ...note,
      userId,
      id: note.id || crypto.randomUUID()
    }));

    const importedGoals = backup.goals.map(goal => ({
      ...goal,
      userId,
      id: goal.id || crypto.randomUUID()
    }));

    // Perform Dexie transactions to put bulk data
    await db.transaction('rw', [db.trades, db.notes, db.goals], async () => {
      if (importedTrades.length > 0) {
        await db.trades.bulkPut(importedTrades);
      }
      if (importedNotes.length > 0) {
        await db.notes.bulkPut(importedNotes);
      }
      if (importedGoals.length > 0) {
        await db.goals.bulkPut(importedGoals);
      }
    });

    return {
      success: true,
      tradesCount: importedTrades.length,
      notesCount: importedNotes.length,
    };
  } catch (error) {
    console.error('Failed to import backup', error);
    throw error;
  }
}

// CSV Export for Excel / Google Sheets
export async function exportTradesCSV(userId: string, username: string): Promise<void> {
  const trades = await getTrades(userId);
  if (trades.length === 0) {
    throw new Error('No trades to export');
  }

  // Header keys
  const headers = [
    'Trade Number', 'Date', 'Time', 'Market', 'Exchange', 'Asset Name', 'Symbol',
    'Trade Type', 'Direction', 'Strategy Used', 'Setup Name', 'Timeframe',
    'Entry Price', 'Stop Loss', 'Take Profit', 'Exit Price', 'Quantity',
    'Risk Percent', 'Reward Ratio', 'Position Size', 'Fees', 'PnL', 'PnL Percent',
    'Status', 'Emotion Before', 'Emotion After', 'Confidence', 'Tags', 'CreatedAt'
  ];

  const csvRows = [headers.join(',')];

  for (const t of trades) {
    const rowValues = [
      t.tradeNumber,
      t.date,
      t.time,
      t.market,
      t.exchange,
      `"${t.assetName.replace(/"/g, '""')}"`,
      t.symbol,
      t.type,
      t.direction,
      `"${t.strategyUsed.replace(/"/g, '""')}"`,
      `"${t.setupName.replace(/"/g, '""')}"`,
      t.timeframe,
      t.entryPrice,
      t.stopLoss,
      t.takeProfit,
      t.exitPrice,
      t.quantity,
      t.riskPercent,
      t.rewardRatio,
      t.positionSize,
      t.fees,
      t.pnl,
      t.pnlPercent,
      t.status,
      t.emotionBefore,
      t.emotionAfter,
      t.confidence,
      `"${(t.tags || []).join(';')}"`,
      t.createdAt
    ];
    csvRows.push(rowValues.join(','));
  }

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `trades_${username}_export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// PDF Export (Utilizes browser print mode with tailored CSS styles)
export function triggerPDFPrint(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}
