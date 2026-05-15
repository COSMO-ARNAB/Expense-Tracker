
import React, { useState, useMemo } from 'react';
import { useTransactions } from '../contexts/TransactionContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  format
} from 'date-fns';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';

const COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316'
];

const Reports = () => {
  const { transactions, isLoading } = useTransactions();
  const [timeframe, setTimeframe] = useState('Monthly');

  const filteredData = useMemo(() => {
    const now = new Date();
    let interval;

    if (timeframe === 'Weekly') {
      interval = {
        start: startOfWeek(now),
        end: endOfWeek(now)
      };
    } else if (timeframe === 'Monthly') {
      interval = {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    } else {
      interval = {
        start: startOfYear(now),
        end: endOfYear(now)
      };
    }

    return transactions
      .filter(t => isWithinInterval(new Date(t.date), interval))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, timeframe]);

  const stats = useMemo(() => {
    let income = 0;
    let expenses = 0;

    const categoryMap = {};
    const trendMap = {};

    filteredData.forEach(t => {
      const amount = Number(t.amount);
      const isExpense = t.type.toLowerCase() === 'expense';

      if (isExpense) {
        expenses += amount;
      } else {
        income += amount;
      }

      if (isExpense) {
        categoryMap[t.category] =
          (categoryMap[t.category] || 0) + amount;
      }

      const dateKey =
        timeframe === 'Yearly'
          ? format(new Date(t.date), 'MMM')
          : format(new Date(t.date), 'MMM dd');

      if (!trendMap[dateKey]) {
        trendMap[dateKey] = {
          date: dateKey,
          income: 0,
          expenses: 0
        };
      }

      if (isExpense) {
        trendMap[dateKey].expenses += amount;
      } else {
        trendMap[dateKey].income += amount;
      }
    });

    return {
      income,
      expenses,
      savings: income - expenses,
      pieData: Object.keys(categoryMap).map(name => ({
        name,
        value: categoryMap[name]
      })),
      trendData: Object.values(trendMap).reverse()
    };
  }, [filteredData, timeframe]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse">
        Loading Reports...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 pt-12 max-w-7xl mx-auto space-y-8"
    >

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Financial Reports
          </h1>

          <p className="text-slate-500 text-sm mt-2">
            Showing activity for the current {timeframe.toLowerCase()}.
          </p>
        </div>

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

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-6">

        <motion.div
          whileHover={{
            y: -2,
            boxShadow: '0 18px 40px rgba(15,23,42,0.08)'
          }}
          transition={{ duration: 0.25 }}
          className="surface-prominent p-8 relative overflow-hidden"
        >

          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10">

            <div className="flex items-center justify-between mb-10">

              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 font-black mb-3">
                  Financial Intelligence
                </p>

                <h2 className="text-4xl font-black tracking-tight text-slate-900">
                  ₹{stats.savings.toLocaleString('en-IN')}
                </h2>

                <p className="text-slate-500 mt-3 text-sm leading-relaxed max-w-md">
                  {stats.savings >= 0
                    ? `You're operating at a positive savings flow this ${timeframe.toLowerCase()}.`
                    : `Your expenses exceeded income this ${timeframe.toLowerCase()}.`}
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl ${
                  stats.savings >= 0
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                {stats.savings >= 0 ? (
                  <TrendingUp size={28} />
                ) : (
                  <TrendingDown size={28} />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">

              <div className="surface-muted p-5 rounded-2xl">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-black mb-2">
                  Income
                </p>

                <p className="text-2xl font-black text-emerald-600 tracking-tight">
                  ₹{stats.income.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="surface-muted p-5 rounded-2xl">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-black mb-2">
                  Expenses
                </p>

                <p className="text-2xl font-black text-rose-600 tracking-tight">
                  {Array.from(`₹${stats.expenses.toLocaleString('en-IN')}`).map((char, index) => (
  <tspan key={index}>
    {char}
  </tspan>
))}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-5">

          <motion.div
            whileHover={{
              y: -2,
              boxShadow: '0 18px 40px rgba(15,23,42,0.08)'
            }}
            transition={{ duration: 0.25 }}
            className="surface-card p-6"
          >
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
          </motion.div>

          <motion.div
            whileHover={{
              y: -2,
              boxShadow: '0 18px 40px rgba(15,23,42,0.08)'
            }}
            transition={{ duration: 0.25 }}
            className="surface-card p-6"
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-black mb-3">
              Financial Status
            </p>

            <h3
              className={`text-2xl font-black tracking-tight ${
                stats.savings >= 0
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {stats.savings >= 0 ? 'Healthy' : 'Overspending'}
            </h3>

            <p className="text-sm text-slate-500 mt-2">
              Based on current {timeframe.toLowerCase()} activity.
            </p>
          </motion.div>
        </div>
      </div>

      {/* CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* PIE CHART */}
        <motion.div
          whileHover={{
            y: -2,
            boxShadow: '0 18px 40px rgba(15,23,42,0.08)'
          }}
          transition={{ duration: 0.25 }}
          className="surface-card p-8"
        >

          <div className="flex items-start justify-between mb-6">

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
            </div>

            <div className="surface-muted px-4 py-3 rounded-2xl">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-black mb-1">
                Categories
              </p>

              <p className="text-xl font-black text-slate-900">
                {stats.pieData.length}
              </p>
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>

                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={108}
                  paddingAngle={4}
                  dataKey="value"
                  isAnimationActive={true}
                  animationBegin={0}
                  animationDuration={1800}
                  animationEasing="ease-out"
                  activeOuterRadius={116}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {stats.pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="rgba(255,255,255,0.75)"
                      strokeWidth={3}
                      style={{
                        filter: 'drop-shadow(0 6px 14px rgba(99,102,241,0.10))'
                      }}
                    />
                  ))}

                </Pie>
                 <g>
                    {/* Accent line */}
                    <line
                      x1="38%"
                      y1="50%"
                      x2="62%"
                      y2="50%"
                      stroke="rgba(15,23,42,0.08)"
                      strokeWidth="1.5"
                    />

                    {/* Animated Amount */}
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-slate-900 text-[28px] font-black tracking-tight"
                    >
                      {Array.from(`₹${stats.expenses.toLocaleString('en-IN')}`).map((char, index) => (
                        <motion.tspan
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: index * 0.045,
                            duration: 0.28
                          }}
                        >
                          {char}
                        </motion.tspan>
                      ))}
                    </text>
                    
                  </g>

                <Tooltip
  content={({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl px-4 py-3 shadow-2xl min-w-[170px]">

          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-black mb-3">
            {label}
          </p>

          <div className="space-y-2">

            {payload.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-6"
              >

                <div className="flex items-center gap-2">

                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: entry.color,
                      boxShadow: `0 0 10px ${entry.color}`
                    }}
                  />

                  <span className="text-sm text-slate-300 font-medium capitalize">
                    {entry.name}
                  </span>
                </div>

                <span className="text-sm font-black text-white">
                  ₹{Number(entry.value).toLocaleString('en-IN')}
                </span>

              </div>
            ))}

          </div>
        </div>
      );
    }

    return null;
  }} />

              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* LINE CHART */}
        <motion.div
          whileHover={{
            y: -2,
            boxShadow: '0 18px 40px rgba(15,23,42,0.08)'
          }}
          transition={{ duration: 0.25 }}
          className="surface-card p-8"
        >

          <div className="flex items-start justify-between mb-6">

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity size={18} className="text-indigo-500" />

                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-black">
                  Cash Flow Analysis
                </p>
              </div>

              <h3 className="text-2xl font-black tracking-tight text-slate-900">
                Income vs Expenses Trend
              </h3>
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">

              <LineChart
                data={stats.trendData}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >

                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="rgba(148,163,184,0.10)"
                />

                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={4}
                  dot={false}
                />

                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={4}
                  dot={false}
                />

              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* TRANSACTION HISTORY */}
      <motion.div
        whileHover={{
          y: -2,
          boxShadow: '0 18px 40px rgba(15,23,42,0.08)'
        }}
        transition={{ duration: 0.25 }}
        className="surface-card p-8 overflow-hidden"
      >

        <div className="flex items-center justify-between mb-6">

          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-black mb-2">
              Financial Activity
            </p>

            <h3 className="text-2xl font-black tracking-tight text-slate-900">
              Transaction History
            </h3>
          </div>

          <div className="surface-muted px-4 py-3 rounded-2xl">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-black mb-1">
              Entries
            </p>

            <p className="text-xl font-black text-slate-900">
              {filteredData.length}
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">

          {filteredData.map((t, index) => (

            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.02 }}
              className="flex items-center justify-between py-4 px-2 rounded-xl hover:bg-slate-50/70 transition-colors duration-200"
            >

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
    </motion.div>
  );
};

export default Reports;