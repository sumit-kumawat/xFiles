import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatBytes } from '@/lib/utils';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Command, 
  Mail, 
  Key, 
  RefreshCw,
  PieChart as PieChartIcon,
  HardDrive,
  User as UserIcon,
  ChevronRight,
  Loader2,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  MoreVertical,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { FileItem } from '@/types';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  plan: string;
  storageUsed: number;
  storageLimit: number;
  createdAt: any;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userStats, setUserStats] = useState<{ stats: Record<string, number>; totalSize: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [auditingFiles, setAuditingFiles] = useState<FileItem[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'storage' | 'pricing' | 'requests'>('users');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [requests, setRequests] = useState<any[]>([]);

  const loadSettings = async () => {
    const data = await api.settings.get();
    setSettings(data);
  };

  const loadRequests = async () => {
    try {
      const data = await api.admin.listRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading requests:', e);
      setRequests([]);
    }
  };

  const loadUserFiles = async (userId: string) => {
    setIsAuditing(true);
    setLoading(true);
    try {
      const files = await api.files.list({ userId });
      setAuditingFiles(Array.isArray(files) ? files : []);
    } catch (e) {
      toast.error('Failed to audit user files');
      setAuditingFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.admin.listUsers();
      setUsers(Array.isArray(data) ? (data as AdminUser[]) : []);
    } catch (e) {
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async (user: AdminUser) => {
    setSelectedUser(user);
    setStatsLoading(true);
    try {
      const data = await api.admin.getUserStats(user.id);
      setUserStats(data);
    } catch (e) {
      toast.error('Failed to load user statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
      await api.auth.resetPassword(email);
      toast.success(`Password reset link sent to ${email} (simulated)`);
    } catch (e) {
      toast.error('Failed to send reset link');
    }
  };

  const handleSendVerification = async (email: string) => {
    try {
      await api.admin.sendVerification(email);
      toast.success(`Verification link sent to ${email}`);
    } catch (e) {
      toast.error('Failed to send verification link');
    }
  };

  const handleUpdateLimit = async (userId: string, newLimitGB: number) => {
    const bytes = newLimitGB * 1024 * 1024 * 1024;
    try {
      await api.admin.updateStorageLimit(userId, bytes);
      toast.success(`Storage limit updated to ${newLimitGB} GB`);
      setSelectedUser(prev => prev ? { ...prev, storageLimit: bytes } : null);
      loadUsers();
    } catch (e) {
      toast.error('Failed to update storage limit');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you absolutely sure? This will permanently delete the user and all their files.')) return;
    try {
      await api.admin.deleteUser(userId);
      toast.success('User terminated successfully');
      setSelectedUser(null);
      loadUsers();
    } catch (e) {
      toast.error('Failed to delete user');
    }
  };

  useEffect(() => {
    loadUsers();
    loadSettings();
    loadRequests();
  }, []);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="flex-1 flex overflow-hidden">
        {/* Admin Navigation Sidebar */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col pt-6">
          <div className="px-6 mb-8">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Console</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform Infrastructure</p>
          </div>
          
          <nav className="flex-1 px-4 space-y-1">
            {[
              { id: 'users', label: 'Identity & Access', icon: <Users className="w-4 h-4" /> },
              { id: 'storage', label: 'Storage Logic', icon: <HardDrive className="w-4 h-4" /> },
              { id: 'pricing', label: 'Pricing & Plans', icon: <PieChartIcon className="w-4 h-4" /> },
              { id: 'requests', label: 'User Requests', icon: <Mail className="w-4 h-4" />, badge: requests.filter(r => r.status === 'pending').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setIsAuditing(false); setSelectedUser(null); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all text-sm font-semibold ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  {tab.icon}
                  {tab.label}
                </div>
                {tab.badge ? (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{tab.badge}</span>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="p-6 border-t border-slate-100">
             <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Core Engine</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">xFiles v2.0 Enterprise Edition running on SQLite Distributed Core.</p>
             </div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto flex">
          <div className="flex-1 p-8 space-y-8 max-w-5xl">
            {/* Header with search */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 capitalize">{activeTab.replace('-', ' ')}</h2>
                <p className="text-xs text-slate-500">System management and infrastructure controls</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Quick search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-xs w-48 focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all shadow-sm"
                  />
                </div>
                <button 
                  onClick={loadUsers} 
                  className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Content Tabs */}
            {activeTab === 'users' && !isAuditing && (
              <div className="space-y-6">
                {/* Visual Stats Cards - Smaller as requested */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Identities', value: users.length, icon: <Users className="w-4 h-4" />, colorClass: 'bg-blue-50 text-blue-600' },
                    { label: 'Storage Bound', value: formatBytes(users.reduce((acc, u) => acc + u.storageUsed, 0)), icon: <HardDrive className="w-4 h-4" />, colorClass: 'bg-emerald-50 text-emerald-600' },
                    { label: 'System Load', value: 'Optimal', icon: <CheckCircle2 className="w-4 h-4" />, colorClass: 'bg-amber-50 text-amber-600' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.colorClass}`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                        <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Identity</th>
                        <th className="px-6 py-4">Account Metadata</th>
                        <th className="px-6 py-4">Storage Map</th>
                        <th className="px-6 py-4 text-right">Ops</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((user) => (
                        <tr 
                          key={user.id} 
                          onClick={() => loadUserStats(user)}
                          className={`hover:bg-slate-50/80 cursor-pointer transition-colors group ${selectedUser?.id === user.id ? 'bg-slate-50' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                                {user.displayName?.[0] || user.username[0].toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900">{user.displayName || 'No Name'}</span>
                                <span className="text-[10px] text-slate-500">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`w-fit px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${user.email === 'admin@conzex.com' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {user.email === 'admin@conzex.com' ? 'Admin' : 'Identity Verified'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {user.id.split('-')[0]}...</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 w-32">
                              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>{formatBytes(user.storageUsed)}</span>
                                <span>{Math.round((user.storageUsed / user.storageLimit) * 100)}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                <div 
                                  className="bg-slate-900 h-full transition-all" 
                                  style={{ width: `${Math.min(100, (user.storageUsed / user.storageLimit) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <MoreVertical className="w-4 h-4 text-slate-300 ml-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {isAuditing && (
               <div className="space-y-6">
                 <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                       <button onClick={() => setIsAuditing(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                          <ChevronRight className="w-4 h-4 rotate-180" />
                       </button>
                       <h2 className="font-bold text-slate-900">Object Audit: {selectedUser?.displayName || selectedUser?.username}</h2>
                    </div>
                    <span className="text-[10px] font-bold bg-brand-50 text-brand-600 px-2 py-1 rounded-full border border-brand-100">
                      {auditingFiles.length} Object(s) found
                    </span>
                 </div>

                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Object Name</th>
                          <th className="px-6 py-4">Size</th>
                          <th className="px-6 py-4">MIME Type</th>
                          <th className="px-6 py-4 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditingFiles.map(file => (
                          <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {file.type === 'folder' ? <Users className="w-3.5 h-3.5 text-brand-500" /> : <FileText className="w-3.5 h-3.5 text-slate-400" />}
                                <span className="text-xs font-semibold text-slate-700">{file.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase">
                              {file.type === 'file' ? formatBytes(file.size) : '--'}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight px-1.5 py-0.5 bg-slate-50 rounded border border-slate-100">{file.mime || 'DIRECTORY'}</span>
                            </td>
                            <td className="px-6 py-4 text-right text-[10px] text-slate-400">
                              {new Date(file.modifiedAt || Date.now()).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4 text-right">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requests.map(req => (
                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">{req.display_name}</span>
                              <span className="text-[10px] text-slate-500">{req.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-600">
                            {req.type.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 text-[10px] text-slate-500">
                            {new Date(req.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                               {req.status === 'pending' ? (
                                 <>
                                   <button 
                                     onClick={async () => {
                                       try {
                                         await api.admin.approveRequest(req.id);
                                         toast.success("Storage limit approved & increased successfully!");
                                         loadRequests();
                                         loadUsers();
                                       } catch (e: any) {
                                         toast.error(e.message || "Failed to approve request");
                                       }
                                     }}
                                     className="px-3 py-1 bg-brand-500 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-brand-600 transition-colors shadow-sm"
                                   >
                                     Approve
                                   </button>
                                   <button 
                                     onClick={async () => {
                                       try {
                                         await api.admin.dismissRequest(req.id);
                                         toast.success("Request dismissed");
                                         loadRequests();
                                       } catch (e: any) {
                                         toast.error(e.message || "Failed to dismiss request");
                                       }
                                     }}
                                     className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-lg hover:bg-slate-200 transition-colors"
                                   >
                                     Dismiss
                                   </button>
                                 </>
                               ) : (
                                 <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                   req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-150' : 'bg-slate-100 text-slate-400 border border-slate-150'
                                 }`}>
                                   {req.status}
                                 </span>
                               )}
                             </div>
                          </td>
                        </tr>
                      ))}
                      {requests.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-slate-400 text-xs italic">No active requests found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-8 max-w-2xl">
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-sm font-bold text-slate-900">Global Pricing Controls</h3>
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active System</span>
                          <button 
                            onClick={async () => {
                              const newVal = settings.pricing_enabled === 'true' ? 'false' : 'true';
                              await api.admin.updateSettings({ pricing_enabled: newVal });
                              loadSettings();
                            }}
                            className={`w-10 h-5 rounded-full transition-all relative ${settings.pricing_enabled === 'true' ? 'bg-brand-500' : 'bg-slate-200'}`}
                          >
                             <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${settings.pricing_enabled === 'true' ? 'left-5.5' : 'left-0.5'}`} />
                          </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Currency</label>
                          <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold focus:border-brand-500 outline-none cursor-pointer"
                            value={settings.currency || 'USD'}
                            onChange={(e) => setSettings({...settings, currency: e.target.value})}
                          >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EURO (€)</option>
                            <option value="INR">INR (₹)</option>
                          </select>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan Cost Matrix</p>
                       {[
                         { id: 'plan_starter_price', label: 'Starter Plan' },
                         { id: 'plan_pro_price', label: 'Professional Plan' },
                         { id: 'plan_enterprise_price', label: 'Enterprise Plan' }
                       ].map(plan => (
                        <div key={plan.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                           <span className="text-xs font-bold text-slate-600">{plan.label}</span>
                           <input 
                              type="text"
                              className="bg-white border border-slate-200 text-right text-xs font-bold px-2 py-1 rounded outline-none focus:border-brand-500"
                              value={settings[plan.id] || ''}
                              onChange={(e) => setSettings({...settings, [plan.id]: e.target.value})}
                           />
                        </div>
                       ))}
                    </div>

                    <button 
                      onClick={async () => {
                        await api.admin.updateSettings(settings);
                        toast.success('Pricing constraints updated successfully');
                      }}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                    >
                      Sync Pricing Constraints
                    </button>
                 </div>
              </div>
            )}
          </div>

          {/* Right Context Sidebar - Only for User Selection */}
          <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto">
            <AnimatePresence mode="wait">
              {selectedUser ? (
                <motion.div
                  key={selectedUser.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-6 space-y-6"
                >
                  <div className="text-center">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto shadow-xl ring-4 ring-slate-50">
                      {selectedUser.username[0].toUpperCase()}
                    </div>
                    <h2 className="mt-4 text-base font-bold text-slate-900">{selectedUser.displayName}</h2>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">UID: {selectedUser.id.split('-')[0]}</span>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => loadUserFiles(selectedUser.id)}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        Audit Objects
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handlePasswordReset(selectedUser.email)}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-slate-400" />
                        Reset Access
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-100">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity Operations</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-2">
                          <span>STORAGE QUOTA</span>
                          <span>{((selectedUser.storageUsed / selectedUser.storageLimit) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mb-3">
                          <div 
                            className="bg-brand-500 h-full transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (selectedUser.storageUsed / selectedUser.storageLimit) * 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-medium">{formatBytes(selectedUser.storageUsed)}</span>
                          <select 
                            className="bg-white border border-slate-200 text-[10px] font-bold rounded px-1.5 py-0.5 outline-none focus:border-brand-500"
                            value={Math.round(selectedUser.storageLimit / (1024 * 1024 * 1024))}
                            onChange={(e) => handleUpdateLimit(selectedUser.id, parseInt(e.target.value))}
                          >
                            {[1, 5, 15, 50, 100, 500, 1024].map(v => (
                              <option key={v} value={v}>{v < 1024 ? `${v} GB` : '1 TB'}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleDeleteUser(selectedUser.id)}
                        className="w-full py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                      >
                        Revoke Identity
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <UserIcon className="w-8 h-8 text-slate-200 mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Node</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
