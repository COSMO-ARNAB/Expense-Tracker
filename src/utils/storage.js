// src/utils/storage.js
// Utility for persistent storage that works in both web and Electron environments

const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

export const storage = {
  getItem: async (key) => {
    if (isElectron()) {
      try {
        return await window.electronAPI.getStorageItem(key);
      } catch (error) {
        console.error('Electron storage error:', error);
        return localStorage.getItem(key);
      }
    }
    return localStorage.getItem(key);
  },

  setItem: async (key, value) => {
    if (isElectron()) {
      try {
        await window.electronAPI.setStorageItem(key, value);
      } catch (error) {
        console.error('Electron storage error:', error);
        localStorage.setItem(key, value);
      }
    } else {
      localStorage.setItem(key, value);
    }
  },

  removeItem: async (key) => {
    if (isElectron()) {
      try {
        await window.electronAPI.removeStorageItem(key);
      } catch (error) {
        console.error('Electron storage error:', error);
        localStorage.removeItem(key);
      }
    } else {
      localStorage.removeItem(key);
    }
  },

  // Synchronous fallback for non-async contexts
  getItemSync: (key) => {
    return localStorage.getItem(key);
  },

  setItemSync: (key, value) => {
    localStorage.setItem(key, value);
  },
};
