// Reports.jsx - Financial Insights & Analytics Dashboard
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTransactions } from '../contexts/TransactionContext.jsx';
import { 
  startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, 
  startOfYear, endOfYear, 
  isWithinInterval, format
} from 'date-fns';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  LineChart, Line, Area, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { TrendingUp, TrendingDown, PieChart as PieIcon, Activity, Plus } from 'lucide-react';
// Shared unified tooltip
import UnifiedTooltip from '../components/ui/UnifiedTooltip.jsx';

// PREMIUM BUTTON IMPORT
import { Button } from "@/components/ui/Button.jsx";

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

  const heatmapData = useMemo(() => {
    const last30Days = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);

      const formatted = format(date, 'yyyy-MM-dd');

      const dayTransactions = transactions.filter(t => {
        return (
          t.type.toLowerCase() === 'expense' &&
          format(new Date(t.date), 'yyyy-MM-dd') === formatted
      );
    });

    const total = dayTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    last30Days.push({
      date,
      formatted,
      total
    });
  }

  return last30Days;
}, [transactions]); // Switched to use full transactions for accurate 30-day lookback

const getHeatIntensity = (amount) => {
  if (amount === 0) return 'bg-slate-100';

  if (amount < 500)
    return 'bg-indigo-400/70 shadow-[0_0_18px_rgba(99,102,241,0.35)]';

  if (amount < 2000)
    return 'bg-violet-500 shadow-[0_0_22px_rgba(139,92,246,0.45)]';

  return 'bg-fuchsia-500 shadow-[0_0_26px_rgba(217,70,239,0.60)]';
};

  if (isLoading) return <div className="p-8 pt-16 text-center text-slate-400 animate-pulse">Analyzing Data...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 pt-12 max-w-7xl mx-auto space-y-8" // pt-12 fixes the top border touching
    >
      {/* HEADER SECTION */}
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 overflow-hidden">
        
        {/* Glow Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-40px] right-[120px] w-40 h-40 bg-indigo-400/30 blur-3xl rounded-full" />
          <div className="absolute top-[20px] right-[40px] w-32 h-32 bg-fuchsia-400/20 blur-3xl rounded-full" />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Financial Reports
          </h1>
        
          <p className="text-slate-500 text-sm">
            Showing activity for the current {timeframe.toLowerCase()}.
          </p>
        </div>
        {/* TIMEFRAME TOGGLE & ACTION BUTTON */}
        <div className="flex items-center gap-4 pr-3">
          <div className="bg-slate-100 p-2 rounded-2xl flex gap-1 shadow-inner border border-slate-200">
            {['Weekly', 'Monthly', 'Yearly'].map(t => (
            <Button
              variant={timeframe === t ? "secondary" : "ghost"}
              size="sm"
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-[17px] py-4 rounded-xl text-xs font-bold transition-all ${
                timeframe === t
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t}
            </Button>
            ))}
          </div>

          {/* <Button
            className="
              h-10
              rounded-3xl
              px-8
              text-white
              font-semibold
              bg-gradient-to-r
              from-indigo-500
              via-violet-500
              to-purple-600
              shadow-[0_10px_28px_rgba(99,102,241,0.35)]
              hover:brightness-220
              hover:scale-[1.02]
              transition-all
              duration-400
              border-0
            "
          >
            <Plus size={18} />
            New Report
          </Button> */}
          <Button
            className="liquid-accent text-white h-10 rounded-2xl px-8 py-5 flex items-center justify-center gap-3 text-sm font-bold"
          >
            <Plus size={18} />
            New Report
          </Button>
          
        </div>
      </div>

      {/* REPORTS INTELLIGENCE HEADER */}
