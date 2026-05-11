const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

// Use app userData directory for storing data
const userDataPath = app.getPath("userData");
const storePath = path.join(userDataPath, "store.json");

// Simple file-based store
class SimpleStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.store = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, "utf-8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn("Error loading store:", error);
    }
    return {};
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.store, null, 2), "utf-8");
    } catch (error) {
      console.error("Error saving store:", error);
    }
  }

  get(key) {
    return this.store[key];
  }

  set(key, value) {
    this.store[key] = value;
    this.save();
  }

  delete(key) {
    delete this.store[key];
    this.save();
  }
}

const store = new SimpleStore(storePath);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../src/assets/Bar-nobg.png') // Updated icon path
  });

  

if (app.isPackaged) {
  win.loadFile(path.join(__dirname, "../dist/index.html"));
} else {
  win.loadURL("http://localhost:3000");
}
}

// Handle storage IPC requests
ipcMain.handle("storage:get", (event, key) => {
  return store.get(key);
});

ipcMain.handle("storage:set", (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle("storage:delete", (event, key) => {
  store.delete(key);
  return true;
});

ipcMain.handle("storage:getAll", () => {
  return store.store || {};
});

app.whenReady().then(createWindow);