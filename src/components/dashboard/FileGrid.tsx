import React, { useState } from 'react';
import { 
  File, 
  Folder, 
  MoreVertical, 
  Star, 
  Trash2, 
  Download, 
  Share2, 
  RotateCcw,
  Info,
  ExternalLink,
  ChevronRight,
  FileText,
  FileImage,
  FileVideo,
  FileCode,
  Music,
  Cloud,
  X,
  Pencil,
  ArrowUp,
  ArrowDown,
  FileArchive,
  FileSpreadsheet,
  Presentation,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { FileItem, Section } from '@/types';
import { formatBytes } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface FileGridProps {
  files: FileItem[];
  loading: boolean;
  onFileClick: (file: FileItem) => void;
  onRefresh: () => void;
  section: Section;
  currentFolder?: string | null;
  onBackToRoot?: () => void;
  onUploadToFolder?: (files: FileList | File[], destFolderId: string | null) => Promise<void>;
  searchQuery?: string;
}

const getPublicUrl = (id: string, name: string) => {
  let cleanName = name;
  try {
    cleanName = decodeURIComponent(name);
  } catch (e) {
    // Ignore error
  }
  cleanName = cleanName
    .replace(/%/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.-]/g, '-');
  
  cleanName = cleanName.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return `/api/files/public/${id}/${cleanName}`;
};

const getAbsolutePublicUrl = (id: string, name: string) => {
  return `${window.location.origin}${getPublicUrl(id, name)}`;
};

const getFileCategory = (name: string, mime?: string): string => {
  const ext = name.toLowerCase().split('.').pop() || '';
  const m = (mime || '').toLowerCase();

  if (ext === 'pdf' || m.includes('pdf')) return 'pdf';
  if (['doc', 'docx'].includes(ext) || m.includes('word') || m.includes('msword') || m.includes('officedocument.wordprocessingml')) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(ext) || m.includes('excel') || m.includes('spreadsheet') || m.includes('officedocument.spreadsheetml') || m.includes('csv')) return 'spreadsheet';
  if (['ppt', 'pptx'].includes(ext) || m.includes('powerpoint') || m.includes('presentation') || m.includes('officedocument.presentationml')) return 'presentation';
  if (ext === 'txt' || m.startsWith('text/plain')) return 'text';

  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext) || m.startsWith('image/')) return 'image';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp'].includes(ext) || m.startsWith('video/')) return 'video';
  if (['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'wma'].includes(ext) || m.startsWith('audio/')) return 'audio';
  
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'dmg', 'iso'].includes(ext) || m.includes('zip') || m.includes('compressed') || m.includes('archive')) return 'archive';
  
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'xml', 'yaml', 'yml', 'sh', 'bash', 'sql'].includes(ext) || 
      m.includes('javascript') || m.includes('typescript') || m.includes('html') || m.includes('json') || m.includes('css') || m.includes('code') || m.startsWith('text/')) return 'code';

  return 'generic';
};

