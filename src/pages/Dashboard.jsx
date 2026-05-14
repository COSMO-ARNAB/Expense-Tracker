import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';
import { useTransactions } from '../contexts/TransactionContext.jsx';


// Custom Tooltip for the Bar Chart
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 p-4 rounded-2xl shadow-xl border border-slate-800 min-w-[160px] z-50">
        <p className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-3">{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-6 text-sm">
              <span className="flex items-center gap-2 text-slate-300">
                <span 
                   className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        entry.name === 'Income' ? '#34D399' : '#FB7185',
                    
                      boxShadow:
                        entry.name === 'Income'
                          ? '0 0 8px rgba(52, 211, 153, 0.45)'
                          : '0 0 8px rgba(251, 113, 133, 0.45)'
                    }}
                ></span>
                {entry.name}
              </span>
              <span className="font-bold text-white">
                ₹{entry.value.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for the Pie Chart
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 px-4 py-3 rounded-xl shadow-xl border border-slate-800 flex items-center gap-3 text-sm z-50">
        <span 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: payload[0].payload.fill }}
        ></span>
        <span className="text-slate-300">{payload[0].name}</span>
        <span className="font-bold text-white ml-2">
          ₹{payload[0].value.toLocaleString('en-IN')}
        </span>
      </div>
    );
  }
  return null;
};


// -----------------------------------------------------------
// const Dashboard = () => {  <--- This is where your component starts

const Dashboard = () => {
  const { transactions, isLoading } = useTransactions();

  // ==========================================
  // DATA LOGIC (Kept exactly as you wrote it)
  // ==========================================
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <p className="text-lg font-medium animate-pulse">Syncing your finances...</p>
      </div>
    );
  }

  const totalIncome = useMemo(() => {
    return transactions.filter(t => t.type?.toLowerCase() === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions.filter(t => t.type?.toLowerCase() === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const balance = useMemo(() => {
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses]);

  const chartData = useMemo(() => {
    const monthlyMap = {};
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          monthKey,
          timestamp: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
          name: format(date, 'MMM yyyy'),
          expense: 0,
          income: 0
        };
      }
      if (t.type?.toLowerCase() === 'expense') monthlyMap[monthKey].expense += t.amount;
      else if (t.type?.toLowerCase() === 'income') monthlyMap[monthKey].income += t.amount;
    });
    const sortedData = Object.values(monthlyMap).sort((a, b) => a.timestamp - b.timestamp).slice(-6);
    return sortedData.length > 0 ? sortedData : [{ name: 'No Data', expense: 0, income: 0 }];
  }, [transactions]);

  const categoryData = useMemo(() => {
    const categoryMap = {};
    transactions.filter(t => t.type?.toLowerCase() === 'expense').forEach(t => {
      if (!categoryMap[t.category]) categoryMap[t.category] = 0;
      categoryMap[t.category] += t.amount;
    });
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  // ... existing categoryData logic ...

  // --- PASTE THIS RIGHT BELOW categoryData ---
  const topCategory = useMemo(() => {
    if (categoryData.length === 0) return { name: 'None', value: 0 };
    return categoryData.reduce((prev, current) => (prev.value > current.value) ? prev : current);
  }, [categoryData]);
  // -------------------------------------------

  // const recentTransactions = useMemo(() => { ... })  <--- This is where your recentTransactions logic starts
  const recentTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  }, [transactions]);

  // Premium Muted Chart Colors
  const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6', '#10B981', '#F43F5E'];

  // ==========================================
  // PREMIUM UI RENDER
  // ==========================================

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 1. TOPBAR */}
        <header className="py-8 flex justify-between items-center">
          <h1 className="text-xl font-semibold tracking-tight text-slate-800">Overview</h1>
          <div className="text-sm font-medium text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            {format(new Date(), 'MMMM yyyy')}
          </div>
        </header>

        <div className="space-y-8">
          
          {/* 2. HERO SECTION */}
          <section className="surface-prominent p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Total Balance</p>
              <h2 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 tracking-tight">
                ₹{balance.toLocaleString('en-IN')}
              </h2>
            </div>
            
            {/* Quick Insights Row (Inside Hero) */}
