const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

// Connects electron to SQLite database
const db = require("../database/db.cjs");

const { initAutoUpdater, check, download, install, setPrefs, getStatus, getInfo } = require("./updater.cjs");

// Use app userData directory for storing data
const userDataPath = app.getPath("userData");
const storePath = path.join(userDataPath, "store.json");
const updatePrefsPath = path.join(userDataPath, "update-prefs.json");

// Establish Windows app user model id early (required for proper taskbar
// grouping and to enable auto-update notifications on Windows).
app.setAppUserModelId("com.expensetracker.app");

// Simple file-based store (kept for app settings/configuration)
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

let mainWindow = null;

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
    icon: path.join(__dirname, '../src/assets/Bar-nobg.png')
  });

  mainWindow = win;

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    win.loadURL("http://localhost:3000");
  }
}

// ============================================
// EXISTING STORAGE IPC HANDLERS
// ============================================

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

// ============================================
// DATABASE CRUD IPC HANDLERS
// ============================================

// --- Transactions Handlers ---

ipcMain.handle("db:getTransactions", () => {
  try {
    const stmt = db.prepare("SELECT * FROM transactions ORDER BY date DESC");
    return stmt.all();
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }
});

ipcMain.handle("db:addTransaction", (event, transaction) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO transactions (id, title, amount, category, type, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      transaction.id,
      transaction.title,
      parseFloat(transaction.amount),
      transaction.category,
      transaction.type,
      transaction.date || new Date().toISOString().split('T')[0]
    );
    
    return { success: true, id: transaction.id };
  } catch (error) {
    console.error("Error adding transaction:", error);
    throw new Error(`Failed to add transaction: ${error.message}`);
  }
});

ipcMain.handle("db:deleteTransaction", (event, id) => {
  try {
    const stmt = db.prepare("DELETE FROM transactions WHERE id = ?");
    const result = stmt.run(id);
    
    return { 
      success: true, 
      deletedCount: result.changes 
    };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw new Error(`Failed to delete transaction: ${error.message}`);
  }
});

// --- Budgets Handlers ---

ipcMain.handle("db:getBudgets", () => {
  try {
    const stmt = db.prepare("SELECT * FROM budgets");
    return stmt.all();
  } catch (error) {
    console.error("Error fetching budgets:", error);
    throw new Error(`Failed to fetch budgets: ${error.message}`);
  }
});

ipcMain.handle("db:addBudget", (event, budget) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO budgets (id, category, amount, startDate, endDate)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      budget.id,
      budget.category,
      parseFloat(budget.amount),
      budget.startDate,
      budget.endDate
    );
    
    return { success: true, id: budget.id };
  } catch (error) {
    console.error("Error adding budget:", error);
    throw new Error(`Failed to add budget: ${error.message}`);
  }
});

ipcMain.handle("db:updateBudget", (event, id, budget) => {
  try {
    const stmt = db.prepare(`
      UPDATE budgets 
      SET amount = ?, startDate = ?, endDate = ? 
      WHERE id = ?
    `);
    
    const result = stmt.run(
      parseFloat(budget.amount),
      budget.startDate,
      budget.endDate,
      id
    );
    
    return { success: true, updated: result.changes > 0 };
  } catch (error) {
    console.error("Error updating budget:", error);
    throw new Error(`Failed to update budget: ${error.message}`);
  }
});

ipcMain.handle("db:deleteBudget", (event, id) => {
  try {
    const stmt = db.prepare("DELETE FROM budgets WHERE id = ?");
    const result = stmt.run(id);
    
    return { 
      success: true, 
      deletedCount: result.changes 
    };
  } catch (error) {
    console.error("Error deleting budget:", error);
    throw new Error(`Failed to delete budget: ${error.message}`);
  }
});

// --- Custom Category Handlers ---

ipcMain.handle("db:getCustomCategories", () => {
  try {
    const stmt = db.prepare("SELECT * FROM custom_categories");
    return stmt.all();
  } catch (error) {
    console.error("Error fetching custom categories:", error);
    return []; 
  }
});

ipcMain.handle("db:addCustomCategory", (event, category) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO custom_categories (id, name, type)
      VALUES (?, ?, ?)
    `);
    
    stmt.run(category.id, category.name, category.type);
    return { success: true };
  } catch (error) {
    console.error("Error adding category:", error);
    throw new Error(`Failed to add category: ${error.message}`);
  }
});

ipcMain.handle("db:deleteCustomCategory", (event, id) => {
  try {
    const stmt = db.prepare("DELETE FROM custom_categories WHERE id = ?");
    stmt.run(id);
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    throw new Error(`Failed to delete category: ${error.message}`);
  }
});

ipcMain.handle("db:clearTransactions", () => {
  try {
    const stmt = db.prepare("DELETE FROM transactions");
    const result = stmt.run();
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error clearing transactions:", error);
    throw new Error(`Failed to clear transactions: ${error.message}`);
  }
});

ipcMain.handle("db:clearBudgets", () => {
  try {
    const stmt = db.prepare("DELETE FROM budgets");
    const result = stmt.run();
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error clearing budgets:", error);
    throw new Error(`Failed to clear budgets: ${error.message}`);
  }
});

// ============================================
// AUTO-UPDATE IPC HANDLERS
// ============================================

ipcMain.handle("app:info", async () => {
  try { return getInfo(); }
  catch (err) { return { error: err && err.message }; }
});

ipcMain.handle("update:check", async () => {
  try { return await check(); }
  catch (err) { return { ok: false, error: { code: 'unknown', message: err && err.message } }; }
});

ipcMain.handle("update:download", async () => {
  try { return await download(); }
  catch (err) { return { ok: false, error: { code: 'unknown', message: err && err.message } }; }
});

ipcMain.handle("update:install", async () => {
  try { return install(); }
  catch (err) { return { ok: false, error: { code: 'unknown', message: err && err.message } }; }
});

ipcMain.handle("update:status", async () => {
  try { return getStatus(); }
  catch (err) { return { status: null, info: null, prefs: {}, error: err && err.message }; }
});

ipcMain.handle("update:set-channel", async (event, channel) => {
  try { return await setPrefs({ channel }); }
  catch (err) { return { ok: false, error: err && err.message }; }
});

ipcMain.handle("update:set-auto-download", async (event, value) => {
  try { return await setPrefs({ autoDownload: !!value }); }
  catch (err) { return { ok: false, error: err && err.message }; }
});

ipcMain.handle("update:set-prefs", async (event, prefs) => {
  try { return await setPrefs(prefs || {}); }
  catch (err) { return { ok: false, error: err && err.message }; }
});

app.whenReady().then(createWindow);
app.whenReady().then(() => {
  initAutoUpdater({ getMainWindow: () => mainWindow, prefsPath: updatePrefsPath });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
