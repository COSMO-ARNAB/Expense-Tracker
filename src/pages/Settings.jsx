// src/pages/Settings.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings as SettingsIcon,
  Palette,
  Tag,
  Bell,
  Database,
  Trash2,
  Download,
  Upload,
  Plus,
  Check,
  AlertTriangle,
  Info,
  Globe,
  Calendar,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useUpdate } from '../contexts/UpdateContext';
import UpdateSettingsSection from '../components/update/UpdateSettingsSection';

// Harmonious avatar color options
const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Rose
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
];

const PREBUILT_CATEGORIES = {
  Expense: ["Food", "Transport", "Bills", "Entertainment", "Shopping", "Health", "Education", "Others"],
  Income: ["Salary", "Bonus", "Allowance", "Freelance", "Investment", "Other"]
};

const Settings = () => {
  const {
    displayName, avatarColor, currency, locale, dateFormat,
    budgetAlertThreshold, alertEnabled, compactMode, defaultCategory, defaultTransactionType,
    updateSetting, updateAllSettings
  } = useSettings();

  const {
    customCategories, saveCustomCategory, removeCustomCategory,
    transactions, budgets
  } = useTransactions();

  const { state: updateState, actions: updateActions } = useUpdate();

  const [activeTab, setActiveTab] = useState('profile');

  // Custom Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('Expense');

  // Database reset modal states
  const [showClearTxModal, setShowClearTxModal] = useState(false);
  const [showClearBudgetModal, setShowClearBudgetModal] = useState(false);

  // Toast notifications for premium feedback
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // 1. DATA EXPORT ACTIONS
  const handleExportCSV = async () => {
    try {
      const txs = await window.electronAPI.db.getTransactions();
      if (!txs || txs.length === 0) {
        triggerToast("No transactions found to export", "warning");
        return;
      }

      const headers = 'ID,Title,Amount,Category,Type,Date\n';
      const rows = txs.map(t =>
        `"${t.id}","${t.title.replace(/"/g, '""')}",${t.amount},"${t.category}","${t.type}","${t.date}"`
      ).join('\n');

      const csvContent = headers + rows;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `expenseos_transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerToast("CSV exported successfully!");
    } catch (e) {
      console.error(e);
      triggerToast("Failed to export CSV", "error");
    }
  };

  const handleExportJSON = async () => {
    try {
      const txs = await window.electronAPI.db.getTransactions();
      const bds = await window.electronAPI.db.getBudgets();
      const cats = await window.electronAPI.db.getCustomCategories();

      const backupData = {
        version: updateState.info.appVersion || "1.0.0",
        exportDate: new Date().toISOString(),
        transactions: txs || [],
        budgets: bds || [],
        customCategories: cats || [],
        appSettings: {
          displayName, avatarColor, currency, locale, dateFormat,
          budgetAlertThreshold, alertEnabled, compactMode, defaultCategory, defaultTransactionType
        }
      };

      const jsonContent = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `expenseos_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerToast("JSON backup exported successfully!");
    } catch (e) {
      console.error(e);
      triggerToast("Failed to export backup", "error");
    }
  };

  // 2. DATA IMPORT ACTION
  const handleImportJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        let importedTxs = 0;
        let importedBudgets = 0;
        let importedCats = 0;

        // Import Custom Categories
        if (data.customCategories && Array.isArray(data.customCategories)) {
          for (const cat of data.customCategories) {
            // Check for duplicates
            const exists = customCategories.some(c => c.name.toLowerCase() === cat.name.toLowerCase() && c.type === cat.type);
            if (!exists) {
              await saveCustomCategory(cat);
              importedCats++;
            }
          }
        }

        // Import Budgets
        if (data.budgets && Array.isArray(data.budgets)) {
          for (const b of data.budgets) {
            try {
              await window.electronAPI.db.addBudget(b);
              importedBudgets++;
            } catch (err) {
              console.warn("Budget duplicate or fail:", err.message);
            }
          }
        }

        // Import Transactions
        if (data.transactions && Array.isArray(data.transactions)) {
          for (const tx of data.transactions) {
            try {
              await window.electronAPI.db.addTransaction(tx);
              importedTxs++;
            } catch (err) {
              console.warn("Transaction duplicate or fail:", err.message);
            }
          }
        }

        // Import App Settings if present
        if (data.appSettings) {
          updateAllSettings(data.appSettings);
        }

        triggerToast(`Imported: ${importedTxs} transactions, ${importedBudgets} budgets, ${importedCats} categories!`);

        // Reload page data in the React state after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (err) {
        console.error(err);
        triggerToast("Failed to parse JSON file", "error");
      }
    };
    reader.readAsText(file);
  };

  // 3. DATA RESET ACTIONS
  const handleClearTransactions = async () => {
    try {
      await window.electronAPI.db.clearTransactions();
      setShowClearTxModal(false);
      triggerToast("All transactions cleared successfully!");
      setTimeout(() => { window.location.reload(); }, 1000);
    } catch (e) {
      console.error(e);
      triggerToast("Failed to clear transactions", "error");
    }
  };

  const handleClearBudgets = async () => {
    try {
      await window.electronAPI.db.clearBudgets();
      setShowClearBudgetModal(false);
      triggerToast("All budgets cleared successfully!");
      setTimeout(() => { window.location.reload(); }, 1000);
    } catch (e) {
      console.error(e);
      triggerToast("Failed to clear budgets", "error");
    }
  };

  // 4. CATEGORY ACTION
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const exists = [...PREBUILT_CATEGORIES[newCatType], ...customCategories.filter(c => c.type === newCatType).map(c => c.name)]
      .some(name => name.toLowerCase() === newCatName.trim().toLowerCase());

    if (exists) {
      triggerToast("Category name already exists", "warning");
      return;
    }

    const newCat = {
      id: Date.now().toString(),
      name: newCatName.trim(),
      type: newCatType
    };

    await saveCustomCategory(newCat);
    setNewCatName('');
    triggerToast("Custom category added!");
  };

  return (
    <div className="p-8 max-w-6xl mx-auto relative">

      {/* TOAST SYSTEM */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border text-sm font-semibold
              ${toast.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                toast.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                'bg-indigo-50 border-indigo-100 text-indigo-600'}`}
          >
            {toast.type === 'error' ? <AlertTriangle size={18} /> : <Check size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <SettingsIcon className="text-indigo-600 animate-[spin_5s_linear_infinite]" size={28} />
          Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Configure your personal preferences, look-and-feel, and local databases.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">

        {/* LEFT TAB NAVIGATION */}
        <div className="w-full md:w-64 bg-white border border-slate-100 rounded-3xl p-3 shadow-sm space-y-1">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'categories', label: 'Categories', icon: Tag },
            { id: 'alerts', label: 'Budget Alerts', icon: Bell },
            { id: 'data', label: 'Data Management', icon: Database },
            { id: 'updates', label: 'Updates', icon: RefreshCw }
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-semibold transition-all relative
                  ${isActive ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-600 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <TabIcon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* RIGHT CONTENT WORKSPACE */}
        <div className="flex-1 w-full bg-white border border-slate-100 rounded-3xl p-8 shadow-sm min-h-[500px]">
          <AnimatePresence mode="wait">

            {/* TABS CONTAINER */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >

              {/* TAB 1: PROFILE */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Profile / Identity</h2>
                    <p className="text-slate-400 text-xs">Customize who you are in the application.</p>
                  </div>

                  {/* LIVE PREVIEW BANNER */}
                  <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-6 flex items-center gap-5">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-md border-4 border-white transition-all duration-300"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Welcome Back, {displayName || 'User'}!</h4>
                      <p className="text-slate-400 text-xs mt-0.5">This avatar and color is used in sidebars and greeted cards.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {/* Display Name Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => updateSetting('displayName', e.target.value)}
                        placeholder="Arnab"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
                      />
                    </div>

                    {/* Avatar Color Picker */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Avatar Theme Color</label>
                      <div className="flex flex-wrap gap-3">
                        {AVATAR_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => updateSetting('avatarColor', color)}
                            className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm cursor-pointer relative hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            title={color}
                          >
                            {avatarColor === color && (
                              <motion.div
                                layoutId="activeColorCheck"
                                className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-full text-white"
                              >
                                <Check size={16} strokeWidth={3} />
                              </motion.div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: APPEARANCE */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">App Preferences</h2>
                    <p className="text-slate-400 text-xs">Configure dates, currencies, and layout scaling.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Currency Symbol Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-indigo-500" />
                        Currency Symbol
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => updateSetting('currency', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
                      >
                        <option value="Γé╣">Γé╣ (INR)</option>
                        <option value="$">$ (USD)</option>
                        <option value="Γé¼">Γé¼ (EUR)</option>
                        <option value="┬ú">┬ú (GBP)</option>
                        <option value="┬Ñ">┬Ñ (JPY)</option>
                      </select>
                    </div>

                    {/* Locale Format Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Globe size={12} className="text-indigo-500" />
                        Locale Formatting
                      </label>
                      <select
                        value={locale}
                        onChange={(e) => updateSetting('locale', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
                      >
                        <option value="en-IN">en-IN (e.g. Γé╣1,00,000.00)</option>
                        <option value="en-US">en-US (e.g. $100,000.00)</option>
                        <option value="en-GB">en-GB (e.g. ┬ú100,000.00)</option>
                        <option value="de-DE">de-DE (e.g. Γé¼100.000,00)</option>
                        <option value="fr-FR">fr-FR (e.g. Γé¼100 000,00)</option>
                      </select>
                    </div>

                    {/* Date Format Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Calendar size={12} className="text-indigo-500" />
                        Date Format
                      </label>
                      <select
                        value={dateFormat}
                        onChange={(e) => updateSetting('dateFormat', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
                      >
                        <option value="dd MMM yyyy">dd MMM yyyy (e.g. 29 May 2026)</option>
                        <option value="MM/dd/yyyy">MM/dd/yyyy (e.g. 05/29/2026)</option>
                        <option value="yyyy-MM-dd">yyyy-MM-dd (e.g. 2026-05-29)</option>
                      </select>
                    </div>

                    {/* Compact Mode Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-5">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Compact Mode</h4>
                        <p className="text-slate-400 text-[11px] mt-0.5">Tighten spacing for tabular grids and dashboard charts.</p>
                      </div>
                      <button
                        onClick={() => updateSetting('compactMode', !compactMode)}
                        className={`w-12 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${compactMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      >
                        <motion.div
                          layout
                          className="w-5 h-5 bg-white rounded-full shadow-md"
                          animate={{ x: compactMode ? 24 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CATEGORIES */}
              {activeTab === 'categories' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Data & Categories</h2>
                    <p className="text-slate-400 text-xs">Manage customized classifications for your cashflow.</p>
                  </div>

                  {/* Add Custom Category Form */}
                  <form onSubmit={handleAddCategory} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category Name</label>
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="e.g. Crypto, Gym, Pet Food"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                      />
                    </div>

                    <div className="w-full md:w-48">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Type</label>
                      <select
                        value={newCatType}
                        onChange={(e) => setNewCatType(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
                      >
                        <option value="Expense">Expense</option>
                        <option value="Income">Income</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-100 transition-all cursor-pointer"
                    >
                      <Plus size={18} />
                      Add Category
                    </button>
                  </form>

                  {/* Categories Lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Expense Categories */}
                    <div className="border border-slate-100 rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2 mb-3">Custom Expense Categories</h3>
                      {customCategories.filter(c => c.type === 'Expense').length > 0 ? (
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2">
                          {customCategories.filter(c => c.type === 'Expense').map(c => (
                            <div
                              key={c.id}
                              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-100 text-xs font-bold text-slate-700 group transition-all"
                            >
                              <span>{c.name}</span>
                              <button
                                onClick={() => removeCustomCategory(c.id)}
                                className="text-slate-300 hover:text-rose-500 rounded p-0.5 group-hover:scale-105 transition-transform"
                                title={`Delete ${c.name}`}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-medium">No custom expense categories added yet.</p>
                      )}
                    </div>

                    {/* Income Categories */}
                    <div className="border border-slate-100 rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2 mb-3">Custom Income Categories</h3>
                      {customCategories.filter(c => c.type === 'Income').length > 0 ? (
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2">
                          {customCategories.filter(c => c.type === 'Income').map(c => (
                            <div
                              key={c.id}
                              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-100 text-xs font-bold text-slate-700 group transition-all"
                            >
                              <span>{c.name}</span>
                              <button
                                onClick={() => removeCustomCategory(c.id)}
                                className="text-slate-300 hover:text-rose-500 rounded p-0.5 group-hover:scale-105 transition-transform"
                                title={`Delete ${c.name}`}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-medium">No custom income categories added yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Defaults for modal forms */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Default Category selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Default Input Category</label>
                      <select
                        value={defaultCategory}
                        onChange={(e) => updateSetting('defaultCategory', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
                      >
                        <option value="">None (Select Manually)</option>
                        {[...PREBUILT_CATEGORIES.Expense, ...customCategories.filter(c => c.type === 'Expense').map(c => c.name)].map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Default type selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Default Transaction Type</label>
                      <select
                        value={defaultTransactionType}
                        onChange={(e) => updateSetting('defaultTransactionType', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BUDGET ALERTS */}
              {activeTab === 'alerts' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Notifications & Warnings</h2>
                    <p className="text-slate-400 text-xs">Set up smart limits and alert points for active budgets.</p>
                  </div>

                  <div className="space-y-6">
                    {/* Alert Master Toggle */}
                    <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Enable In-App Budget Warnings</h4>
                        <p className="text-slate-400 text-xs mt-0.5">Alerts are processed locally on the client and will not send standard OS push banners.</p>
                      </div>
                      <button
                        onClick={() => updateSetting('alertEnabled', !alertEnabled)}
                        className={`w-12 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${alertEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      >
                        <motion.div
                          layout
                          className="w-5 h-5 bg-white rounded-full shadow-md"
                          animate={{ x: alertEnabled ? 24 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>

                    {/* Threshold slider container */}
                    <div className={`p-6 border border-slate-100 rounded-2xl space-y-4 transition-all duration-300
                      ${alertEnabled ? 'opacity-100 scale-100' : 'opacity-40 pointer-events-none scale-[0.98]'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">Warning Threshold Trigger</h4>
                          <p className="text-slate-400 text-xs mt-0.5">We will show alert tags inside pages when spending reaches this percentage.</p>
                        </div>
                        <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-extrabold">
                          {budgetAlertThreshold}%
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-400">50%</span>
                        <input
                          type="range"
                          min="50"
                          max="100"
                          step="5"
                          value={budgetAlertThreshold}
                          onChange={(e) => updateSetting('budgetAlertThreshold', parseInt(e.target.value))}
                          className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <span className="text-xs font-bold text-slate-400">100%</span>
                      </div>

                      {/* Mock Notification Sample */}
                      <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-4 flex gap-3 mt-4 text-xs font-medium text-amber-700">
                        <Info size={16} className="text-amber-500 shrink-0" />
                        <div>
                          <span className="font-bold">Proactive Warning:</span> Spending for "Food" has exceeded {budgetAlertThreshold}% of its assigned monthly budget!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: DATA MANAGEMENT */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Data Storage & Reset</h2>
                    <p className="text-slate-400 text-xs">Full backup, file import, or destructive database commands.</p>
                  </div>

                  {/* Backup / Export / Import row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Export CSV Card */}
                    <div className="border border-slate-100 hover:border-indigo-100 rounded-2xl p-5 text-center flex flex-col justify-between items-center group transition-colors">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                        <Download size={22} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">Export to CSV</h4>
                        <p className="text-slate-400 text-[11px]">Download fully structured spreadsheet-friendly transaction records.</p>
                      </div>
                      <button
                        onClick={handleExportCSV}
                        className="w-full mt-4 py-2 bg-indigo-50/70 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Download CSV
                      </button>
                    </div>

                    {/* Export JSON Card */}
                    <div className="border border-slate-100 hover:border-indigo-100 rounded-2xl p-5 text-center flex flex-col justify-between items-center group transition-colors">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                        <Download size={22} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">Full JSON Backup</h4>
                        <p className="text-slate-400 text-[11px]">Download everything ΓÇö transactions, categories, budgets, and settings.</p>
                      </div>
                      <button
                        onClick={handleExportJSON}
                        className="w-full mt-4 py-2 bg-indigo-50/70 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Download JSON
                      </button>
                    </div>

                    {/* Import JSON Backup */}
                    <div className="border border-slate-100 hover:border-indigo-100 rounded-2xl p-5 text-center flex flex-col justify-between items-center group transition-colors relative">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                        <Upload size={22} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">Restore Backup</h4>
                        <p className="text-slate-400 text-[11px]">Merge transaction records and saved preferences from a JSON backup file.</p>
                      </div>
                      <input
                        type="file"
                        accept=".json"
                        ref={fileInputRef}
                        onChange={handleImportJSON}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full mt-4 py-2 bg-indigo-50/70 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Upload Backup
                      </button>
                    </div>
                  </div>

                  {/* DANGER DESTRUCTIVE ZONE */}
                  <div className="border border-rose-100 bg-rose-50/20 rounded-2xl p-6 mt-8">
                    <h3 className="text-sm font-bold text-rose-600 flex items-center gap-2 mb-1.5">
                      <AlertTriangle size={16} />
                      Destructive Danger Zone
                    </h3>
                    <p className="text-slate-400 text-[11px] mb-5">These actions delete direct records from your SQLite database. This is permanent and irreversible.</p>

                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Clear Transactions */}
                      <button
                        onClick={() => setShowClearTxModal(true)}
                        className="flex-1 px-4 py-3 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                      >
                        Clear All Transactions
                      </button>

                      {/* Clear Budgets */}
                      <button
                        onClick={() => setShowClearBudgetModal(true)}
                        className="flex-1 px-4 py-3 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                      >
                        Clear All Monthly Budgets
                      </button>
                    </div>
                  </div>

                  {/* App Version Info — sourced from electron-updater */}
                  <div className="pt-6 flex justify-between items-center text-[11px] font-semibold text-slate-400">
                    <span>Engine: React 19 + Electron</span>
                    <span>
                      Database: SQLite (offline) v{updateState.info.appVersion || '1.0.0'}
                      {updateState.info.channel && updateState.info.channel !== 'latest' && (
                        <span className="ml-2 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px]">
                          channel: {updateState.info.channel}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 6: UPDATES */}
              {activeTab === 'updates' && (
                <UpdateSettingsSection state={updateState} actions={updateActions} />
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* CONFIRMATION MODAL 1: CLEAR TRANSACTIONS */}
      <AnimatePresence>
        {showClearTxModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearTxModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl z-[10001]"
            >
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Delete All Transactions?</h3>
                <p className="text-slate-400 text-xs mb-6 px-4">This action will delete all transaction records from SQLite. Your current budgets and categories will remain intact.</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowClearTxModal(false)}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearTransactions}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-rose-100"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION MODAL 2: CLEAR BUDGETS */}
      <AnimatePresence>
        {showClearBudgetModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearBudgetModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl z-[10001]"
            >
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Delete All Budgets?</h3>
                <p className="text-slate-400 text-xs mb-6 px-4">This action will delete all active monthly budgets. Your transactions list will remain untouched.</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowClearBudgetModal(false)}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearBudgets}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-rose-100"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Settings;
