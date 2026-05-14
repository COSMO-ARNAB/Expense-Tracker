const { contextBridge, ipcRenderer } = require('electron');

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
  }
});