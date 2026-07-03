'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/auth-context';
import { useToast } from '../../../components/ui/toast';
import { Compass, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const { signup } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      showToast('Please enter both username and password', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password should be at least 6 characters long', 'error');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await signup({
        username: username.trim(),
        password,
      });
      showToast('Account registered successfully', 'success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed');
      showToast('Registration failed', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060913] px-4 md:px-6 py-10 relative overflow-hidden">
      {/* Background glow graphics */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary-main/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-blue-700/10 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md p-8 rounded-2xl glass-panel border border-border-color shadow-2xl relative bg-[#0d1426]/60"
      >
        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-main to-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.45)]">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-xl">Create Your Account</h2>
            <p className="text-xs text-fg-muted mt-1 leading-normal">
              Register now to set up your private local trading journal.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg border border-red-900/50 bg-red-950/20 text-red-400 text-xs flex items-center gap-2 mb-4">
            <ShieldAlert size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4.5">
          <div>
            <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. trading_wizard"
              className="w-full px-4 py-2.5 rounded-xl bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-4 py-2.5 rounded-xl bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-primary-main hover:bg-primary-hover disabled:bg-primary-main/60 font-semibold rounded-xl text-sm text-white transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] mt-2"
          >
            {isSubmitting ? 'Registering...' : 'Register Profile'}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-fg-muted">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary-main hover:underline font-bold">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
