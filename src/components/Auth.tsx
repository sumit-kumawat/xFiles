import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Loader2, Mail, Lock, UserPlus, LogIn, KeyRound, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

type AuthMode = 'login' | 'signup' | 'forgot';

interface AuthProps {
  onToggle: () => void;
  onLogin: (user: any) => void;
}

export default function Auth({ onToggle, onLogin }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState(''); // Email or Username
  const [email, setEmail] = useState(''); // Actual email for signup
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        await api.auth.register(email, password, name);
        toast.success('Registration successful! Please login.');
        setMode('login');
      } else if (mode === 'login') {
        const user = await api.auth.login(identifier, password);
        toast.success('Signed in successfully');
        if (!user.emailVerified && user.email !== 'admin@conzex.com') {
          toast.warning('Your email address is not verified yet. Please check your inbox.');
        }
        onLogin(user);
      } else if (mode === 'forgot') {
        await api.auth.resetPassword(email);
        toast.success('Password reset link sent to your email (simulated)');
        setMode('login');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-100 flex flex-col items-center justify-center p-4">
      {/* Branding for Login/Signup */}
      <div className="mb-8 flex items-center gap-3">
        <img src="https://files.conzex.com/api/files/public/ee05804c-9547-4c7f-8c23-c32e89912eeb/circle-logo.svg" className="w-10 h-10 object-contain" alt="xFiles Logo" />
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2 leading-none">
            <span className="text-2xl font-bold font-display tracking-tight text-slate-900">xFiles</span>
            <span className="bg-brand-50 text-brand-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-brand-100 uppercase tracking-wider">v2.0</span>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold tracking-tight mt-1 leading-none">A Conzex Global Product</span>
        </div>
      </div>

      <Card className="w-full max-w-[440px] shadow-xl border-white/50 bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden">
        <CardHeader className="space-y-1 pt-8 px-8">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {mode === 'login' && 'Sign in'}
              {mode === 'signup' && 'Create account'}
              {mode === 'forgot' && 'Reset password'}
            </CardTitle>
            {mode !== 'login' && (
              <button 
                onClick={() => setMode('login')}
                className="text-slate-400 hover:text-brand-500 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
          </div>
          <CardDescription className="text-slate-500">
            {mode === 'login' && 'Enter your username or email to continue'}
            {mode === 'signup' && 'Join xFiles for enterprise cloud storage'}
            {mode === 'forgot' && 'Enter your email to receive a reset link'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 pb-8 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <motion.div 
                  key="login"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Input 
                      placeholder="Email or username" 
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      className="h-12 border-surface-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Input 
                      type="password" 
                      placeholder="Password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 border-surface-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all rounded-md"
                    />
                    <div className="flex justify-end">
                      <button 
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-xs font-medium text-brand-600 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : mode === 'signup' ? (
                <motion.div 
                  key="signup"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <Input 
                    placeholder="Full name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-12 border-surface-200 focus:border-brand-500 transition-all"
                  />
                  <Input 
                    type="email" 
                    placeholder="Email address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 border-surface-200 focus:border-brand-500 transition-all"
                  />
                  <Input 
                    type="password" 
                    placeholder="Choose password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 border-surface-200 focus:border-brand-500 transition-all"
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="forgot"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <Input 
                    type="email" 
                    placeholder="Email address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 border-surface-200 focus:border-brand-500 transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Button 
              type="submit" 
              className="w-full h-12 bg-brand-500 hover:bg-brand-600 text-white font-semibold transition-all rounded-md" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <span>
                  {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send reset link'}
                </span>
              )}
            </Button>
          </form>

          {mode === 'login' && (
            <div className="mt-8 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center px-8 sm:px-12"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-semibold tracking-wider">New User?</span></div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setMode('signup')}
                  className="text-sm font-medium text-slate-600 hover:text-brand-500 transition-colors py-2"
                >
                  Don't have an account? <span className="text-brand-600 font-bold">Register here</span>
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-sm text-slate-400 font-medium">
        <button onClick={onToggle} className="hover:text-slate-600">Back to Home</button>
      </div>
    </div>
  );
}
