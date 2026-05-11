const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

// Connects electron to SQLite database
const db = require("../database/db.cjs");

// Use app userData directory for storing data
const userDataPath = app.getPath("userData");
const storePath = path.join(userDataPath, "store.json");

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

// ============================================
// EXISTING STORAGE IPC HANDLERS (unchanged)
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
// NEW DATABASE CRUD IPC HANDLERS
// ============================================

// --- Transactions Handlers ---

/**
 * Get all transactions from database, ordered by date (newest first)
 */
ipcMain.handle("db:getTransactions", () => {
  try {
    const stmt = db.prepare("SELECT * FROM transactions ORDER BY date DESC");
    return stmt.all();
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }
});

/**
 * Add a new transaction to the database
 * @param {Object} transaction - { id, title, amount, category, type, date }
 */
ipcMain.handle("db:addTransaction", (event, transaction) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO transactions (id, title, amount, category, type, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
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

/**
 * Delete a transaction by ID
 * @param {string} id - Transaction ID
 */
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

/**
 * Get all budgets from database
 */
ipcMain.handle("db:getBudgets", () => {
  try {
    const stmt = db.prepare("SELECT * FROM budgets");
    return stmt.all();
  } catch (error) {
    console.error("Error fetching budgets:", error);
    throw new Error(`Failed to fetch budgets: ${error.message}`);
  }
});

/**
 * Add a new budget to the database
 * @param {Object} budget - { id, category, amount }
 */
ipcMain.handle("db:addBudget", (event, budget) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO budgets (id, category, amount)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(
      budget.id,
      budget.category,
      parseFloat(budget.amount)
    );
    
    return { success: true, id: budget.id };
  } catch (error) {
    console.error("Error adding budget:", error);
    throw new Error(`Failed to add budget: ${error.message}`);
  }
});

/**
 * Delete a budget by ID
 * @param {string} id - Budget ID
 */
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

app.whenReady().then(createWindow);