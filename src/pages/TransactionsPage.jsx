import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Trash2, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { useTransactions } from '../contexts/TransactionContext.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';

// Keeping your original prebuilt categories here for the filter dropdown
const PREBUILT_CATEGORIES = {
  Expense: ["Food", "Transport", "Bills", "Entertainment", "Shopping", "Health", "Education", "Others"],
  Income: ["Salary", "Bonus", "Allowance", "Freelance", "Investment", "Other"]
};

const TransactionsPage = () => {
  const { transactions, deleteTransaction, customCategories, isLoading } = useTransactions();
  const { formatCurrency, formatDate } = useSettings();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Build the list of all possible categories for the filter dropdown based on your logic
  const allCategories = useMemo(() => {
    const defaultCats = [...PREBUILT_CATEGORIES.Expense, ...PREBUILT_CATEGORIES.Income];
    const customCats = customCategories ? customCategories.map(c => c.name) : [];
    return ['All', ...new Set([...defaultCats, ...customCats])];
  }, [customCategories]);

  // Smart Filtering Logic
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
        const matchesType = filterType === 'All' || t.type?.toLowerCase() === filterType.toLowerCase();
        return matchesSearch && matchesCategory && matchesType;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, searchTerm, filterCategory, filterType]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-slate-400 font-medium animate-pulse">Loading Transactions...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-8 max-w-7xl mx-auto"
    >
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Transactions</h1>
          <p className="text-slate-500 text-sm">View, search, and manage your financial history.</p>
        </div>
      </div>

      {/* SEARCH & FILTERS ROW */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search titles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
          />
        </div>

        <div className="flex gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Filter size={18} className="text-slate-400" />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer text-slate-700 font-medium"
            >
              <option value="All">All Types</option>
              <option value="Expense">Expenses</option>
              <option value="Income">Income</option>
            </select>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer text-slate-700 font-medium"
          >
            {allCategories.map(cat => <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>)}
          </select>
        </div>
      </div>

      {/* TRANSACTIONS LIST */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {filteredTransactions.map((t) => {
              const isIncome = t.type?.toLowerCase() === 'income';
              return (
                <motion.div 
                  key={t.id}
                  layout 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner
                      ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {isIncome ? <ArrowDownRight size={20} strokeWidth={3} /> : <ArrowUpRight size={20} strokeWidth={3} />}
                    </div>
                    
                    <div>
                      <p className="font-bold text-slate-900 text-base">{t.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                          {t.category}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {formatDate(t.date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <p className={`font-bold text-lg ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                    
                    <button 
                      onClick={() => deleteTransaction(t.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Delete transaction"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Search size={24} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No transactions found</h3>
            <p className="text-slate-400 text-sm">Try adjusting your filters or add a new entry.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TransactionsPage;