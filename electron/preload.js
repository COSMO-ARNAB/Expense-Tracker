const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getStorageItem: (key) => ipcRenderer.invoke('storage:get', key),
  setStorageItem: (key, value) => ipcRenderer.invoke('storage:set', key, value),
  removeStorageItem: (key) => ipcRenderer.invoke('storage:delete', key),
  getAllStorage: () => ipcRenderer.invoke('storage:getAll'),
});