<div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
  <motion.div 
    className="surface-muted px-6 py-5 min-w-[160px] cursor-pointer"
  >
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Income</p>
    <p className="text-2xl font-bold text-emerald-600">₹{totalIncome.toLocaleString('en-IN')}</p>
  </motion.div>
  
  <motion.div 
    className="surface-muted px-6 py-5 min-w-[160px] cursor-pointer"
  >
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Expenses</p>
    <p className="text-2xl font-bold text-rose-500">₹{totalExpenses.toLocaleString('en-IN')}</p>
  </motion.div>
  
  <motion.div 
    className="surface-muted px-6 py-5 min-w-[160px] hidden lg:block cursor-pointer"
  >
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Top Expense</p>
    <p className="text-2xl font-bold text-slate-800">{topCategory.name}</p>
  </motion.div>
</div>
          </section>

          {/* 3. ANALYTICS & FEED (12-Column Grid) */}
          <section className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Charts (8 cols) */}
            <div className="xl:col-span-8 space-y-8">
              
              {/* Main Spending Chart */}
              <div className="surface-prominent p-8">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.18em] mb-6">Cash Flow Trend</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#34D399" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.78} />
                          </linearGradient>

                          <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FB7185" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="#E11D48" stopOpacity={0.78} />
                          </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3"
                                      vertical={false}
                                      stroke="rgba(148, 163, 184, 0.12)"/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                      <Tooltip 
                        content={<CustomBarTooltip />} cursor={{fill: '#F8FAFC'}} />
                      <Bar dataKey="income"
                          fill="url(#incomeGradient)"
                          name="Income"
                          radius={[10, 10, 0, 0]}
                          maxBarSize={34} />
                      <Bar  dataKey="expense"
                          fill="url(#expenseGradient)"
                          name="Expenses"
                          radius={[10, 10, 0, 0]}
                          maxBarSize={34}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Secondary Chart: Category Split */}
              <div className="surface-prominent p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-1/2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.18em] mb-2">Spending by Category</h3>
                  <p className="text-slate-400 text-sm mb-6">Your highest expenses this period.</p>
                  <div className="space-y-3">
                    {categoryData.slice(0, 4).map((cat, index) => (
                      <div key={cat.name} className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2 text-slate-700">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          {cat.name}
                        </span>
                        <span className="font-semibold text-slate-900">₹{cat.value.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-full md:w-1/2 h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Activity Feed (4 cols) */}
            <div className="xl:col-span-4 space-y-6">
              <div className="flex justify-between items-end px-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.18em]">Recent Activity</h3>
              </div>
              
              <div className="surface-prominent p-2">
                {recentTransactions.length > 0 ? (
                  <div className="flex flex-col">
                    {recentTransactions.map((t, index) => {
                      const isIncome = t.type?.toLowerCase() === 'income';
                      return (
                        <div 
                          key={t.id} 
                          className={`flex items-center justify-between p-4 rounded-2xl transition-colors hover:bg-slate-50/80/ ${index !== recentTransactions.length - 1 ? 'border-b border-slate-50' : ''}`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Smart Initial Avatar */}
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold
                              ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}
                            >
                              {t.category ? t.category.charAt(0).toUpperCase() : '?'}
                            </div>
                            
                            <div>
                              <p className="font-bold text-slate-800 text-sm md:text-base">{t.title}</p>
                              <p className="text-xs font-medium text-slate-400 mt-0.5">
                                {t.category} <span className="mx-1">•</span> {format(new Date(t.date), 'MMM dd')}
                              </p>
                            </div>
                          </div>
                          
                          <div className={`font-bold text-right ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {isIncome ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No recent activity.
                  </div>
                )}
              </div>
            </div>

          </section>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;