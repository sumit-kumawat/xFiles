import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  Users, 
  Star, 
  Trash2, 
  PieChart, 
  ShieldCheck, 
  Plus, 
  FolderPlus, 
  Upload,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Section } from '@/types';
import { formatBytes } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  storageUsed: number;
  storageTotal: number;
  userEmail?: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateFolder: () => void;
  onDropInternalItem?: (itemId: string, targetSection: Section) => void;
  onDropExternalFiles?: (files: FileList | File[], targetSection: Section) => void;
}

export default function Sidebar({ 
  activeSection, 
  onSectionChange, 
  storageUsed, 
  storageTotal, 
  userEmail,
  onUpload,
  onCreateFolder,
  onDropInternalItem,
  onDropExternalFiles
}: SidebarProps) {
  const percentage = Math.min((storageUsed / storageTotal) * 100, 100);
  const barColorClass = percentage >= 85 
    ? "bg-gradient-to-r from-red-500 to-pink-600" 
    : percentage >= 50 
      ? "bg-gradient-to-r from-amber-500 to-orange-500" 
      : "bg-gradient-to-r from-emerald-500 to-teal-500";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const newMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (newMenuRef.current && !newMenuRef.current.contains(event.target as Node)) {
        setShowNewMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const menuItems = [
    { id: 'my-storage', label: 'My Drive', icon: <FileText className="w-5 h-5" /> },
    { id: 'shared', label: 'Shared with me', icon: <Users className="w-5 h-5" /> },
    { id: 'recent', label: 'Recent', icon: <Clock className="w-5 h-5" /> },
    { id: 'starred', label: 'Starred', icon: <Star className="w-5 h-5" /> },
    { id: 'trash', label: 'Trash', icon: <Trash2 className="w-5 h-5" /> },
  ];

  const adminItems = (userEmail === 'admin@conzex.com' || userEmail === 'kumawatsumit45@gmail.com') ? [
    { id: 'admin', label: 'Admin Console', icon: <ShieldCheck className="w-5 h-5" /> }
  ] : [];

  return (
    <div className="w-[250px] bg-[#f8fafc] h-full border-r border-surface-200 lg:border-none flex flex-col pt-6 px-4 shrink-0 select-none z-20">
      {/* Hidden file input for Sidebar "Upload Files" action */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onUpload} 
        className="hidden" 
        multiple 
      />

      {/* Hidden folder input for Sidebar "Upload Folder" action */}
      <input 
        type="file" 
        ref={folderInputRef} 
        onChange={onUpload} 
        className="hidden" 
        multiple 
        {...({ webkitdirectory: "", directory: "" } as any)}
      />

      {/* Iconic "New" action button */}
      <div ref={newMenuRef} className="relative mb-6">
        <button
          type="button"
          onClick={() => setShowNewMenu(!showNewMenu)}
          className="flex items-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl cursor-pointer select-none font-bold text-xs focus:outline-none w-full justify-center"
        >
          <Plus className="w-4.5 h-4.5 text-white stroke-[2.5]" />
          <span>New</span>
        </button>

        <AnimatePresence>
          {showNewMenu && (
            <>
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 p-1.5 overflow-hidden outline-none focus:outline-none"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowNewMenu(false);
                    onCreateFolder();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left outline-none focus:outline-none focus:ring-0"
                >
                  <FolderPlus className="w-4.5 h-4.5 text-brand-500 fill-brand-50" />
                  New folder
                </button>
                <div className="h-[1px] bg-slate-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setShowNewMenu(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left outline-none focus:outline-none focus:ring-0"
                >
                  <Upload className="w-4.5 h-4.5 text-emerald-500" />
                  File upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewMenu(false);
                    folderInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left outline-none focus:outline-none focus:ring-0"
                >
                  <Upload className="w-4.5 h-4.5 text-indigo-500" />
                  Folder upload
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation menu list */}
      <div className="space-y-1">
        {menuItems.map((item) => {
          const isActive = activeSection === item.id;
          const isDragOver = dragOverSection === item.id;
          const canDrop = item.id === 'my-storage' || item.id === 'trash';

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id as Section)}
              onDragOver={(e) => {
                if (canDrop) {
                  e.preventDefault();
                  setDragOverSection(item.id);
                }
              }}
              onDragLeave={() => {
                if (canDrop) {
                  setDragOverSection(null);
                }
              }}
              onDrop={(e) => {
                if (canDrop) {
                  e.preventDefault();
                  setDragOverSection(null);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    onDropExternalFiles?.(e.dataTransfer.files, item.id as Section);
                  } else {
                    const itemId = e.dataTransfer.getData('text/plain');
                    if (itemId) {
                      onDropInternalItem?.(itemId, item.id as Section);
                    }
                  }
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full transition-all text-xs font-bold leading-none cursor-pointer border ${
                isDragOver
                  ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-xs'
                  : isActive 
                    ? 'bg-brand-100/70 text-brand-800 border-transparent' 
                    : 'text-slate-600 hover:bg-slate-200/50 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className={isActive || isDragOver ? 'text-brand-600' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}

        {adminItems.length > 0 && (
          <div className="pt-4 mt-4 border-t border-slate-200/75">
            <p className="px-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Management</p>
            {adminItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id as Section)}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full transition-all text-xs font-bold cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-100/70 text-indigo-800' 
                      : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  <span className={isActive ? 'text-indigo-600' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Storage and branding progress meter block */}
      <div className="mt-auto pt-4 flex flex-col gap-4 border-t border-slate-200/60 pb-4">
        <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200/60 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-slate-700">
             <PieChart className="w-4 h-4 text-brand-500" />
             <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 select-none">Storage Cloud</span>
          </div>
          
          <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden shadow-inner relative">
            <div 
              className={`${barColorClass} h-full rounded-full transition-all duration-500`} 
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-mono font-bold text-slate-600">
              {formatBytes(storageUsed)} of {formatBytes(storageTotal)} used
            </p>
            <button 
              type="button"
              onClick={async () => {
                try {
                  await api.files.requestMoreStorage();
                  toast.success("Storage quota request sent to admin! Check status soon.");
                } catch (e) {
                  toast.error("Failed to post storage request");
                }
              }}
              className="text-[10px] font-bold text-brand-600 hover:text-brand-700 select-none text-left tracking-tight underline cursor-pointer"
            >
              Request storage quota booster
            </button>
          </div>
        </div>
        
        <hr className="border-t border-slate-200/60" />
        
        <div className="px-1 text-center sm:text-left text-[10px]">
          <span className="text-slate-400">© {new Date().getFullYear()} </span>
          <a 
            href="https://conzex.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-bold bg-gradient-to-r from-[#FF9933] via-[#2563EB] to-[#16A34A] bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            A Conzex Global Product
          </a>
        </div>
      </div>
    </div>
  );
}
