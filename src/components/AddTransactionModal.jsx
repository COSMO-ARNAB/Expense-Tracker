import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react'; // Added Trash2 icon
import { useTransactions } from '../contexts/TransactionContext.jsx';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PREBUILT_CATEGORIES = {
  Expense: ["Food", "Transport", "Bills", "Entertainment", "Shopping", "Health", "Education", "Others"],
  Income: ["Salary", "Bonus", "Allowance", "Freelance", "Investment", "Other"]
};

const AddTransactionModal = ({ isOpen, onClose }) => {
  // Added removeCustomCategory here!
  const { addTransaction, customCategories, saveCustomCategory, removeCustomCategory } = useTransactions(); 

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'Expense',
    category: 'Food',
date: new Date().toISOString().split('T')[0] 
  });

  const [customName, setCustomName] = useState("");
  const [shouldSave, setShouldSave] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableCategories = [
    ...(PREBUILT_CATEGORIES[formData.type] || []),
    ...(customCategories ? customCategories.filter(c => c.type === formData.type).map(c => c.name) : []),
    "Custom"
  ];

  // Check if the currently selected category is a custom one saved in the DB
  const activeCustomCategory = customCategories?.find(
    c => c.name === formData.category && c.type === formData.type
  );

  const handleDeleteCustomCategory = async () => {
    if (activeCustomCategory) {
      await removeCustomCategory(activeCustomCategory.id);
      // Immediately reset the dropdown to the first default category so it doesn't break
      setFormData(prev => ({ ...prev, category: PREBUILT_CATEGORIES[prev.type][0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.category) return;

    setIsSubmitting(true);

    try {
      let finalCategory = formData.category;
      
      if (formData.category === "Custom") {
        finalCategory = customName;
        if (shouldSave) {
          await saveCustomCategory({
            id: Date.now().toString(),
            name: customName,
            type: formData.type
          });
        }
      }

      const newTransaction = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        title: formData.title,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: finalCategory,
        date: formData.date,
      };

      await addTransaction(newTransaction);
      
      setFormData({ title: '', amount: '', type: 'Expense', category: 'Food',
date: new Date().toISOString().split('T')[0] });
      setCustomName("");
      setShouldSave(false);
      // onClose(); // keep modal open for consecutive entries
    } catch (error) {
      console.error("Failed to add transaction", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'type') {
      setFormData(prev => ({ ...prev, [name]: value, category: PREBUILT_CATEGORIES[value][0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 400 } }}
            exit={{ opacity: 0, scale: 0.95, y: 30, transition: { duration: 0.4, ease: "easeInOut" } }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl z-[70] overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">New Transaction</h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Description</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Starbucks Coffee" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Amount (₹)</label>
                  <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="0.00" step="0.01" min="0" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Type</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer">
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                  </select>
                </div>
              </div>

              <div>
                <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Date
                </label>
                    
                <DatePicker
                  selected={new Date(formData.date)}
                  onChange={(date) => {
                    if (!date) return;
                  
                    setFormData(prev => ({
                      ...prev,
                      date: date.toISOString().split('T')[0]
                    }));
                  }}
                  dateFormat="dd MMM yyyy"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-700"
                  calendarClassName="rounded-2xl border border-slate-200 shadow-2xl"
                  popperClassName="z-[9999]"
                />
              </div>
                    
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Category
                  </label>
                    
                  {activeCustomCategory && (
                    <button
                      type="button"
                      onClick={handleDeleteCustomCategory}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 uppercase tracking-wider"
                    >
                      <Trash2 size={12} /> Delete Category
                    </button>
                  )}
                </div>
                
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              </div>

              {formData.category === "Custom" && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                  <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full p-3 bg-white border border-indigo-200 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter custom category name" required />
                  <label className="flex items-center text-sm text-indigo-900 font-medium cursor-pointer">
                    <input type="checkbox" checked={shouldSave} onChange={(e) => setShouldSave(e.target.checked)} className="mr-3 w-4 h-4 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500" />
                    Save this category for future use
                  </label>
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className={`w-full py-4 mt-2 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-95'}`}>
                {isSubmitting ? 'Saving...' : 'Save Transaction'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddTransactionModal;