import { UserProfile, MarketType } from '../types';
import { db } from './db';

// Helper to hash password using SHA-256 Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface RegisterInput {
  username: string;
  password: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export async function registerUser(input: RegisterInput): Promise<UserProfile> {
  const existing = await db.users.where('username').equals(input.username).first();
  if (existing) {
    throw new Error('Username already exists');
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(input.password);
  
  const newUser: UserProfile = {
    id: userId,
    username: input.username,
    passwordHash,
    tradingStyle: '',
    yearsOfExperience: 0,
    preferredMarkets: [],
    startingBalance: 10000,
    isOnboarded: false,
    createdAt: new Date().toISOString(),
  };

  await db.users.add(newUser);
  return newUser;
}

export async function loginUser(input: LoginInput): Promise<UserProfile> {
  const user = await db.users.where('username').equals(input.username).first();
  if (!user) {
    throw new Error('User not found');
  }

  const hash = await hashPassword(input.password);
  if (user.passwordHash !== hash) {
    throw new Error('Invalid password');
  }

  // Set local storage session
  localStorage.setItem('trading_session_userId', user.id);
  
  // Return user without password hash
  const { passwordHash, ...safeUser } = user;
  return safeUser as UserProfile;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  if (typeof window === 'undefined') return null;
  const userId = localStorage.getItem('trading_session_userId');
  if (!userId) return null;

  const user = await db.users.get(userId);
  if (!user) {
    localStorage.removeItem('trading_session_userId');
    return null;
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser as UserProfile;
}

export function logoutUser(): void {
  localStorage.removeItem('trading_session_userId');
}

export async function updateUserProfile(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'passwordHash' | 'createdAt'>>): Promise<UserProfile> {
  const user = await db.users.get(userId);
  if (!user) throw new Error('User not found');

  const updatedUser = {
    ...user,
    ...updates,
  };

  await db.users.put(updatedUser);
  
  const { passwordHash, ...safeUser } = updatedUser;
  return safeUser as UserProfile;
}
