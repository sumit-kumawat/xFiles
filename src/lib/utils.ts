import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const safeHistory = {
  pushState(state: any, title: string, url?: string | null) {
    try {
      window.history.pushState(state, title, url || undefined);
    } catch (e) {
      console.warn("safeHistory.pushState ignored due to iframe sandbox policy:", e);
    }
  },
  replaceState(state: any, title: string, url?: string | null) {
    try {
      window.history.replaceState(state, title, url || undefined);
    } catch (e) {
      console.warn("safeHistory.replaceState ignored due to iframe sandbox policy:", e);
    }
  },
  get state() {
    try {
      return window.history.state;
    } catch (e) {
      console.warn("safeHistory.state access failed; fallback to null:", e);
      return null;
    }
  }
};

