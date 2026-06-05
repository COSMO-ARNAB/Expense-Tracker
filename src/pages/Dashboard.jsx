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
import UnifiedTooltip from '../components/ui/UnifiedTooltip.jsx';
import { format } from 'date-fns';
import { useTransactions } from '../contexts/TransactionContext.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';


// -----------------------------------------------------------
// const Dashboard = () => {  <--- This is where your component starts

const Dashboard = () => {
  const { transactions, isLoading } = useTransactions();
  const { formatCurrency, formatDate, cx } = useSettings();

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
      className={cx("min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans", "min-h-screen bg-slate-50 text-slate-900 pb-8 font-sans")}
    >
      <div className={cx("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", "max-w-7xl mx-auto px-4 sm:px-5")}>
        
        {/* 1. TOPBAR */}
        <header className={cx("py-8 flex justify-between items-center", "py-5.5 flex justify-between items-center")}>
          <h1 className="text-xl font-semibold tracking-tight text-slate-800">Overview</h1>
          <div className="text-sm font-medium text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            {format(new Date(), 'MMMM yyyy')}
          </div>
        </header>

        <div className={cx("space-y-8", "space-y-6")}>
          
          {/* 2. HERO SECTION */}
          <section className={cx("surface-prominent p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8", "surface-prominent p-6 md:p-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-5")}>
            <div>
              <p className={cx("text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2", "text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5")}>Total Balance</p>
              <h2 className={cx("text-5xl md:text-6xl font-black tracking-tight text-slate-900 tracking-tight", "text-4xl md:text-5xl font-black tracking-tight text-slate-900")}>
                {formatCurrency(balance)}
              </h2>
            </div>
            
            {/* Quick Insights Row (Inside Hero) */}
<div className={cx("flex flex-col sm:flex-row gap-4 w-full md:w-auto", "flex flex-col sm:flex-row gap-3 w-full md:w-auto")}>
  <motion.div 
    className={cx("surface-muted px-6 py-5 min-w-[160px] cursor-pointer", "surface-muted px-5 py-3.5 min-w-[140px] cursor-pointer")}
  >
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Income</p>
    <p className={cx("text-2xl font-bold text-emerald-600", "text-xl font-bold text-emerald-600")}>{formatCurrency(totalIncome)}</p>
  </motion.div>
  
  <motion.div 
    className={cx("surface-muted px-6 py-5 min-w-[160px] cursor-pointer", "surface-muted px-5 py-3.5 min-w-[140px] cursor-pointer")}
  >
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Expenses</p>
    <p className={cx("text-2xl font-bold text-rose-500", "text-xl font-bold text-rose-500")}>{formatCurrency(totalExpenses)}</p>
  </motion.div>
  
  <motion.div 
    className={cx("surface-muted px-6 py-5 min-w-[160px] hidden lg:block cursor-pointer", "surface-muted px-5 py-3.5 min-w-[140px] hidden lg:block cursor-pointer")}
  >
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Top Expense</p>
    <p className={cx("text-2xl font-bold text-slate-800", "text-xl font-bold text-slate-800")}>{topCategory.name}</p>
  </motion.div>
</div>
          </section>

          {/* 3. ANALYTICS & FEED (12-Column Grid) */}
          <section className={cx("grid grid-cols-1 xl:grid-cols-12 gap-8", "grid grid-cols-1 xl:grid-cols-12 gap-5.5")}>
            
            {/* LEFT COLUMN: Charts (8 cols) */}
            <div className={cx("xl:col-span-8 space-y-8", "xl:col-span-8 space-y-6")}>
              
              {/* Main Spending Chart */}
              <div className={cx("surface-prominent p-8", "surface-prominent p-5")}>
                <h3 className={cx("text-xs font-semibold text-slate-400 uppercase tracking-[0.18em] mb-6", "text-xs font-semibold text-slate-400 uppercase tracking-[0.18em] mb-4")}>Cash Flow Trend</h3>
                <div className={cx("h-[300px] w-full", "h-[230px] w-full")}>
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
                        content={<UnifiedTooltip />} cursor={{fill: '#F8FAFC'}} />
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
              <div className={cx("surface-prominent p-8 flex flex-col md:flex-row items-center gap-8", "surface-prominent p-5 flex flex-col md:flex-row items-center gap-5")}>
                <div className="w-full md:w-1/2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.18em] mb-2">Spending by Category</h3>
                  <p className={cx("text-slate-400 text-sm mb-6", "text-slate-400 text-xs mb-4")}>Your highest expenses this period.</p>
                  <div className={cx("space-y-3", "space-y-2")}>
                    {categoryData.slice(0, 4).map((cat, index) => (
                      <div key={cat.name} className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2 text-slate-700">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          {cat.name}
                        </span>
                        <span className="font-semibold text-slate-900">{formatCurrency(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={cx("w-full md:w-1/2 h-[200px]", "w-full md:w-1/2 h-[160px]")}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<UnifiedTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Activity Feed (4 cols) */}
            <div className={cx("xl:col-span-4 space-y-6", "xl:col-span-4 space-y-4")}>
              <div className="flex justify-between items-end px-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.18em]">Recent Activity</h3>
              </div>
              
              <div className={cx("surface-prominent p-2", "surface-prominent p-1.5")}>
                {recentTransactions.length > 0 ? (
                  <div className="flex flex-col">
                    {recentTransactions.map((t, index) => {
                      const isIncome = t.type?.toLowerCase() === 'income';
                      return (
                        <div 
                          key={t.id} 
                          className={cx(
                            `flex items-center justify-between p-4 rounded-2xl transition-colors hover:bg-slate-50/80/ ${index !== recentTransactions.length - 1 ? 'border-b border-slate-50' : ''}`,
                            `flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-slate-50/80/ ${index !== recentTransactions.length - 1 ? 'border-b border-slate-100/50' : ''}`
                          )}
                        >
                          <div className={cx("flex items-center gap-4", "flex items-center gap-3.5")}>
                            {/* Smart Initial Avatar */}
                            <div className={cx(
                              `w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`,
                              `w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`
                            )}>
                              {t.category ? t.category.charAt(0).toUpperCase() : '?'}
                            </div>
                            
                            <div>
                              <p className={cx("font-bold text-slate-800 text-sm md:text-base", "font-bold text-slate-800 text-sm")}>{t.title}</p>
                              <p className={cx("text-xs font-medium text-slate-400 mt-0.5", "text-xs font-medium text-slate-400 mt-0.5")}>
                                {t.category} <span className="mx-1">•</span> {formatDate(t.date)}
                              </p>
                            </div>
                          </div>
                          
                          <div className={`font-bold text-right ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
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