const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

// Get the path to the database file in the user data folder
const dbPath = path.join(app.getPath('userData'), 'expense-tracker.db');

const db = new Database(dbPath);

// 1. Create transactions table
db.prepare(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    type TEXT NOT NULL,
    date TEXT NOT NULL
  )
`).run();

// 2. Create custom_categories table
db.exec(`
  CREATE TABLE IF NOT EXISTS custom_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    UNIQUE(name, type)
  )
`);

// 3. Create budgets table - UPDATED with startDate and endDate
db.prepare(`
  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    startDate TEXT,
    endDate TEXT
  )
`).run();

module.exports = db;