<div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-6">

  {/* PRIMARY INSIGHT PANEL */}
  <div className="surface-prominent p-8 relative overflow-hidden">

    {/* Ambient glow */}
    <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

    <div className="relative z-10">

      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 font-black mb-3">
            Financial Intelligence
          </p>

          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
            ₹{stats.savings.toLocaleString('en-IN')}
          </h2>

          <p className="text-slate-500 mt-3 text-sm max-w-md leading-relaxed">
            {stats.savings >= 0
              ? `You're operating at a positive savings flow this ${timeframe.toLowerCase()}.`
              : `Your expenses exceeded income this ${timeframe.toLowerCase()}.`}
          </p>
        </div>

        <div className={`p-4 rounded-2xl ${
          stats.savings >= 0
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-rose-100 text-rose-600'
        }`}>
          {stats.savings >= 0
            ? <TrendingUp size={28} />
            : <TrendingDown size={28} />}
        </div>
      </div>

      {/* Bottom metrics */}
      <div className="grid grid-cols-2 gap-4">

        <div className="surface-muted p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-black mb-2">
            Income
          </p>

          <p className="text-2xl font-black text-emerald-600 tracking-tight">
            ₹{stats.income.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="surface-muted p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-black mb-2">
            Expenses
          </p>

          <p className="text-2xl font-black text-rose-600 tracking-tight">
            ₹{stats.expenses.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  </div>

  {/* KPI ANALYTICS STACK */}
  <div className="grid grid-cols-1 gap-5">

    <div className="surface-card p-6">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-black mb-3">
        Savings Rate
      </p>

      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-black tracking-tight text-slate-900">
          {stats.income > 0
            ? `${Math.max(0, ((stats.savings / stats.income) * 100)).toFixed(0)}%`
            : '0%'}
        </h3>

        <div className="w-16 h-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
      </div>
    </div>

    <div className="surface-card p-6">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-black mb-3">
        Financial Status
      </p>

      <h3 className={`text-2xl font-black tracking-tight ${
        stats.savings >= 0
          ? 'text-emerald-600'
          : 'text-rose-600'
      }`}>
        {stats.savings >= 0 ? 'Healthy' : 'Overspending'}
      </h3>

      <p className="text-sm text-slate-500 mt-2">
        Based on current {timeframe.toLowerCase()} activity.
      </p>
    </div>
  </div>
</div>

      {/* CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pie Chart: Expenses by Category */}
        
         <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="surface-card p-8"
          >
          <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <PieIcon size={18} className="text-indigo-500" />

                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-black">
                    Spending Analysis
                  </p>
                </div>

                <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-2">
                  Expenses by Category
                </h3>

                <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                  Analyze how your spending distribution shifts across categories during this {timeframe.toLowerCase()} cycle.
                </p>
              </div>

              <div className="surface-muted px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-black mb-1">
                  Categories
                </p>

                <p className="text-xl font-black text-slate-900">
                  {stats.pieData.length}
                </p>
              </div>
            </div>
          <div className="h-[300px]">
            {stats.pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={85}
                    outerRadius={130}
                    paddingAngle={4}
                    dataKey="value"
                    isAnimationActive={true}
                    animationBegin={0}
                    animationDuration={1800}
                    animationEasing="ease-out"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats.pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="rgba(255,255,255,0.75)"
                        strokeWidth={3}
                        style={{
                          filter: "drop-shadow(0 6px 14px rgba(99,102,241,0.10))"
                        }}
                      />
                    ))}
                        
                  </Pie>
                    <text
                      x="50%"
                      y="46%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-slate-400 text-[11px] font-black uppercase tracking-[0.18em]"
                    >
                      Total Spend
                    </text>
                                      
                    <text
                      x="50%"
                      y="56%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-slate-900 text-2xl font-black"
                    >
                      ₹{stats.expenses.toLocaleString('en-IN')}
                    </text>
                  <Tooltip content={<UnifiedTooltip />} cursor={{fill: '#F8FAFC'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyDataState />
            )}
          </div>
        </motion.div>

        {/* Line Chart: Income vs Expenses Trend (Restored your specific request) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="surface-card p-8"
          >
         <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={18} className="text-indigo-500" />

                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-black">
                    Cash Flow Analysis
                  </p>
                </div>

                <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-2">
                  Income vs Expenses Trend
                </h3>

                <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                  Track financial momentum and compare how income and expenses evolve throughout this {timeframe.toLowerCase()} period.
                </p>
              </div>

              <div className="surface-muted px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-black mb-1">
                  Trend Points
                </p>

                <p className="text-xl font-black text-slate-900">
                  {stats.trendData.length}
                </p>
              </div>
            </div>
          <div className="h-[300px]">
            {stats.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stats.trendData}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}  
                >
                   <defs>
                     <linearGradient id="incomeGradientLine" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                       <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                     </linearGradient>
                     <linearGradient id="expenseGradientLine" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor="#ef4444" stopOpacity={0.28} />
                       <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                     </linearGradient>
                     <linearGradient id="incomeStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>

                      <linearGradient id="expenseStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fb7185" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                   </defs>
                   <Area
                      type="monotone"
                      dataKey="income"
                      stroke="none"
                      fill="url(#incomeGradientLine)"
                      tooltipType="none"
                    />

                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="none"
                      fill="url(#expenseGradientLine)"
                      tooltipType="none"
                    />
                  <CartesianGrid strokeDasharray="4 4"
                                vertical={false}
                                stroke="rgba(148,163,184,0.10)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip content={<UnifiedTooltip />} />
                  <Line 
                    type="monotone"
                    dataKey="income"
                    stroke="url(#incomeStroke)"
                    strokeWidth={4}
                    dot={false}
                    activeDot={{
                      r: 7,
                      fill: '#10b981',
                      stroke: '#ffffff',
                      strokeWidth: 3
                    }}
                    style={{
                      filter: 'drop-shadow(0 6px 12px rgba(16,185,129,0.35))'
                    }}
                    animationDuration={2200}
                    animationEasing="ease-out"
                    name="Income"  />
                  <Line 
                  type="monotone"
                  dataKey="expenses"
                  stroke="url(#expenseStroke)"
                  strokeWidth={4}
                  dot={false}
                  activeDot={{
                    r: 7,
                    fill: '#ef4444',
                    stroke: '#ffffff',
                    strokeWidth: 3
                  }}
                  style={{
                    filter: 'drop-shadow(0 6px 12px rgba(239,68,68,0.30))'
                  }}
                  animationDuration={2200}
                  animationEasing="ease-out"
                  name="Expenses"/>
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyDataState />
            )}
          </div>
        
        </motion.div>
      </div>

      {/* NEW: GITHUB STYLE 30-DAY HEATMAP RENDER */}
      <div className="surface-card p-6 mt-8 mb-6 border border-slate-100 rounded-3xl shadow-sm bg-white">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-black mb-4">30-Day Spending Intensity</h3>
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {heatmapData.map((day, i) => (
            <div 
              key={i} 
              className={`w-6 h-6 rounded-md shrink-0 transition-all duration-300 hover:scale-110 cursor-help ${getHeatIntensity(day.total)}`} 
              title={`${day.formatted}: Spent ₹${day.total.toLocaleString('en-IN')}`} 
            />
          ))}
        </div>
      </div>

      <div className="surface-prominent p-5 flex flex-wrap items-center gap-3 text-sm">

        <span className="text-slate-400 font-semibold uppercase tracking-[0.16em] text-[10px]">
          Insights
        </span>
                
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-semibold">
          Highest spend in {stats.pieData[0]?.name || 'N/A'}
        </div>
                
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-semibold">
          Savings ₹{stats.savings.toLocaleString('en-IN')}
        </div>
                
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 font-semibold">
          Expenses ₹{stats.expenses.toLocaleString('en-IN')}
        </div>
      </div>

      {/* DETAILED TRANSACTION LIST (Restored from your old code, styled modern) */}
