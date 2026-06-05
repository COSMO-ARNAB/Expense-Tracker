const { contextBridge, ipcRenderer } = require('electron');

const UPDATE_EVENT_CHANNEL = 'update:event';

contextBridge.exposeInMainWorld('electronAPI', {
  getStorageItem: (key) => ipcRenderer.invoke('storage:get', key),
  setStorageItem: (key, value) => ipcRenderer.invoke('storage:set', key, value),
  removeStorageItem: (key) => ipcRenderer.invoke('storage:delete', key),
  getAllStorage: () => ipcRenderer.invoke('storage:getAll'),

  // New database API
  db: {
    getTransactions: () => ipcRenderer.invoke('db:getTransactions'),
    addTransaction: (transaction) => ipcRenderer.invoke('db:addTransaction', transaction),
    deleteTransaction: (id) => ipcRenderer.invoke('db:deleteTransaction', id),
    
    getBudgets: () => ipcRenderer.invoke('db:getBudgets'),
    addBudget: (budget) => ipcRenderer.invoke('db:addBudget', budget),
    // THE MISSING LINK: Now React can successfully call updateBudget!
    updateBudget: (id, budget) => ipcRenderer.invoke('db:updateBudget', id, budget),
    deleteBudget: (id) => ipcRenderer.invoke('db:deleteBudget', id),

    getCustomCategories: () => ipcRenderer.invoke('db:getCustomCategories'),
    addCustomCategory: (category) => ipcRenderer.invoke('db:addCustomCategory', category),
    deleteCustomCategory: (id) => ipcRenderer.invoke("db:deleteCustomCategory", id),
    clearTransactions: () => ipcRenderer.invoke('db:clearTransactions'),
    clearBudgets: () => ipcRenderer.invoke('db:clearBudgets')
  },

  // Auto-update API
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  getUpdateStatus: () => ipcRenderer.invoke('update:status'),
  setUpdateChannel: (channel) => ipcRenderer.invoke('update:set-channel', channel),
  setAutoDownload: (value) => ipcRenderer.invoke('update:set-auto-download', value),
  setUpdatePrefs: (prefs) => ipcRenderer.invoke('update:set-prefs', prefs),

  /**
   * Subscribe to update events from the main process.
   * Returns an unsubscribe function. Always call it from useEffect cleanup.
   */
  onUpdateEvent: (handler) => {
    if (typeof handler !== 'function') return () => {};
    const wrapped = (_event, payload) => {
      try { handler(payload); } catch (err) { console.warn('electronAPI.onUpdateEvent handler threw', err); }
    };
    ipcRenderer.on(UPDATE_EVENT_CHANNEL, wrapped);
    return () => {
      try { ipcRenderer.removeListener(UPDATE_EVENT_CHANNEL, wrapped); } catch (_) {}
    };
  }
});
