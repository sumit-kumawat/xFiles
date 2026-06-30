import React from 'react';
import { Cloud, Search, Bell, Settings, Upload, Plus, LogOut, X, User as UserIcon, Shield, Key, Folder, Pencil, Trash2, RotateCcw, Share2, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  user: any;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateFolder: () => void;
  onSearch: (q: string) => void;
  onLogoRefresh?: () => void;
  onToggleSidebar?: () => void;
}

export default function Navbar({ user, onUpload, onCreateFolder, onSearch, onLogoRefresh, onToggleSidebar }: NavbarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSettings, setShowSettings] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);

  // Profile / Security modal states
  const [activeModal, setActiveModal] = React.useState<'profile' | 'security' | null>(null);
  const [displayNameInput, setDisplayNameInput] = React.useState(user.displayName || user.username || '');
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  // Periodically fetch notifications in real-time
  const fetchNotifications = React.useCallback(async () => {
    try {
      const data = await api.notifications.list();
      setNotifications(data);
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 4000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameInput.trim()) return toast.error("Display name cannot be empty");
    setIsSaving(true);
    try {
      await api.auth.updateProfile(displayNameInput);
      toast.success("Profile display name saved successfully!");
      setActiveModal(null);
      // reload settings to reflect changes safely
      setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) return toast.error("Please enter current password");
    if (!newPassword) return toast.error("Please enter new password");
    if (newPassword !== confirmPassword) return toast.error("New passwords do not match");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    
    setIsSaving(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      toast.success("Identity credentials updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveModal(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update credentials");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      window.location.href = '/';
    } catch (e) {
      toast.error("Logout failed");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    onSearch(q);
  };

  return (
    <nav className="h-16 border-b border-surface-200 bg-white flex items-center px-6 justify-between shrink-0 sticky top-0 z-50">
      <div className="flex items-center gap-2 md:gap-4 w-auto md:w-[25%] shrink-0">
        {/* Hamburger Menu on smaller screens */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mr-1 focus:outline-none"
          title="Toggle Sidebar Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onLogoRefresh}
          className="flex items-center gap-2.5 text-left focus:outline-none transition-all active:scale-95 cursor-pointer group select-none"
          title="xFiles - A Conzex Global Product"
        >
          <img src="https://files.conzex.com/api/files/public/0c3d3463-8d95-49dc-8069-a45d5514f1b9/circle-logo.svg" className="w-7 h-7 object-contain group-hover:rotate-12 transition-transform duration-300" alt="xFiles Logo" />
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-bold font-display tracking-tight text-[17px] text-brand-950 group-hover:text-brand-600 transition-colors">xFiles</span>
              <span className="bg-brand-50 text-brand-600 text-[8px] font-extrabold px-1 py-0.5 rounded border border-brand-100 uppercase tracking-wider">v2.0</span>
            </div>
            <span className="text-[8.5px] text-slate-400 font-semibold tracking-tight mt-0.5 leading-none">A Conzex Global Product</span>
          </div>
        </button>
      </div>

      {/* 50% Centered Search Container */}
      <div className="w-[50%] flex justify-center px-4 hidden md:flex">
        <div className="relative w-full max-w-lg">
          <div className="rainbow-search-input relative rounded-lg flex items-center h-10 px-3 z-10">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input 
              type="text" 
              placeholder="Search all files" 
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-transparent border-none py-1.5 text-xs outline-none focus:ring-0 font-medium text-slate-700 placeholder-slate-400 h-full"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); onSearch(''); }}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer shrink-0 ml-1"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 w-auto md:w-[25%] justify-end shrink-0">
        <div className="flex items-center mr-4 gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onUpload} 
            className="hidden" 
            multiple 
          />
        </div>

        <div className="relative">
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowSettings(false); }}
            className={`p-2 rounded-md transition-colors relative ${showNotifications ? 'bg-surface-100 text-brand-600' : 'hover:bg-surface-100 text-slate-600'}`}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-surface-100 z-50 p-2 overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-surface-50">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity logs</p>
                  </div>
                  <div className="py-2 overflow-y-auto max-h-80 text-xs">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center space-y-2">
                        <Cloud className="w-8 h-8 text-slate-200 mx-auto" />
                        <p className="text-xs text-slate-400 italic">No recent activity</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-surface-50">
                        {notifications.map((n: any) => {
                          const getNotificationIcon = (action: string) => {
                            switch (action) {
                              case 'upload': return <Upload className="w-3.5 h-3.5 text-blue-500" />;
                              case 'mkdir': return <Folder className="w-3.5 h-3.5 text-brand-500 fill-brand-50" />;
                              case 'rename': return <Pencil className="w-3.5 h-3.5 text-amber-500" />;
                              case 'trash': return <Trash2 className="w-3.5 h-3.5 text-slate-500" />;
                              case 'restore': return <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />;
                              case 'delete': return <X className="w-3.5 h-3.5 text-red-500" />;
                              case 'share': return <Share2 className="w-3.5 h-3.5 text-indigo-500" />;
                              case 'star': return <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />;
                              case 'unstar': return <Star className="w-3.5 h-3.5 text-slate-300" />;
                              default: return <Cloud className="w-3.5 h-3.5 text-slate-400" />;
                            }
                          };

                          const getNotificationLabel = (action: string) => {
                            switch (action) {
                              case 'upload': return 'File Uploaded';
                              case 'mkdir': return 'Folder Created';
                              case 'rename': return 'Renamed Item';
                              case 'trash': return 'Moved to bin';
                              case 'restore': return 'Restored Item';
                              case 'delete': return 'Deleted Permanently';
                              case 'share': return 'Shared Item';
                              case 'star': return 'Starred Item';
                              case 'unstar': return 'Unstarred Item';
                              default: return 'Activity';
                            }
                          };

                          return (
                            <div key={n.id} className="p-3 hover:bg-surface-50 transition-colors flex flex-col gap-1">
                              <div className="flex justify-between items-center text-left">
                                <div className="flex items-center gap-2">
                                  {getNotificationIcon(n.action)}
                                  <span className="font-semibold text-slate-700 text-[11px]">
                                    {getNotificationLabel(n.action)}
                                  </span>
                                </div>
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-normal text-left pl-5.5">{n.target_name}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button 
            type="button"
            onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); }}
            className="ml-2 pl-4 border-l border-surface-100 flex items-center gap-3 cursor-pointer select-none text-left focus:outline-none focus:ring-0 group"
          >
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-900 leading-none group-hover:text-brand-600 transition-colors">{user.displayName || user.username}</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter leading-none">{user.plan} account</p>
            </div>
            {/* Styled Circular Profile Icon */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-650 to-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-md border-2 border-white ring-2 ring-slate-100 group-hover:ring-brand-500 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300 select-none uppercase">
              {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
          </button>

          <AnimatePresence>
            {showSettings && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-surface-100 z-50 p-2 overflow-hidden"
                >
                  <div className="px-4 py-3 bg-surface-50 border-b border-surface-100 mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Authenticated As</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user.displayName || user.username}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <button 
                      onClick={() => { setActiveModal('profile'); setShowSettings(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-surface-50 transition-colors text-left"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      Account Profile
                    </button>
                    <button 
                      onClick={() => { setActiveModal('security'); setShowSettings(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-surface-50 transition-colors text-left"
                    >
                      <Key className="w-4 h-4 text-slate-400" />
                      Privacy & Security
                    </button>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-surface-50">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Terminate Session
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {activeModal === 'profile' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-200 shadow-2xl relative z-10 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-surface-100">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-brand-500" />
                  Edit Profile Identity
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-surface-100 rounded-md transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Display Name</label>
                  <input 
                    type="text" 
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder="Enter display name..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:border-brand-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="text" 
                    disabled
                    value={user.email}
                    className="w-full bg-slate-100 border border-slate-250 text-slate-500 rounded-xl p-3 text-sm cursor-not-allowed outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Email addresses are bound to your secure workspace profile and cannot be changed.</p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-surface-100">
                  <button 
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 hover:bg-slate-100 text-slate-600 font-bold uppercase rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-slate-900 text-white font-bold uppercase rounded-xl hover:bg-slate-800 transition-all shadow-lg text-xs"
                  >
                    {isSaving ? "Syncing..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {activeModal === 'security' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-200 shadow-2xl relative z-10 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-surface-100">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-brand-500" />
                  Change Password Settings
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-surface-100 rounded-md transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Password</label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:border-brand-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:border-brand-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:border-brand-500 outline-none transition-all"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-surface-100">
                  <button 
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 hover:bg-slate-100 text-slate-600 font-bold uppercase rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-slate-900 text-white font-bold uppercase rounded-xl hover:bg-slate-800 transition-all shadow-lg text-xs"
                  >
                    {isSaving ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