<div className="divide-y divide-slate-100">

  {filteredData.map((t, index) => (

    <motion.div
      key={t.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.02 }}
      className="flex items-center justify-between py-4 px-2 rounded-xl hover:bg-slate-50/70 transition-colors duration-200"
    >

      {/* LEFT */}
      <div className="flex items-center gap-3 min-w-0">

        <div
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            t.type.toLowerCase() === 'income'
              ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.45)]'
              : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.35)]'
          }`}
        />

        <div className="min-w-0">

          <h4 className="text-sm font-semibold text-slate-900 truncate">
            {t.title}
          </h4>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">

            <span>
              {format(new Date(t.date), 'MMM dd, yyyy')}
            </span>

            <span>•</span>

            <span>{t.category}</span>

          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div
        className={`text-sm font-bold tracking-tight ${
          t.type.toLowerCase() === 'income'
            ? 'text-emerald-600'
            : 'text-slate-900'
        }`}
      >
        {t.type.toLowerCase() === 'income' ? '+' : '-'}
        ₹{Number(t.amount).toLocaleString('en-IN')}
      </div>

    </motion.div>

  ))}

</div>
    </motion.div>
  );
};

// Sub-components
const StatCard = ({ title, value, color, icon, isSavings }) => (
  <div className="surface-card p-6 relative overflow-hidden group">
    
    {/* Ambient glow */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
    </div>

    <div className="relative z-10">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
          {title}
        </span>

        <div className={`${color} opacity-90`}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end justify-between">
        
        <p
          className={`text-3xl md:text-[2rem] leading-none font-black tracking-tight ${
            isSavings && value < 0 ? 'text-rose-600' : color
          }`}
        >
          ₹{value.toLocaleString('en-IN')}
        </p>

        {/* Tiny trend accent */}
        <div className="w-12 h-[2px] rounded-full bg-gradient-to-r from-indigo-500/40 to-transparent" />
      </div>
    </div>
  </div>
);

const EmptyDataState = () => (
  <div className="h-full flex flex-col items-center justify-center text-slate-400">
    <PieIcon size={48} className="mb-2 opacity-20" />
    <p className="text-sm font-medium italic">No data available.</p>
  </div>
);

export default Reports;