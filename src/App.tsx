import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { api } from './lib/api';
import Auth from './components/Auth';
import Dashboard from './components/dashboard/Dashboard';
import Landing from './components/landing/Landing';
import { Loader2 } from 'lucide-react';
import { safeHistory } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<'landing' | 'auth'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('page') === 'auth' ? 'auth' : 'landing';
  });
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    async function checkSession() {
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
        if (currentUser) {
          // If logged in, clean up any landing page navigation query params
          const params = new URLSearchParams(window.location.search);
          if (params.get('page') === 'auth') {
            params.delete('page');
            if (!params.get('section')) {
              params.set('section', 'my-storage');
            }
            safeHistory.replaceState(
              { section: params.get('section') || 'my-storage', folder: params.get('folder') || null },
              '',
              window.location.pathname + '?' + params.toString()
            );
          }
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setPage(params.get('page') === 'auth' ? 'auth' : 'landing');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToAuth = () => {
    setPage('auth');
    const url = new URL(window.location.href);
    url.searchParams.set('page', 'auth');
    safeHistory.pushState({ page: 'auth' }, '', url.pathname + url.search);
  };

  const navigateToLanding = () => {
    setPage('landing');
    const url = new URL(window.location.href);
    url.searchParams.delete('page');
    safeHistory.pushState({ page: 'landing' }, '', url.pathname + url.search);
  };

  const handleLogin = (loggedInUser: any) => {
    setUser(loggedInUser);
    const url = new URL(window.location.href);
    url.searchParams.delete('page');
    url.searchParams.set('section', 'my-storage');
    url.searchParams.delete('folder');
    safeHistory.replaceState({ section: 'my-storage', folder: null }, '', url.pathname + url.search);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-surface-50">
        <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Initializing xFiles...</p>
      </div>
    );
  }

  // Verification Gate for new users (Simulated in local backend)
  if (user && !user.emailVerified && user.email !== 'admin@conzex.com') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-surface-50 p-6">
        <title>Verify Email | xFiles</title>
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-surface-200 text-center">
          <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Verify your email</h2>
          <p className="text-slate-600 mb-8">
            We've sent a verification link to <span className="font-semibold">{user.email}</span>. 
            Please check your inbox to activate your account.
          </p>
          <div className="space-y-4">
            <button 
              onClick={async () => {
                try {
                  const currentUser = await api.auth.me();
                  if (currentUser && currentUser.emailVerified) {
                    setUser(currentUser);
                    toast.success("Verification successful! Welcome to xFiles.");
                  } else {
                    toast.error("Your email is not verified yet. Please check your inbox for the verification email.");
                  }
                } catch (e) {
                  toast.error("Failed to check verification status. Please try logging in again.");
                }
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors cursor-pointer"
            >
              I've verified my email
            </button>
            <button 
              type="button"
              disabled={resending || resendCooldown > 0}
              onClick={async () => {
                if (resending || resendCooldown > 0) return;
                setResending(true);
                try {
                  await api.auth.resendVerification(user.email);
                  toast.success("Verification link has been resent! Please check your inbox.");
                  setResendCooldown(60); // 60 seconds cooldown
                } catch (e: any) {
                  toast.error(e.message || "Failed to resend verification email.");
                } finally {
                  setResending(false);
                }
              }}
              className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors cursor-pointer border ${
                resendCooldown > 0 
                  ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'border-brand-200 text-brand-600 hover:bg-brand-50 bg-white'
              }`}
            >
              {resending ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resending...</span>
                </div>
              ) : resendCooldown > 0 ? (
                `Resend Link (${resendCooldown}s)`
              ) : (
                "Resend Verification Link"
              )}
            </button>
            <button 
              onClick={async () => {
                await api.auth.logout();
                setUser(null);
              }}
              className="w-full py-2.5 px-4 rounded-lg border border-surface-200 text-slate-700 font-medium hover:bg-surface-100 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 selection:bg-brand-100 selection:text-brand-700">
      <title>xFiles</title>
      <meta name="description" content="Secure, fast, and professional cloud storage for everyone. Host your data your way." />
      
      <Toaster richColors position="top-center" />

      {user ? (
        <Dashboard user={user} />
      ) : page === 'auth' ? (
        <Auth onToggle={navigateToLanding} onLogin={handleLogin} />
      ) : (
        <Landing onGetStarted={navigateToAuth} />
      )}
    </div>
  );
}
