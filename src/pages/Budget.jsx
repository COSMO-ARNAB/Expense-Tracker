import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Plus, Trash2, Wallet, 
  BarChart3, PieChart as PieIcon, Calendar 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { useTransactions } from '../contexts/TransactionContext.jsx';

const PREBUILT_CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Others"];

// 1. HIGH-CONTRAST COLOR PALETTE (Visibility optimized)
const COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Rose
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#3b82f6'  // Blue
];

const getMonthBoundaries = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  return { firstDay, lastDay };
};

const boundaries = getMonthBoundaries();

const Budget = () => {
  const { budgets, transactions, addBudget, updateBudget, deleteBudget, customCategories, isLoading } = useTransactions();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    category: 'Food', 
    amount: '', 
    startDate: boundaries.firstDay,
    endDate: boundaries.lastDay
  });

  const budgetStats = useMemo(() => {
    return budgets.map(budget => {
      const start = budget.startDate ? new Date(budget.startDate) : new Date(boundaries.firstDay);
      const end = budget.endDate ? new Date(budget.endDate) : new Date(boundaries.lastDay);

      const spent = transactions
        .filter(t => {
          const txDate = new Date(t.date);
          const isCategoryMatch = t.category === budget.category;
          const isExpense = t.type?.toLowerCase() === 'expense'; 
          return isCategoryMatch && isExpense && txDate >= start && txDate <= end;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const percentage = Math.min((spent / budget.amount) * 100, 100);
      return { ...budget, spent, percentage };
    });
  }, [budgets, transactions]);

  const chartData = useMemo(() => budgetStats.map(b => ({
    name: b.category,
    budget: b.amount,
    spent: b.spent
  })), [budgetStats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;

    const amountToAdd = parseFloat(formData.amount);
    const existingBudget = budgets.find(
      (b) => b.category.toLowerCase() === formData.category.toLowerCase()
    );

    if (existingBudget) {
      const updatedBudget = {
        ...existingBudget,
        amount: Number(existingBudget.amount) + amountToAdd,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };
      await updateBudget(existingBudget.id, updatedBudget);
    } else {
      await addBudget({
        id: Date.now().toString(),
        ...formData,
        amount: amountToAdd,
      });
    }

    setFormData({ category: 'Food', amount: '', startDate: boundaries.firstDay, endDate: boundaries.lastDay });
    setShowForm(false);
  };

  const getStatusStyles = (pct) => {
    if (pct >= 100) return { bg: 'bg-rose-100', text: 'text-rose-700', bar: 'bg-rose-500', label: 'Exceeded' };
    if (pct >= 85) return { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500', label: 'Danger Zone' };
    return { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500', label: 'On Track' };
  };

  if (isLoading) return <div className="p-8 text-center text-slate-400 animate-pulse">Loading Budgets...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* HEADER WITH GLOWING MIXED GRADIENT BUTTON */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Budgeting</h1>
          <p className="text-slate-500 text-sm mt-1">Plan your limits and track distribution.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(99, 102, 241, 0.5)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-800 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 border border-indigo-400/20"
        >
          {showForm ? 'Cancel' : <><Plus size={18} /> Add Budget</>}
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {[...PREBUILT_CATEGORIES, ...customCategories.map(c => c.name)].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Amount (₹)</label>
                <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0.00" required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Start Date</label>
                <input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">End Date</label>
                <input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" required 
                />
              </div>
              <div className="md:col-span-4">
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition">Save Budget Target</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart3 size={20} className="text-indigo-500" /> Budget vs Spent</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="barSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="barBudget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#cbd5e1" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="budget" fill="url(#barBudget)" radius={[6, 6, 0, 0]} name="Budget" />
              <Bar dataKey="spent" fill="url(#barSpent)" radius={[6, 6, 0, 0]} name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><PieIcon size={20} className="text-indigo-500" /> Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <defs>
                {COLORS.map((color, i) => (
                  <linearGradient key={`grad-${i}`} id={`pieGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={1}/>
                    <stop offset="100%" stopColor={color} stopOpacity={0.8}/>
                  </linearGradient>
                ))}
              </defs>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="budget" stroke="none">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#pieGrad-${index % COLORS.length})`} />
                ))}
              </Pie>
              <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {budgetStats.map((budget) => {
          const styles = getStatusStyles(budget.percentage);
          return (
            <motion.div key={budget.id} layout className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group relative">
              <button onClick={() => deleteBudget(budget.id)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={16} />
              </button>
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600"><Wallet size={20} /></div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${styles.bg} ${styles.text}`}>
                  {styles.label}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg">{budget.category}</h3>
              <div className="flex items-center gap-1 text-slate-400 text-xs mb-4">
                 <Calendar size={12} /> {budget.startDate && budget.endDate ? `${budget.startDate} to ${budget.endDate}` : "Current Month"}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-900">₹{budget.spent.toLocaleString()}</span>
                  <span className="text-slate-400">of ₹{budget.amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${budget.percentage}%` }} className={`h-full rounded-full ${styles.bar}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Budget;