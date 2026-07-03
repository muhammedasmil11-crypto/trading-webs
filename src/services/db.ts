import Dexie, { type Table } from 'dexie';
import { Trade, Note, PerformanceGoal, UserProfile } from '../types';

export class TradingJournalDatabase extends Dexie {
  users!: Table<UserProfile>;
  trades!: Table<Trade>;
  notes!: Table<Note>;
  goals!: Table<PerformanceGoal>;

  constructor() {
    super('TradingJournalDatabase');
    this.version(1).stores({
      users: 'id, username',
      trades: 'id, userId, tradeNumber, date, symbol, status, market, strategyUsed, isFavorite, isPinned, createdAt',
      notes: 'id, userId, type, date, createdAt',
      goals: 'id, userId, period'
    });
  }
}

export const db = new TradingJournalDatabase();

// DB CRUD Helper Functions

// Trades
export async function getTrades(userId: string): Promise<Trade[]> {
  return db.trades.where('userId').equals(userId).toArray();
}

export async function getTradeById(id: string): Promise<Trade | undefined> {
  return db.trades.get(id);
}

export async function generateNextTradeNumber(userId: string): Promise<number> {
  const count = await db.trades.where('userId').equals(userId).count();
  return count + 1;
}

export async function addTrade(trade: Omit<Trade, 'tradeNumber'>): Promise<string> {
  const nextNum = await generateNextTradeNumber(trade.userId);
  const tradeId = crypto.randomUUID();
  const newTrade: Trade = {
    ...trade,
    id: tradeId,
    tradeNumber: nextNum,
  };
  await db.trades.add(newTrade);
  return tradeId;
}

export async function updateTrade(trade: Trade): Promise<void> {
  if (!trade.id) throw new Error('Trade ID is required for update');
  await db.trades.put(trade);
}

export async function deleteTrade(id: string): Promise<void> {
  await db.trades.delete(id);
}

// Notes
export async function getNotes(userId: string): Promise<Note[]> {
  return db.notes.where('userId').equals(userId).toArray();
}

export async function getNoteById(id: string): Promise<Note | undefined> {
  return db.notes.get(id);
}

export async function saveNote(note: Note): Promise<void> {
  await db.notes.put(note);
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id);
}

// Goals
export async function getGoals(userId: string): Promise<PerformanceGoal[]> {
  return db.goals.where('userId').equals(userId).toArray();
}

export async function getGoalForPeriod(userId: string, period: string): Promise<PerformanceGoal | undefined> {
  return db.goals.where({ userId, period }).first();
}

export async function saveGoal(goal: Omit<PerformanceGoal, 'id'> & { id?: string }): Promise<string> {
  const id = goal.id || crypto.randomUUID();
  const goalToSave: PerformanceGoal = {
    ...goal,
    id,
    createdAt: goal.createdAt || new Date().toISOString(),
  };
  await db.goals.put(goalToSave);
  return id;
}

// Global Draft Storage for Autosave (Stored in LocalStorage for simplicity and fast caching)
export function saveTradeDraft(userId: string, draftData: any): void {
  localStorage.setItem(`trade_draft_${userId}`, JSON.stringify(draftData));
}

export function getTradeDraft(userId: string): any | null {
  const data = localStorage.getItem(`trade_draft_${userId}`);
  return data ? JSON.parse(data) : null;
}

export function clearTradeDraft(userId: string): void {
  localStorage.removeItem(`trade_draft_${userId}`);
}
