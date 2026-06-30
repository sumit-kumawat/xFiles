import { FileItem, Section } from '@/types';

export const api = {
  auth: {
    async register(email: string, pass: string, name?: string) {
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, displayName: name })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Registration failed');
      return data;
    },
    
    async login(identifier: string, pass: string) {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: pass })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Login failed');
      return data;
    },
    
    async logout() {
       const resp = await fetch('/api/auth/logout', { method: 'POST' });
       return resp.json();
    },
    
    async me() {
      const resp = await fetch('/api/auth/me');
      if (!resp.ok) return null;
      return resp.json();
    },

    async updateProfile(displayName: string) {
      const resp = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName })
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || 'Failed to update profile');
      }
      return resp.json();
    },

    async changePassword(current: string, newPass: string) {
      const resp = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: newPass })
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || 'Password update failed');
      }
      return resp.json();
    },

    async resetPassword(email: string) {
       const resp = await fetch('/api/admin/reset-password', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email })
       });
       return resp.json();
    },

    async resendVerification(email: string) {
      const resp = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to resend verification');
      return data;
    }
  },

  files: {
    async list(params: { parentId?: string | null, section?: Section, userId?: string, q?: string }) {
      const searchParams = new URLSearchParams();
      if (params.section) searchParams.append('section', params.section);
      if (params.parentId) searchParams.append('parentId', params.parentId);
      if (params.q) searchParams.append('q', params.q);
      if (params.userId) searchParams.append('userId', params.userId);
      
      const queryString = searchParams.toString();
      const endpoint = `/api/files${queryString ? `?${queryString}` : ''}`;
      
      const resp = await fetch(endpoint);
      if (!resp.ok) return [];
      return resp.json();
    },

    async mkdir(name: string, parentId?: string | null) {
      const resp = await fetch('/api/files/mkdir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId })
      });
      return resp.json();
    },

    async upload(files: FileList | File[], parentId?: string | null, onProgress?: (percent: number) => void) {
      return new Promise<any>((resolve, reject) => {
        const formData = new FormData();
        if (parentId) formData.append('parentId', parentId);
        
        const fileList = Array.from(files);
        fileList.forEach(file => {
          formData.append('files', file);
        });

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/files/upload');

        if (onProgress && xhr.upload) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              onProgress(percent);
            }
          });
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (err) {
              resolve(xhr.responseText);
            }
          } else {
            let errMsg = 'Upload failed';
            try {
              const parsed = JSON.parse(xhr.responseText);
              errMsg = parsed.error || errMsg;
            } catch (_) {}
            reject(new Error(errMsg));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network connection error during file upload'));
        };

        xhr.send(formData);
      });
    },

    async star(id: string, starred: boolean) {
      return fetch(`/api/files/${id}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred })
      });
    },

    async rename(id: string, name: string) {
      const resp = await fetch(`/api/files/${id}/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || 'Failed to rename file');
      }
      return resp.json();
    },

    async trash(ids: string[]) {
      return fetch('/api/files/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
    },

    async restore(ids: string[]) {
      return fetch('/api/files/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
    },

    async deletePermanent(ids: string[]) {
      return fetch('/api/files/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
    },

    async getDownloadUrl(fileId: string) {
       return `/api/files/download/${fileId}`;
    },

    async getViewUrl(fileId: string) {
       return `/api/files/view/${fileId}`;
    },

    async share(fileId: string, emails: string[]) {
      const resp = await fetch(`/api/files/${fileId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails })
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || 'Failed to share file');
      }
      return resp.json();
    },

    async getFolderPath(folderId: string) {
      const resp = await fetch(`/api/folders/path/${folderId}`);
      if (!resp.ok) return [];
      return resp.json();
    },

    async listAllFolders() {
      const resp = await fetch('/api/folders');
      if (!resp.ok) return [];
      return resp.json();
    },

    async move(ids: string[], targetFolderId: string | null) {
      const resp = await fetch('/api/files/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, targetFolderId })
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || 'Failed to move items');
      }
      return resp.json();
    },

    async requestMoreStorage() {
      const resp = await fetch('/api/requests/storage', { method: 'POST' });
      return resp.json();
    }
  },

  storage: {
    async info(userId?: string) {
      const resp = await fetch(`/api/storage/info${userId ? `?userId=${userId}` : ''}`);
      if (!resp.ok) return { used: 0, total: 100 * 1024 * 1024 * 1024 };
      return resp.json();
    }
  },

  settings: {
    async get() {
      const resp = await fetch('/api/settings');
      return resp.json();
    }
  },

  notifications: {
    async list() {
      const resp = await fetch('/api/notifications');
      if (!resp.ok) return [];
      return resp.json();
    }
  },

  admin: {
    async listUsers() {
      const resp = await fetch('/api/admin/users');
      if (!resp.ok) return [];
      return resp.json();
    },
    async getUserStats(userId: string) {
      const resp = await fetch(`/api/admin/stats/${userId}`);
      if (!resp.ok) return { stats: {}, totalSize: 0 };
      return resp.json();
    },
    async sendVerification(email: string) {
      const resp = await fetch('/api/admin/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return resp.json();
    },
    async resetPassword(email: string) {
      const resp = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return resp.json();
    },
    async updateStorageLimit(userId: string, limit: number) {
      const resp = await fetch(`/api/admin/users/${userId}/limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit })
      });
      return resp.json();
    },
    async deleteUser(userId: string) {
      const resp = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      return resp.json();
    },
    async listRequests() {
      const resp = await fetch('/api/admin/requests');
      return resp.json();
    },
    async approveRequest(requestId: string) {
      const resp = await fetch(`/api/admin/requests/${requestId}/approve`, { method: 'POST' });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || 'Failed to approve request');
      }
      return resp.json();
    },
    async dismissRequest(requestId: string) {
      const resp = await fetch(`/api/admin/requests/${requestId}/dismiss`, { method: 'POST' });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || 'Failed to dismiss request');
      }
      return resp.json();
    },
    async updateSettings(settings: Record<string, string>) {
      const resp = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      return resp.json();
    }
  }
};