const getFileIcon = (file: FileItem) => {
  if (file.type === 'folder') return <Folder className="w-12 h-12 text-brand-400 fill-brand-50" />;
  
  const category = getFileCategory(file.name, file.mime);

  if (category === 'image') {
    return (
      <div className="w-full h-24 rounded-lg border border-slate-200/60 overflow-hidden flex items-center justify-center bg-slate-50 shadow-xs relative">
        <img 
          src={getPublicUrl(file.id, file.name)} 
          alt={file.name} 
          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }
  if (category === 'video') {
    return (
      <div className="w-full h-24 rounded-lg border border-slate-200/60 overflow-hidden flex items-center justify-center bg-slate-950 relative shadow-xs">
        <video 
          src={`${getPublicUrl(file.id, file.name)}#t=0.5`} 
          preload="metadata"
          muted
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
          <FileVideo className="w-8 h-8 opacity-90" />
        </div>
      </div>
    );
  }
  if (category === 'audio') {
    return (
      <div className="w-full h-24 rounded-lg border border-slate-200/60 overflow-hidden flex flex-col items-center justify-center bg-pink-50/40 relative shadow-xs">
        <Music className="w-10 h-10 text-pink-500" />
      </div>
    );
  }
  if (category === 'pdf') {
    return (
      <div className="w-full h-24 rounded-lg border border-slate-200/60 overflow-hidden flex items-center justify-center bg-red-50/40 shadow-xs">
        <FileText className="w-10 h-10 text-red-500" />
      </div>
    );
  }
  if (category === 'word') {
    return (
      <div className="w-full h-24 rounded-lg border border-slate-200/60 overflow-hidden flex items-center justify-center bg-blue-50/40 shadow-xs">
        <FileText className="w-10 h-10 text-blue-500" />
      </div>
    );
  }
  if (category === 'spreadsheet') {
    return (
      <div className="w-full h-24 rounded-lg border border-slate-200/60 overflow-hidden flex items-center justify-center bg-emerald-50/40 shadow-xs">
        <FileSpreadsheet className="w-10 h-10 text-emerald-500" />
      </div>
    );
  }
  if (category === 'presentation') {
    return (
      <div className="w-full h-24 rounded-lg border border-slate-200/60 overflow-hidden flex items-center justify-center bg-orange-50/40 shadow-xs">
        <Presentation className="w-10 h-10 text-orange-500" />
      </div>
    );
  }
  if (category === 'archive') {
    return (
      <div className="w-full h-24 rounded-lg border border-slate-200/60 overflow-hidden flex items-center justify-center bg-purple-50/40 shadow-xs">
        <FileArchive className="w-10 h-10 text-purple-500" />
      </div>
    );
  }
  if (category === 'code') {
    return (
      <div className="w-full h-24 rounded-lg border border-slate-200/60 overflow-hidden flex items-center justify-center bg-amber-50/40 shadow-xs">
        <FileCode className="w-10 h-10 text-amber-500" />
      </div>
    );
  }
  if (category === 'text') {
    return (
      <div className="w-full h-24 rounded-lg border border-slate-200/60 overflow-hidden flex items-center justify-center bg-slate-50 shadow-xs">
        <FileText className="w-10 h-10 text-slate-500" />
      </div>
    );
  }
  
  return (
    <div className="w-full h-24 rounded-lg border border-slate-200/60 overflow-hidden flex items-center justify-center bg-slate-50 shadow-xs">
      <File className="w-10 h-10 text-slate-400" />
    </div>
  );
};

const getFileIconTiny = (file: FileItem) => {
  if (file.type === 'folder') return <Folder className="w-5 h-5 text-brand-500 fill-brand-100 shrink-0" />;
  
  const category = getFileCategory(file.name, file.mime);

  if (category === 'image') {
    return (
      <div className="w-6 h-6 rounded border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 shrink-0 select-none shadow-xs">
        <img 
          src={getPublicUrl(file.id, file.name)} 
          alt={file.name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }
  
  if (category === 'video') return <FileVideo className="w-5 h-5 text-indigo-500 shrink-0" />;
  if (category === 'audio') return <Music className="w-5 h-5 text-pink-500 shrink-0" />;
  if (category === 'pdf') return <FileText className="w-5 h-5 text-red-500 shrink-0" />;
  if (category === 'word') return <FileText className="w-5 h-5 text-blue-500 shrink-0" />;
  if (category === 'spreadsheet') return <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />;
  if (category === 'presentation') return <Presentation className="w-5 h-5 text-orange-500 shrink-0" />;
  if (category === 'archive') return <FileArchive className="w-5 h-5 text-purple-500 shrink-0" />;
  if (category === 'code') return <FileCode className="w-5 h-5 text-amber-500 shrink-0" />;
  if (category === 'text') return <FileText className="w-5 h-5 text-slate-500 shrink-0" />;
  
  return <File className="w-5 h-5 text-slate-400 shrink-0" />;
};

export default function FileGrid({ files, loading, onFileClick, onRefresh, section, currentFolder = null, onBackToRoot, onUploadToFolder, searchQuery = '' }: FileGridProps) {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list'); // Default to LIST
  const [sortField, setSortField] = useState<'name' | 'modifiedAt' | 'size' | 'type'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Renaming system states
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);
  const [renameName, setRenameName] = useState('');
  const [submitRenaming, setSubmitRenaming] = useState(false);

  // Preview & Sharing States
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [shareEmails, setShareEmails] = useState('');
  const [sharing, setSharing] = useState(false);
  const [textPreviewContent, setTextPreviewContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);

  const [folderPath, setFolderPath] = useState<{ id: string, name: string }[]>([]);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Bulk operations states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [allFolders, setAllFolders] = useState<{ id: string, name: string }[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    warning?: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const formatFileNameExtensionsUpper = (name: string): string => {
    if (!name.includes('.')) return name;
    const parts = name.split('.');
    if (parts.length <= 1) return name;
    const ext = parts.pop() || '';
    return [...parts, ext.toUpperCase()].join('.');
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setSelectedFile(null);
        setRenamingFile(null);
        setPreviewFile(null);
        setShareFile(null);
        setShowMoveModal(false);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (!searchQuery) {
      setSortField('name');
      setSortDirection('asc');
      setViewMode('list');
    }
  }, [searchQuery]);

  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [currentFolder, section]);

  React.useEffect(() => {
    if (showMoveModal) {
      api.files.listAllFolders()
        .then(setAllFolders)
        .catch(console.error);
    }
  }, [showMoveModal]);

  React.useEffect(() => {
    if (!currentFolder) {
      setFolderPath([]);
      return;
    }
    api.files.getFolderPath(currentFolder)
      .then(setFolderPath)
      .catch(console.error);
  }, [currentFolder]);

  const handleDragStart = (e: React.DragEvent, item: FileItem) => {
    let ids = [item.id];
    if (selectedIds.has(item.id)) {
      ids = Array.from(selectedIds);
    }
    e.dataTransfer.setData('text/plain', JSON.stringify(ids));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItemId(item.id);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };

  const handleDragOverItem = (e: React.DragEvent, targetItem: FileItem) => {
    if (targetItem.type === 'folder') {
      e.preventDefault();
      if (targetItem.id !== draggedItemId) {
        setDragOverFolderId(targetItem.id);
      }
    }
  };

  const handleDragLeaveItem = (e: React.DragEvent, targetItem: FileItem) => {
    if (targetItem.type === 'folder' && dragOverFolderId === targetItem.id) {
      setDragOverFolderId(null);
    }
  };

  const handleDropOnItem = async (e: React.DragEvent, targetItem: FileItem) => {
    if (targetItem.type !== 'folder') return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);

    // Check if dropping files from OS/outside the app
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (onUploadToFolder) {
        await onUploadToFolder(e.dataTransfer.files, targetItem.id);
      }
      return;
    }

    const rawData = e.dataTransfer.getData('text/plain');
    let itemIds: string[] = [];
    try {
      if (rawData.startsWith('[')) {
        itemIds = JSON.parse(rawData);
      } else if (rawData) {
        itemIds = [rawData];
      }
    } catch {
      itemIds = draggedItemId ? [draggedItemId] : [];
    }
    if (itemIds.length === 0) return;
    
    if (itemIds.includes(targetItem.id)) {
      toast.error("Cannot move a folder into itself");
      return;
    }

    try {
      await api.files.move(itemIds, targetItem.id);
      toast.success("Items moved successfully!");
      setSelectedIds(new Set());
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to move items");
    }
  };

  React.useEffect(() => {
    if (!previewFile) {
      setTextPreviewContent(null);
      return;
    }
    const category = getFileCategory(previewFile.name, previewFile.mime);
    const isText = category === 'code' || category === 'text';

    if (isText) {
      setLoadingText(true);
      const publicUrl = getPublicUrl(previewFile.id, previewFile.name);
      fetch(publicUrl)
        .then(res => res.text())
        .then(text => {
          setTextPreviewContent(text);
          setLoadingText(false);
        })
        .catch(err => {
          console.error(err);
          setTextPreviewContent('Failed to load text preview content.');
          setLoadingText(false);
        });
    } else {
      setTextPreviewContent(null);
    }
  }, [previewFile]);

  const handleStar = async (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.files.star(file.id, !file.starred);
      toast.success(file.starred ? 'Removed from favorites' : 'Added to favorites');
      onRefresh();
    } catch (e) {
      toast.error('Failed to update favorite status');
    }
  };

  const handleTrash = async (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Move to Recycle Bin?',
      message: `Are you sure you want to move "${file.name}" to the Recycle Bin?`,
      confirmText: 'Move to Trash',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.files.trash([file.id]);
          toast.success('Moved to recycle bin');
          setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(file.id);
            return next;
          });
          onRefresh();
        } catch (e) {
          toast.error('Failed to trash item');
        }
      }
    });
  };

  const handleRestore = async (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.files.restore([file.id]);
      toast.success('Item restored');
      onRefresh();
    } catch (e) {
      toast.error('Failed to restore item');
    }
  };

  const handleDelete = async (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Permanently Delete Item?',
      message: `Are you sure you want to permanently delete "${file.name}"? This action is irreversible.`,
      warning: 'Files in Trash will be automatically deleted after 30 days.',
      confirmText: 'Delete Permanently',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.files.deletePermanent([file.id]);
          toast.success('Item deleted permanently');
          setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(file.id);
            return next;
          });
          onRefresh();
        } catch (e) {
          toast.error('Failed to delete item');
        }
      }
    });
  };

  const handleBulkTrash = async () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Move Selected Items to Recycle Bin?',
      message: `Are you sure you want to move these ${selectedIds.size} selected items to the Recycle Bin?`,
      confirmText: 'Move to Trash',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.files.trash(Array.from(selectedIds));
          toast.success(`Moved ${selectedIds.size} items to recycle bin`);
          setSelectedIds(new Set());
          onRefresh();
        } catch (e) {
          toast.error('Failed to trash items');
        }
      }
    });
  };

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return;
    try {
      await api.files.restore(Array.from(selectedIds));
      toast.success(`Restored ${selectedIds.size} items`);
      setSelectedIds(new Set());
      onRefresh();
    } catch (e) {
      toast.error('Failed to restore items');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Permanently Delete Items?',
      message: `Are you sure you want to permanently delete these ${selectedIds.size} selected items? This action is irreversible.`,
      warning: 'Files in Trash will be automatically deleted after 30 days.',
      confirmText: 'Delete Permanently',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.files.deletePermanent(Array.from(selectedIds));
          toast.success(`Permanently deleted ${selectedIds.size} items`);
          setSelectedIds(new Set());
          onRefresh();
        } catch (e) {
          toast.error('Failed to delete items');
        }
      }
    });
  };

  const handleEmptyTrash = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Empty Recycle Bin?',
      message: 'Are you sure you want to permanently delete all items in the Recycle Bin? This action is irreversible.',
      warning: 'Files in Trash will be automatically deleted after 30 days.',
      confirmText: 'Empty Trash',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const trashFileIds = files.map(f => f.id);
          if (trashFileIds.length > 0) {
            await api.files.deletePermanent(trashFileIds);
            toast.success('Recycle bin emptied successfully');
            setSelectedIds(new Set());
            onRefresh();
          }
        } catch (e) {
          toast.error('Failed to empty recycle bin');
        }
      }
    });
  };

  const handleBulkMove = async () => {
    if (selectedIds.size === 0) return;
    setMoving(true);
    try {
      await api.files.move(Array.from(selectedIds), targetFolderId);
      toast.success(`Moved ${selectedIds.size} items successfully`);
      setSelectedIds(new Set());
      setShowMoveModal(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to move items');
    } finally {
      setMoving(false);
    }
  };

  const handleDownload = async (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = await api.files.getDownloadUrl(file.id);
      window.open(url, '_blank');
    } catch (e) {
      toast.error('Failed to download file');
    }
  };

  const renderBreadcrumbs = () => {
    return null;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-medium font-sans">Scanning storage...</p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="p-6">
        {renderBreadcrumbs()}
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white border border-surface-200 rounded-xl min-h-[300px]">
          <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-4">
            <Cloud className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No items found</h3>
          <p className="text-xs text-slate-500 max-w-xs">
            {section === 'trash' ? 'Your recycle bin is empty.' : 'Upload files or create folders to get started.'}
          </p>
        </div>
      </div>
    );
  }

  // File sorting engine: Folders always listed first
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;

    let compare = 0;
    if (sortField === 'name') {
      compare = a.name.localeCompare(b.name);
    } else if (sortField === 'modifiedAt') {
      compare = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
    } else if (sortField === 'size') {
      compare = (a.size || 0) - (b.size || 0);
    } else if (sortField === 'type') {
      const mimeA = a.mime || '';
      const mimeB = b.mime || '';
      compare = mimeA.localeCompare(mimeB);
    }

    return sortDirection === 'asc' ? compare : -compare;
  });

  return (
    <div className="p-6">
      {/* Search/Breadcrumb & View Modes Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-surface-200 pb-4">
        {renderBreadcrumbs()}

        {/* Toolbar controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sorting Field Select */}
          <div className="flex items-center gap-1.5 text-xs bg-white border border-surface-200 rounded-lg px-2.5 py-1.5 text-slate-600 shadow-xs">
            <span className="text-slate-400 font-medium">Sort by:</span>
            <select 
              value={sortField} 
              onChange={(e) => setSortField(e.target.value as any)}
              className="bg-transparent border-none outline-none font-semibold text-slate-700 cursor-pointer focus:ring-0 text-xs pr-1"
            >
              <option value="name">Name</option>
              <option value="modifiedAt">Date Modified</option>
              <option value="size">Size</option>
              <option value="type">Type</option>
            </select>
          </div>

          {/* Sorting Direction Toggle */}
          <button 
            type="button"
            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 bg-white hover:bg-surface-50 border border-surface-200 rounded-lg text-slate-600 shadow-xs text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer mr-1.5"
            title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDirection === 'asc' ? (
              <>
                <ArrowUp className="w-3.5 h-3.5 text-slate-400" />
                <span>Asc</span>
              </>
            ) : (
              <>
                <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Desc</span>
              </>
            )}
          </button>

          {/* Action Items next to "Sort by" section */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 py-0.5 animate-fade-in">
              <span className="text-[11px] font-bold text-brand-600 font-sans mr-1 bg-brand-50 px-2 py-1 rounded-lg">
                {selectedIds.size} selected
              </span>
              
              {section === 'trash' ? (
                <>
                  <button
                    type="button"
                    onClick={handleBulkRestore}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    title="Restore Selected"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Restore</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-750 border border-red-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    title="Delete Forever"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Delete Forever</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Single selected item special actions */}
                  {selectedIds.size === 1 && (() => {
                    const singleItem = files.find(f => f.id === Array.from(selectedIds)[0]);
                    if (!singleItem) return null;
                    if (singleItem.type === 'folder') {
                      return (
                        <button
                          type="button"
                          onClick={() => onFileClick(singleItem)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="Open Folder"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          <span className="hidden lg:inline">Open</span>
                        </button>
                      );
                    } else {
                      return (
                        <button
                          type="button"
                          onClick={() => setPreviewFile(singleItem)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="Preview File"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span className="hidden lg:inline">Preview</span>
                        </button>
                      );
                    }
                  })()}

                  <button
                    type="button"
                    onClick={() => {
                      setTargetFolderId(null);
                      setShowMoveModal(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    title="Move to Folder"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Move</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkTrash}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    title="Move to Trash"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Trash</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Deselect All"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Views Toggle (List/Grid) */}
          <div className="flex items-center bg-surface-100 rounded-lg p-0.5 border border-surface-200">
            <button 
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white shadow-xs text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}
              title="List View"
            >
              <span className="text-xs px-1">List</span>
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-semibold transition-all ${viewMode === 'grid' ? 'bg-white shadow-xs text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}
              title="Grid View"
            >
              <span className="text-xs px-1">Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Persistent Recycle Bin Warning with "Empty Trash" trigger */}
      {section === 'trash' && (
        <div className="mb-4 bg-amber-50/70 border border-amber-200/60 rounded-xl px-4 py-2.5 text-amber-850 text-xs font-medium flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Files in Trash will be automatically deleted after 30 days.</span>
          </div>
          {files.length > 0 && (
            <button
              onClick={handleEmptyTrash}
              className="text-[11px] font-bold text-red-650 hover:text-red-800 transition-colors flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-red-50 border border-red-150 rounded-lg cursor-pointer shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Empty Trash
            </button>
          )}
        </div>
      )}

      {/* Main Files Display */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-surface-200 shadow-xs overflow-visible">
          {/* Header Row */}
          <div className="grid grid-cols-12 items-center bg-surface-50 border-b border-surface-200 text-slate-400 font-bold text-[10px] uppercase tracking-wider py-3 px-4 select-none gap-4">
            <div className="col-span-9 sm:col-span-7 md:col-span-5 lg:col-span-4 flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={sortedFiles.length > 0 && sortedFiles.every(f => selectedIds.has(f.id))}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds(new Set(sortedFiles.map(f => f.id)));
                  } else {
                    setSelectedIds(new Set());
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
              />
              <span>Name</span>
            </div>
            <div className="hidden md:block md:col-span-3 lg:col-span-3">Date Modified</div>
            <div className="hidden sm:block sm:col-span-2 md:col-span-2 lg:col-span-2">Size</div>
            <div className="hidden lg:block lg:col-span-1">Type</div>
            <div className="col-span-3 sm:col-span-3 md:col-span-2 lg:col-span-2 text-right">Actions</div>
          </div>
          {/* Body Rows */}
          <div className="divide-y divide-surface-100 text-sm">
            <AnimatePresence>
              {sortedFiles.map((file) => (
                <motion.div
                  layout
                  key={file.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ position: 'relative', zIndex: selectedFile?.id === file.id ? 100 : 'auto' }}
                  draggable={section !== 'trash'}
                  onDragStart={(e) => handleDragStart(e, file)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOverItem(e, file)}
                  onDragLeave={(e) => handleDragLeaveItem(e, file)}
                  onDrop={(e) => handleDropOnItem(e, file)}
                  onClick={() => {
                    const next = new Set(selectedIds);
                    if (next.has(file.id)) {
                      next.delete(file.id);
                    } else {
                      next.add(file.id);
                    }
                    setSelectedIds(next);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (file.type === 'folder') {
                      onFileClick(file);
                    } else {
                      setPreviewFile(file);
                    }
                  }}
                  className={`grid grid-cols-12 items-center py-3 px-4 transition-colors cursor-pointer gap-4 ${
                    selectedIds.has(file.id)
                      ? 'bg-brand-50 border-y border-brand-100'
                      : dragOverFolderId === file.id 
                        ? 'bg-brand-50/20 border-y border-brand-500' 
                        : 'hover:bg-surface-50/70'
                  }`}
                >
                  <div className="col-span-9 sm:col-span-7 md:col-span-5 lg:col-span-4 font-semibold text-slate-950 min-w-0 flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(file.id)}
                      onChange={(e) => {
                        const next = new Set(selectedIds);
                        if (e.target.checked) {
                          next.add(file.id);
                        } else {
                          next.delete(file.id);
                        }
                        setSelectedIds(next);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer shrink-0"
                    />
                    {getFileIconTiny(file)}
                    <span 
                      className="truncate block flex-1 hover:text-brand-600 transition-colors select-none" 
                      title={file.name}
                    >
                      {formatFileNameExtensionsUpper(file.name)}
                    </span>
                    {file.starred && (
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    )}
                    {file.sharedWith && file.sharedWith.length > 0 && (
                      <span className="text-[9px] bg-indigo-50 text-indigo-600 rounded-full px-1.5 py-0.5 font-bold border border-indigo-100 shrink-0">Shared</span>
                    )}
                  </div>
                  <div className="hidden md:block md:col-span-3 lg:col-span-3 text-slate-500 font-sans text-xs truncate">
                    {new Date(file.modifiedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                  <div className="hidden sm:block sm:col-span-2 md:col-span-2 lg:col-span-2 text-slate-500 font-mono text-xs font-semibold truncate">
                    {file.type === 'folder' ? '—' : formatBytes(file.size)}
                  </div>
                  <div className="hidden lg:block lg:col-span-1 text-slate-400 text-xs capitalize truncate">
                    {file.type === 'folder' ? 'Folder' : (file.mime?.split('/')[1] || 'file')}
                  </div>
                  <div className="col-span-3 sm:col-span-3 md:col-span-2 lg:col-span-2 text-right relative" onClick={(e) => e.stopPropagation()}>
                    {/* Unified 3-dot Action Menu for all screen sizes */}
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(selectedFile?.id === file.id ? null : file);
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        title="More actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {selectedFile?.id === file.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} />
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white shadow-2xl border border-surface-200 rounded-lg py-1.5 z-[100] text-left outline-none focus:outline-none">
                             {section === 'trash' ? (
                               <>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setSelectedFile(null); handleRestore(file, e); }} 
                                   className="w-full px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-surface-100 flex items-center gap-2 outline-none focus:outline-none cursor-pointer"
                                 >
                                   <RotateCcw className="w-3.5 h-3.5 text-slate-400" /> Restore Item
                                 </button>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setSelectedFile(null); handleDelete(file, e); }} 
                                   className="w-full px-3 py-2 text-left text-xs font-bold text-red-650 hover:bg-red-50 flex items-center gap-2 outline-none focus:outline-none cursor-pointer"
                                 >
                                   <Trash2 className="w-3.5 h-3.5" /> Delete Forever
                                 </button>
                               </>
                             ) : (
                               <>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreviewFile(file); }} 
                                   className="w-full px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-surface-100 flex items-center gap-2 outline-none focus:outline-none cursor-pointer"
                                 >
                                   <Info className="w-3.5 h-3.5 text-slate-400" /> Details & Preview
                                 </button>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setRenamingFile(file); setRenameName(file.name); }} 
                                   className="w-full px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-surface-100 flex items-center gap-2 outline-none focus:outline-none cursor-pointer"
                                 >
                                   <Pencil className="w-3.5 h-3.5 text-slate-400" /> Rename Item
                                 </button>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setSelectedFile(null); handleStar(file, e); }} 
                                   className="w-full px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-surface-100 flex items-center gap-2 outline-none focus:outline-none cursor-pointer"
                                 >
                                   <Star className={`w-3.5 h-3.5 ${file.starred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} /> {file.starred ? 'Remove Favorite' : 'Mark Favorite'}
                                 </button>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setShareFile(file); setShareEmails(file.sharedWith?.join(', ') || ''); }} 
                                   className="w-full px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-surface-100 flex items-center gap-2 outline-none focus:outline-none cursor-pointer"
                                 >
                                   <Share2 className="w-3.5 h-3.5 text-slate-400" /> Share Access
                                 </button>
                                 {file.type !== 'folder' && (
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); setSelectedFile(null); handleDownload(file, e); }} 
                                     className="w-full px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-surface-100 flex items-center gap-2 outline-none focus:outline-none cursor-pointer"
                                   >
                                     <Download className="w-3.5 h-3.5 text-slate-400" /> Download File
                                   </button>
                                 )}
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setSelectedFile(null); handleTrash(file, e); }} 
                                   className="w-full px-3 py-2 text-left text-xs font-bold text-red-650 hover:bg-red-50 flex items-center gap-2 outline-none focus:outline-none cursor-pointer"
                                 >
                                   <Trash2 className="w-3.5 h-3.5" /> Move to Bin
                                 </button>
                               </>
                             )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence>
            {sortedFiles.map((file) => (
              <motion.div
                layout
                key={file.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ position: 'relative', zIndex: selectedFile?.id === file.id ? 50 : 'auto' }}
                whileHover={{ y: -2 }}
                draggable={section !== 'trash'}
                onDragStart={(e) => handleDragStart(e, file)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOverItem(e, file)}
                onDragLeave={(e) => handleDragLeaveItem(e, file)}
                onDrop={(e) => handleDropOnItem(e, file)}
                onClick={() => {
                  const next = new Set(selectedIds);
                  if (next.has(file.id)) {
                    next.delete(file.id);
                  } else {
                    next.add(file.id);
                  }
                  setSelectedIds(next);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (file.type === 'folder') {
                    onFileClick(file);
                  } else {
                    setPreviewFile(file);
                  }
                }}
                className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group relative flex flex-col justify-between ${
                  selectedIds.has(file.id)
                    ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/10'
                    : dragOverFolderId === file.id 
                      ? 'border-brand-500 bg-brand-50/20' 
                      : 'border-surface-200 hover:border-brand-200'
                }`}
              >
                {/* Selection checkbox */}
                <input 
                  type="checkbox" 
                  checked={selectedIds.has(file.id)}
                  onChange={(e) => {
                    const next = new Set(selectedIds);
                    if (e.target.checked) {
                      next.add(file.id);
                    } else {
                      next.delete(file.id);
                    }
                    setSelectedIds(next);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2.5 left-2.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer z-10"
                />

                {/* Actions button for Grid items (visible on mobile, shown on hover/focus on desktop) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(file);
                  }}
                  className="absolute top-2 right-2 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                  title="More actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                <div className="flex justify-center py-6 mb-2 relative">
                  {getFileIcon(file)}
                  
                  {/* Premium Direct Hover Toolbar with Tooltips inside Grid cards */}
                  <div className="absolute inset-x-0 bottom-[-4px] flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 py-1.5 px-1 rounded-md shadow-lg border border-slate-100 z-10" onClick={(e) => e.stopPropagation()}>
                    {section === 'trash' ? (
                      <>
                        {/* Restore Item */}
                        <div className="tooltip-trigger inline-block">
                          <button 
                            onClick={(e) => handleRestore(file, e)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden tooltip-target bg-slate-900 text-white text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap z-50 font-sans font-semibold">
                            Restore
                          </div>
                        </div>

                        {/* Delete Forever */}
                        <div className="tooltip-trigger inline-block">
                          <button 
                            onClick={(e) => handleDelete(file, e)}
                            className="p-1 hover:bg-red-50 rounded text-slate-500 hover:text-red-650 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden tooltip-target bg-slate-900 text-white text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap z-50 font-sans font-semibold">
                            Delete Forever
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Details & Preview */}
                        <div className="tooltip-trigger inline-block">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-teal-600 transition-colors cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden tooltip-target bg-slate-900 text-white text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap z-50 font-sans font-semibold">
                            Details & Preview
                          </div>
                        </div>

                        {/* Rename */}
                        <div className="tooltip-trigger inline-block">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setRenamingFile(file); setRenameName(file.name); }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden tooltip-target bg-slate-900 text-white text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap z-50 font-sans font-semibold">
                            Rename Item
                          </div>
                        </div>

                        {/* Star */}
                        <div className="tooltip-trigger inline-block">
                          <button 
                            onClick={(e) => handleStar(file, e)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-amber-500 transition-colors cursor-pointer"
                          >
                            <Star className={`w-3.5 h-3.5 ${file.starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden tooltip-target bg-slate-900 text-white text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap z-50 font-sans font-semibold">
                            {file.starred ? 'Unfavorite' : 'Favorite'}
                          </div>
                        </div>

                        {/* Share */}
                        <div className="tooltip-trigger inline-block">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShareFile(file); setShareEmails(file.sharedWith?.join(', ') || ''); }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden tooltip-target bg-slate-900 text-white text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap z-50 font-sans font-semibold">
                            Share File
                          </div>
                        </div>

                        {/* Download */}
                        {file.type !== 'folder' && (
                          <div className="tooltip-trigger inline-block">
                            <button 
                              onClick={(e) => handleDownload(file, e)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-950 transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden tooltip-target bg-slate-900 text-white text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap z-50 font-sans font-semibold">
                              Download
                            </div>
                          </div>
                        )}

                        {/* Move to Bin */}
                        <div className="tooltip-trigger inline-block">
                          <button 
                            onClick={(e) => handleTrash(file, e)}
                            className="p-1 hover:bg-red-50 rounded text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden tooltip-target bg-slate-900 text-white text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap z-50 font-sans font-semibold">
                            Move to Bin
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900 truncate pr-4" title={file.name}>
                    {formatFileNameExtensionsUpper(file.name)}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono font-medium uppercase">
                    <span>{file.type === 'folder' ? 'Folder' : formatBytes(file.size)}</span>
                    <span>•</span>
                    <span>{new Date(file.modifiedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Popover list options inside Grid elements */}
                {selectedFile?.id === file.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} />
                    <div className="absolute top-10 right-2 w-48 bg-white shadow-2xl border border-surface-200 rounded-lg py-1.5 z-50 text-left">
                       {section === 'trash' ? (
                          <>
                           <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); handleRestore(file, e); }} className="w-full px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-surface-100 flex items-center gap-2">
                             <RotateCcw className="w-3.5 h-3.5 text-slate-400" /> Restore
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); handleDelete(file, e); }} className="w-full px-3 py-2 text-left text-xs font-bold text-red-650 hover:bg-red-50 flex items-center gap-2">
                             <Trash2 className="w-3.5 h-3.5" /> Delete Forever
                           </button>
                          </>
                       ) : (
                          <>
                           <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreviewFile(file); }} className="w-full px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-surface-100 flex items-center gap-2">
                             <Info className="w-3.5 h-3.5 text-slate-400" /> Details & Preview
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setRenamingFile(file); setRenameName(file.name); }} className="w-full px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-surface-100 flex items-center gap-2">
                             <Pencil className="w-3.5 h-3.5 text-slate-400" /> Rename Item
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); handleStar(file, e); }} className="w-full px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-surface-100 flex items-center gap-2">
                              <Star className={`w-3.5 h-3.5 ${file.starred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} /> {file.starred ? 'Unfavorite' : 'Add to Favorites'}
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setShareFile(file); setShareEmails(file.sharedWith?.join(', ') || ''); }} className="w-full px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-surface-100 flex items-center gap-2">
                             <Share2 className="w-3.5 h-3.5 text-slate-400" /> Share file
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); handleDownload(file, e); }} className="w-full px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-surface-100 flex items-center gap-2">
                             <Download className="w-3.5 h-3.5 text-slate-400" /> Download
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); handleTrash(file, e); }} className="w-full px-3 py-2 text-left text-xs font-bold text-red-650 hover:bg-red-50 flex items-center gap-2">
                             <Trash2 className="w-3.5 h-3.5" /> Move to bin
                           </button>
                          </>
                       )}
                    </div>
                  </>
                )}

                {file.starred && section !== 'starred' && (
                  <div className="absolute bottom-4 right-4">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Share File Modal */}
      <AnimatePresence>
        {shareFile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShareFile(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-surface-200 p-6 relative z-10"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-2 font-display">Share Access</h3>
              <p className="text-xs text-slate-500 mb-4">Provide emails below to grant direct workspace viewing access to "{shareFile.name}".</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">User Email Addresses</label>
                  <input 
                    type="text" 
                    value={shareEmails}
                    onChange={(e) => setShareEmails(e.target.value)}
                    placeholder="teammate@conzex.com, info@example.com"
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none"
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">Separate multiple emails with commas. Users will see this in their Shared section immediately.</p>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShareFile(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-surface-200 text-slate-600 font-bold text-sm hover:bg-surface-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      if (!shareEmails.trim()) {
                        toast.error('Please input at least one email address');
                        return;
                      }
                      setSharing(true);
                      try {
                        const emailList = shareEmails.split(',').map(e => e.trim()).filter(Boolean);
                        await api.files.share(shareFile.id, emailList);
                        toast.success('File shared successfully!');
                        setShareFile(null);
                        onRefresh();
                      } catch (err: any) {
                        toast.error(err.message || 'Error sharing file');
                      } finally {
                        setSharing(false);
                      }
                    }}
                    disabled={sharing}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {sharing ? 'Processing...' : 'Share Access'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rename File/Folder Modal */}
      <AnimatePresence>
        {renamingFile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRenamingFile(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-surface-200 p-6 relative z-10"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-2 font-display">Rename Item</h3>
              <p className="text-xs text-slate-500 mb-4 font-sans">Enter a new display name for "{renamingFile.name}".</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-display">New Name</label>
                  <input 
                    type="text" 
                    value={renameName}
                    onChange={(e) => setRenameName(e.target.value)}
                    placeholder="E.g. Project Specs"
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const saveBtn = document.getElementById('submit-rename-btn');
                        if (saveBtn) saveBtn.click();
                      }
                    }}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setRenamingFile(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-surface-200 text-slate-600 font-bold text-sm hover:bg-surface-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    id="submit-rename-btn"
                    onClick={async () => {
                      if (!renameName.trim()) {
                        toast.error('Name cannot be empty');
                        return;
                      }
                      setSubmitRenaming(true);
                      try {
                        await api.files.rename(renamingFile.id, renameName.trim());
                        toast.success('Successfully renamed item');
                        setRenamingFile(null);
                        onRefresh();
                      } catch (err: any) {
                        toast.error(err.message || 'Error renaming item');
                      } finally {
                        setSubmitRenaming(false);
                      }
                    }}
                    disabled={submitRenaming}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50"
                  >
                    {submitRenaming ? 'Saving...' : 'Save Name'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewFile(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-surface-200 p-6 relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Preview Header */}
              <div className="flex items-start justify-between mb-4 border-b border-surface-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-50 rounded-lg">
                    {getFileIconTiny(previewFile)}
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-bold text-slate-900 truncate max-w-xs sm:max-w-md" title={previewFile.name}>{formatFileNameExtensionsUpper(previewFile.name)}</h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {formatBytes(previewFile.size)} • {previewFile.mime || 'unknown type'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewFile(null)}
                  className="p-1 hover:bg-surface-100 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview Screen */}
              <div className="flex-1 bg-surface-50 border border-surface-200 rounded-xl overflow-hidden flex items-center justify-center p-4 min-h-[350px] max-h-[500px]">
                {loadingText ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <span className="text-xs text-slate-500 font-medium">Reading file content...</span>
                  </div>
                ) : textPreviewContent !== null ? (
                  <div className="w-full h-full bg-slate-900 rounded-lg p-4 overflow-auto border border-slate-800 text-left relative group text-xs font-mono">
                    <button 
                      type="button"
                      onClick={() => {
                        if (textPreviewContent) {
                          navigator.clipboard.writeText(textPreviewContent);
                          toast.success("Text content copied to clipboard!");
                        }
                      }}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white rounded px-2 py-1 text-[10px] font-bold cursor-pointer"
                    >
                      Copy Content
                    </button>
                    <pre className="text-slate-100 whitespace-pre scrollbar-thin scrollbar-thumb-slate-700">
                      <code>{textPreviewContent || '(Empty file)'}</code>
                    </pre>
                  </div>
                ) : getFileCategory(previewFile.name, previewFile.mime) === 'image' ? (
                  <img 
                    src={getPublicUrl(previewFile.id, previewFile.name)} 
                    alt={previewFile.name} 
                    className="max-w-full max-h-full object-contain rounded-md shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : getFileCategory(previewFile.name, previewFile.mime) === 'video' ? (
                  <video 
                    src={getPublicUrl(previewFile.id, previewFile.name)} 
                    controls 
                    className="max-w-full max-h-full rounded-md shadow-sm"
                    autoPlay
                    muted
                  />
                ) : getFileCategory(previewFile.name, previewFile.mime) === 'audio' ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-900 rounded-xl w-full max-w-md shadow-md border border-slate-800">
                    <Music className="w-14 h-14 text-pink-500 animate-bounce mb-6" />
                    <audio 
                      src={getPublicUrl(previewFile.id, previewFile.name)} 
                      controls 
                      className="w-full text-slate-900"
                    />
                    <span className="text-[10px] mt-3 text-slate-400 font-mono tracking-tight font-medium">Audio streaming session</span>
                  </div>
                ) : getFileCategory(previewFile.name, previewFile.mime) === 'pdf' ? (
                  <iframe 
                    src={getPublicUrl(previewFile.id, previewFile.name)} 
                    className="w-full h-[400px] border-none rounded-lg bg-white"
                    title={previewFile.name}
                  />
                ) : ['word', 'spreadsheet', 'presentation'].includes(getFileCategory(previewFile.name, previewFile.mime)) ? (
                  <div className="w-full h-full flex flex-col">
                    <div className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] px-3 py-1.5 rounded-lg mb-2 text-center font-medium">
                      Live document preview loaded via cloud office renderer.
                    </div>
                    <iframe 
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(
                        getAbsolutePublicUrl(previewFile.id, previewFile.name)
                      )}&embedded=true`} 
                      className="w-full h-[380px] border-none rounded-lg bg-white shadow-inner"
                      title={previewFile.name}
                    />
                  </div>
                ) : getFileCategory(previewFile.name, previewFile.mime) === 'archive' ? (
                  <div className="flex flex-col items-center justify-center py-10 px-6 bg-purple-50/50 rounded-xl w-full max-w-md shadow-sm border border-purple-100 text-center">
                    <FileArchive className="w-16 h-16 text-purple-500 animate-pulse mb-4" />
                    <h4 className="text-sm font-bold text-slate-800">Secure Compressed Archive Container</h4>
                    <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
                      This is a compressed workspace bundle. Due to browser constraints, archive extractions must be executed locally.
                    </p>
                    <a
                      href={getPublicUrl(previewFile.id, previewFile.name)}
                      download={previewFile.name}
                      className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-purple-600/10 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Archive File
                    </a>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-white/85 shadow-xs border border-surface-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      {getFileIconTiny(previewFile)}
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Preview not available for this format</p>
                    <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">Standard type: {previewFile.mime || 'Binary Stream'}. You can download the physical file or view it directly in a new tab.</p>
                  </div>
                )}
              </div>

              {/* Direct reference block */}
              <div className="mt-4 bg-slate-50 border border-slate-250/70 rounded-xl p-3 flex flex-col gap-2 text-left">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Direct Dev View URL (Public Embed Link)</span>
                  <span className="text-brand-600 font-bold bg-brand-50 border border-brand-100 px-1 rounded">No Security Cookie Required</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getAbsolutePublicUrl(previewFile.id, previewFile.name)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 select-all font-mono outline-none"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getAbsolutePublicUrl(previewFile.id, previewFile.name));
                      toast.success("Public embed URL with extension copied to clipboard!");
                    }}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    Copy Link
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Perfect for direct visual rendering, HTML code fragments, or loading natively into other external development platforms.</p>
              </div>

              {/* Preview Actions Footer */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-surface-100 text-xs">
                <span className="text-slate-400 font-medium">Modified: {new Date(previewFile.modifiedAt).toLocaleString()}</span>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { handleStar(previewFile, e); setPreviewFile(prev => prev ? { ...prev, starred: !prev.starred } : null); }}
                    className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl font-bold transition-all ${previewFile.starred ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-surface-200 text-slate-600 hover:bg-surface-50'}`}
                  >
                    <Star className={`w-3.5 h-3.5 ${previewFile.starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                    {previewFile.starred ? 'Favorited' : 'Favorite'}
                  </button>

                  <a 
                    href={`/api/files/view/${previewFile.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-surface-200 hover:bg-surface-50 text-slate-600 rounded-xl font-bold transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    Open in New Tab
                  </a>

                  <a 
                    href={`/api/files/download/${previewFile.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 shadow-md shadow-brand-500/15 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Target Folder Select Modal */}
      <AnimatePresence>
        {showMoveModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 w-full max-w-md max-h-[85vh] flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-150">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Folder className="w-5 h-5 text-brand-500" />
                    <span>Move {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} to...</span>
                  </h3>
                  <button 
                    onClick={() => setShowMoveModal(false)}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 mt-3 mb-4 font-medium">
                  Select a destination folder below to move your selected files/folders.
                </p>

                <div className="border border-slate-200 rounded-xl max-h-60 overflow-y-auto p-1 bg-slate-50 divide-y divide-slate-100">
                  {/* Root option */}
                  <button
                    type="button"
                    onClick={() => setTargetFolderId(null)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-xs transition-all text-left outline-none ${
                      targetFolderId === null 
                        ? 'bg-brand-50 border border-brand-100 text-brand-700 shadow-xs' 
                        : 'border border-transparent font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-4.5 h-4.5 text-brand-500 fill-brand-50" />
                      <span>Home Root (xFiles)</span>
                    </div>
                  </button>

                  {/* Other user folders */}
                  {allFolders
                    .filter(f => !selectedIds.has(f.id)) // prevent moving a folder into its selected self
                    .map(fold => (
                      <button
                        key={fold.id}
                        type="button"
                        onClick={() => setTargetFolderId(fold.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-xs transition-all text-left outline-none ${
                          targetFolderId === fold.id 
                            ? 'bg-brand-50 border border-brand-100 text-brand-700 shadow-xs' 
                            : 'border border-transparent font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="w-4.5 h-4.5 text-brand-500 fill-brand-50" />
                          <span>{fold.name}</span>
                        </div>
                      </button>
                    ))}

                  {allFolders.filter(f => !selectedIds.has(f.id)).length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-4 font-medium">No other destination folders available.</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowMoveModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={moving}
                  onClick={handleBulkMove}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/15 cursor-pointer"
                >
                  {moving ? 'Moving...' : 'Move Items'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-surface-200 p-6 relative z-10 overflow-hidden text-left"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-full shrink-0 ${confirmModal.isDestructive ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 font-display">{confirmModal.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">{confirmModal.message}</p>
                </div>
              </div>

              {confirmModal.warning && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-amber-800 text-[11px] font-medium leading-relaxed mb-6 select-none flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{confirmModal.warning}</span>
                </div>
              )}
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-surface-200 text-slate-600 font-bold text-sm hover:bg-surface-50 transition-colors cursor-pointer text-center"
                >
                  {confirmModal.cancelText || 'Cancel'}
                </button>
                <button 
                  onClick={async () => {
                    const run = confirmModal.onConfirm;
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    await run();
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-white font-bold text-sm transition-colors shadow-lg cursor-pointer text-center ${
                    confirmModal.isDestructive 
                      ? 'bg-red-600 hover:bg-red-750 shadow-red-600/10' 
                      : 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/10'
                  }`}
                >
                  {confirmModal.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
