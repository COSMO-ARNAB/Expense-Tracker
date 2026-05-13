import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTransactions } from '../contexts/TransactionContext.jsx';
import { 
  startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, 
  startOfYear, endOfYear, 
  isWithinInterval, format, parseISO
} from 'date-fns';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  LineChart, Line, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { TrendingUp, TrendingDown, PieChart as PieIcon, Activity } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const Reports = () => {
  const { transactions, isLoading } = useTransactions();
  const [timeframe, setTimeframe] = useState('Monthly'); // Weekly, Monthly, Yearly

  // 1. STRICT DATE FILTERING (Fixes the 2023 "Ghost Data" bug)
  const filteredData = useMemo(() => {
    const now = new Date(); // Evaluates to Current Date (e.g., May 2026)
    let interval;

    if (timeframe === 'Weekly') {
      interval = { start: startOfWeek(now), end: endOfWeek(now) };
    } else if (timeframe === 'Monthly') {
      interval = { start: startOfMonth(now), end: endOfMonth(now) };
    } else {
      interval = { start: startOfYear(now), end: endOfYear(now) };
    }

    return transactions.filter(t => isWithinInterval(new Date(t.date), interval))
                       .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
  }, [transactions, timeframe]);

  // 2. AGGREGATE DATA (Cards & Charts)
  const stats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    const categoryMap = {};
    const trendMap = {};

    filteredData.forEach(t => {
      const amount = Number(t.amount);
      const isExpense = t.type.toLowerCase() === 'expense';
      
      // Totals
      if (isExpense) expenses += amount;
      else income += amount;

      // Pie Chart (Category Breakdown)
      if (isExpense) {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + amount;
      }

      // Line Chart (Trend Analysis)
      // If Yearly -> group by Month (Jan). If Monthly/Weekly -> group by Date (May 14)
      const dateKey = timeframe === 'Yearly' 
        ? format(new Date(t.date), 'MMM') 
        : format(new Date(t.date), 'MMM dd');
      
      if (!trendMap[dateKey]) trendMap[dateKey] = { date: dateKey, income: 0, expenses: 0 };
      
      if (isExpense) trendMap[dateKey].expenses += amount;
      else trendMap[dateKey].income += amount;
    });

    // Formatting for Recharts
    const pieData = Object.keys(categoryMap).map(name => ({ name, value: categoryMap[name] }));
    const trendData = Object.values(trendMap).reverse(); // Oldest to Newest for the line chart X-Axis

    return { income, expenses, savings: income - expenses, pieData, trendData };
  }, [filteredData, timeframe]);

  if (isLoading) return <div className="p-8 pt-16 text-center text-slate-400 animate-pulse">Analyzing Data...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 pt-12 max-w-7xl mx-auto space-y-8" // pt-12 fixes the top border touching
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Reports</h1>
          <p className="text-slate-500 text-sm">Showing activity for the current {timeframe.toLowerCase()}.</p>
        </div>

        {/* TIMEFRAME TOGGLE */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 shadow-inner border border-slate-200">
          {['Weekly', 'Monthly', 'Yearly'].map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                timeframe === t 
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* SUMMARY CARDS (Your Original Logic) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Income" value={stats.income} color="text-emerald-600" icon={<TrendingUp size={16}/>} />
        <StatCard title="Total Expenses" value={stats.expenses} color="text-rose-600" icon={<TrendingDown size={16}/>} />
        <StatCard title="Net Savings" value={stats.savings} color="text-slate-900" isSavings />
      </div>

      {/* CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pie Chart: Expenses by Category */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 text-lg flex items-center gap-2">
            <PieIcon size={20} className="text-indigo-500" /> Expenses by Category
          </h3>
          <div className="h-[300px]">
            {stats.pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats.pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyDataState />
            )}
          </div>
        </div>

        {/* Line Chart: Income vs Expenses Trend (Restored your specific request) */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 text-lg flex items-center gap-2">
            <Activity size={20} className="text-indigo-500" /> Income vs Expenses Trend
          </h3>
          <div className="h-[300px]">
            {stats.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{r:4, fill:'#10b981', strokeWidth:0}} activeDot={{r:6}} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={{r:4, fill:'#ef4444', strokeWidth:0}} activeDot={{r:6}} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyDataState />
            )}
          </div>
        </div>
      </div>

      {/* DETAILED TRANSACTION LIST (Restored from your old code, styled modern) */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <h3 className="font-bold text-slate-800 mb-6 text-lg">Transaction History</h3>
        {filteredData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-4 font-bold">Date</th>
                  <th className="pb-4 font-bold">Description</th>
                  <th className="pb-4 font-bold">Category</th>
                  <th className="pb-4 font-bold">Type</th>
                  <th className="pb-4 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 text-sm text-slate-500">{format(new Date(t.date), 'MMM dd, yyyy')}</td>
                    <td className="py-4 text-sm font-bold text-slate-900">{t.title}</td>
                    <td className="py-4 text-sm text-slate-500">{t.category}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                        ${t.type.toLowerCase() === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`py-4 text-sm font-bold text-right ${t.type.toLowerCase() === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {t.type.toLowerCase() === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">No transactions to display for this period.</div>
        )}
      </div>
    </motion.div>
  );
};

// Sub-components
const StatCard = ({ title, value, color, icon, isSavings }) => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</span>
      <span className={color}>{icon}</span>
    </div>
    <p className={`text-3xl font-black ${isSavings && value < 0 ? 'text-rose-600' : color}`}>
      ₹{value.toLocaleString('en-IN')}
    </p>
  </div>
);

const EmptyDataState = () => (
  <div className="h-full flex flex-col items-center justify-center text-slate-400">
    <PieIcon size={48} className="mb-2 opacity-20" />
    <p className="text-sm font-medium italic">No data available.</p>
  </div>
);

export default Reports;