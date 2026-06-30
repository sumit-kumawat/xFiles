import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import FileGrid from './FileGrid';
import AdminDashboard from '../admin/AdminDashboard';
import { Section, FileItem } from '@/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { safeHistory } from '@/lib/utils';

interface DashboardProps {
  user: any;
}

export default function Dashboard({ user }: DashboardProps) {
  const [currentFolder, setCurrentFolder] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('folder') || null;
  });
  const [section, setSection] = useState<Section>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('section') as Section) || 'my-storage';
  });
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ used: 0, total: 100 * 1024 * 1024 * 1024 });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadingFilesCount, setUploadingFilesCount] = useState<number>(0);

  const navigateTo = (newSection: Section, newFolder: string | null, push: boolean = true) => {
    setSection(newSection);
    setCurrentFolder(newFolder);
    
    if (push) {
      const url = new URL(window.location.href);
      url.searchParams.set('section', newSection);
      if (newFolder) {
        url.searchParams.set('folder', newFolder);
      } else {
        url.searchParams.delete('folder');
      }
      safeHistory.pushState({ section: newSection, folder: newFolder }, '', url.pathname + url.search);
    }
  };

  useEffect(() => {
    // Initial history state so back button behaves nicely from the very beginning
    const initialParams = new URLSearchParams(window.location.search);
    const initialSection = (initialParams.get('section') as Section) || 'my-storage';
    const initialFolder = initialParams.get('folder') || null;
    
    if (!safeHistory.state) {
      safeHistory.replaceState({ section: initialSection, folder: initialFolder }, '', window.location.pathname + window.location.search);
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        setSection(event.state.section || 'my-storage');
        setCurrentFolder(event.state.folder || null);
      } else {
        const params = new URLSearchParams(window.location.search);
        setSection((params.get('section') as Section) || 'my-storage');
        setCurrentFolder(params.get('folder') || null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleLogoRefresh = () => {
    navigateTo('my-storage', null, true);
    setSearchQuery('');
    window.location.reload();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const processUpload = async (filesToUpload: FileList | File[], destFolderId: string | null = currentFolder) => {
    const fileList = Array.from(filesToUpload);
    if (fileList.length === 0) return;

    setUploadingFilesCount(fileList.length);
    setUploadPercent(0);
    const toastId = toast.loading(`Preparing folder upload structures for ${fileList.length} items...`);

    try {
      // Group files by relative directory path
      const groups: Record<string, File[]> = {};
      fileList.forEach(file => {
        const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [];
        if (pathParts.length > 1) {
          const folderPath = pathParts.slice(0, -1).join('/');
          if (!groups[folderPath]) groups[folderPath] = [];
          groups[folderPath].push(file);
        } else {
          if (!groups[""]) groups[""] = [];
          groups[""].push(file);
        }
      });

      // Keep track of folder path -> created folder ID mapping
      const folderIdsCache: Record<string, string | null> = {};
      folderIdsCache[""] = destFolderId;

      // Sort folder paths by their depth so we create parent folders before subfolders
      const folderPaths = Object.keys(groups).filter(p => p !== "");
      folderPaths.sort((a, b) => a.split('/').length - b.split('/').length);

      // Create folders sequentially
      for (const fPath of folderPaths) {
        const parts = fPath.split('/');
        let activeParentId = destFolderId;
        let cumulativePath = "";

        for (const segment of parts) {
          cumulativePath = cumulativePath ? `${cumulativePath}/${segment}` : segment;
          if (folderIdsCache[cumulativePath] === undefined) {
            toast.loading(`Structuring folder /${cumulativePath}...`, { id: toastId });
            const folderNode = await api.files.mkdir(segment, activeParentId);
            folderIdsCache[cumulativePath] = folderNode.id;
          }
          activeParentId = folderIdsCache[cumulativePath];
        }
      }

      // Upload file batches under their mapped parent folders
      const allGroups = Object.keys(groups);
      const totalGroups = allGroups.length;

      for (let i = 0; i < totalGroups; i++) {
        const fPath = allGroups[i];
        const groupFiles = groups[fPath];
        const destFolderId = folderIdsCache[fPath];

        const pathDisplay = fPath ? ` into /${fPath}` : "";
        toast.loading(`Uploading batches${pathDisplay} (${i + 1}/${totalGroups})...`, { id: toastId });

        await api.files.upload(groupFiles, destFolderId, (percent) => {
          const subPercent = Math.round(((i + (percent / 100)) / totalGroups) * 100);
          setUploadPercent(subPercent);
          toast.loading(`Uploading files... ${subPercent}% (${i + 1}/${totalGroups})`, { id: toastId });
        });
      }

      toast.success('Upload finished successfully!', { id: toastId });
      loadFiles();
      loadStats();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err?.message || 'Upload failed', { id: toastId });
    } finally {
      setUploadPercent(null);
      setUploadingFilesCount(0);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      await processUpload(droppedFiles);
    }
  };

  const loadFiles = async (q?: string) => {
    setLoading(true);
    try {
      const data = await api.files.list({
        userId: user.id,
        parentId: currentFolder,
        section,
        q: q || searchQuery
      });
      setFiles(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.storage.info(user.id);
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [user.id, currentFolder, section]);

  useEffect(() => {
    loadStats();
  }, [user.id]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q) {
      navigateTo('my-storage', null, true);
    } else {
      loadFiles(q);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    await processUpload(e.target.files);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await api.files.mkdir(newFolderName, currentFolder);
      setNewFolderName('');
      setShowFolderModal(false);
      toast.success('Folder created');
      loadFiles();
    } catch (e) {
      toast.error('Failed to create folder');
    }
  };

  const handleSidebarDropInternal = async (itemId: string, targetSection: Section) => {
    try {
      if (targetSection === 'trash') {
        await api.files.trash([itemId]);
        toast.success("Moved item to Recycle Bin");
      } else if (targetSection === 'my-storage') {
        await api.files.move([itemId], null);
        await api.files.restore([itemId]).catch(() => {});
        toast.success("Moved item to My Drive (Root)");
      }
      loadFiles();
      loadStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to move item");
    }
  };

  const handleSidebarDropExternal = async (filesToUpload: FileList | File[], targetSection: Section) => {
    if (targetSection === 'my-storage') {
      await processUpload(filesToUpload, null);
    } else {
      toast.error("External files can only be uploaded to My Drive");
    }
  };

  return (
    <div 
      className="flex flex-col h-screen bg-white relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-brand-500/10 border-4 border-dashed border-brand-500 backdrop-blur-[2px] z-[200] flex items-center justify-center pointer-events-none transition-all duration-300">
          <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border border-brand-100 scale-100 animate-pulse">
            <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center text-brand-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-800 tracking-tight">Drop files anywhere to upload</p>
              <p className="text-xs text-slate-500 mt-1">Files will be uploaded to your current folder</p>
            </div>
          </div>
        </div>
      )}

      <Navbar 
        user={user} 
        onUpload={handleUpload} 
        onCreateFolder={() => setShowFolderModal(true)} 
        onSearch={handleSearch} 
        onLogoRefresh={handleLogoRefresh}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div className="flex flex-1 overflow-hidden relative bg-[#f8fafc] lg:p-5 lg:gap-5">
        {/* Mobile Sidebar Backdrop Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[60] lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Responsive Sliding Sidebar Container */}
        <div className={`
          fixed inset-y-0 left-0 z-[70] lg:relative lg:inset-auto lg:z-auto transition-transform duration-300 ease-in-out h-full shrink-0 w-[250px]
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <Sidebar 
            activeSection={section} 
            onSectionChange={(s) => {
              navigateTo(s, null);
              setIsSidebarOpen(false); // Auto-dismiss mobile drawer on selection
            }}
            storageUsed={stats.used}
            storageTotal={stats.total}
            userEmail={user.email || undefined}
            onUpload={handleUpload}
            onCreateFolder={() => setShowFolderModal(true)}
            onDropInternalItem={handleSidebarDropInternal}
            onDropExternalFiles={handleSidebarDropExternal}
          />
        </div>
        
        <main className="flex-1 min-w-0 overflow-y-auto bg-surface-50 lg:rounded-2xl lg:border lg:border-surface-200 lg:shadow-xs relative">
          {section === 'admin' ? (
            <AdminDashboard />
          ) : (
            <FileGrid 
              files={files} 
              loading={loading}
              currentFolder={currentFolder}
              onBackToRoot={() => navigateTo(section, null)}
              onFileClick={(file) => {
                if (file.type === 'folder') {
                  navigateTo(section, file.id);
                }
              }}
              onRefresh={loadFiles}
              section={section}
              onUploadToFolder={processUpload}
              searchQuery={searchQuery}
            />
          )}

          {/* Folder Modal */}
          <AnimatePresence>
            {showFolderModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowFolderModal(false)}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-surface-200 p-6 relative z-10"
                >
                  <h3 className="text-xl font-bold text-slate-900 mb-4 font-sans tracking-tight">New Folder</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Label</label>
                      <input 
                        autoFocus
                        type="text" 
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                        placeholder="Project X"
                        className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setShowFolderModal(false)}
                        className="flex-1 py-3 px-4 rounded-xl border border-surface-200 text-slate-600 font-bold text-sm hover:bg-surface-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleCreateFolder}
                        disabled={!newFolderName.trim()}
                        className="flex-1 py-3 px-4 rounded-xl bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:shadow-none"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Progress Overlay Widget */}
      <AnimatePresence>
        {uploadPercent !== null && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[100] bg-white border border-slate-200 shadow-2xl rounded-2xl p-5 w-80 flex flex-col gap-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
                </span>
                Uploading {uploadingFilesCount} item(s)
              </span>
              <span className="text-xs font-bold font-mono text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">
                {uploadPercent}%
              </span>
            </div>
            
            {/* Visual Progress Bar Wrapper */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div 
                className="bg-brand-500 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadPercent}%` }}
              />
            </div>
            
            <p className="text-[10px] text-slate-400 font-medium font-sans">Please wait while database sync finishes...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
