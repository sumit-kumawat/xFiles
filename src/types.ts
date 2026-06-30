export type FileType = 'file' | 'folder';
export type Section = 'my-storage' | 'recent' | 'starred' | 'trash' | 'shared' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  emailVerified?: boolean;
  createdAt: any;
  storageUsed: number;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size: number;
  mime?: string;
  parentId: string | null;
  userId: string;
  storagePath?: string;
  modifiedAt: any;
  starred: boolean;
  deleted: boolean;
  deletedAt?: any;
  tags?: string[];
  sharedWith?: string[]; // Array of user emails
  aiSummary?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  targetId: string;
  targetName: string;
  timestamp: any;
}

export interface StorageInfo {
  used: number;
  total: number;
}
