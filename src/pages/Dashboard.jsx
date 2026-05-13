import React, { useMemo } from 'react';
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
  Cell,
  Legend
} from 'recharts';

import { format } from 'date-fns';
import { useTransactions } from '../contexts/TransactionContext.jsx';

const Dashboard = () => {
  const { transactions, isLoading } = useTransactions();

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 text-lg font-semibold text-gray-500">
        Syncing with Database...
      </div>
    );
  }

  // 1. Total Income (Fixed with .toLowerCase())
  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type?.toLowerCase() === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // 2. Total Expenses (Fixed with .toLowerCase())
  const totalExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type?.toLowerCase() === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Balance
  const balance = useMemo(() => {
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses]);

  // 3. Monthly Chart Data (Fixed logic inside loop)
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

      // Check type case-insensitively
      if (t.type?.toLowerCase() === 'expense') {
        monthlyMap[monthKey].expense += t.amount;
      } else if (t.type?.toLowerCase() === 'income') {
        monthlyMap[monthKey].income += t.amount;
      }
    });

    const sortedData = Object.values(monthlyMap)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-6);

    return sortedData.length > 0 ? sortedData : [{ name: 'No Data', expense: 0, income: 0 }];
  }, [transactions]);

  // 4. Category Pie Chart (Fixed with .toLowerCase())
  const categoryData = useMemo(() => {
    const categoryMap = {};

    transactions
      .filter(t => t.type?.toLowerCase() === 'expense')
      .forEach(t => {
        if (!categoryMap[t.category]) {
          categoryMap[t.category] = 0;
        }
        categoryMap[t.category] += t.amount;
      });

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  // Recent Transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [transactions]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6384', '#36A2EB', '#FFCE56'];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Total Income</h3>
          <p className="text-3xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Total Expenses</h3>
          <p className="text-3xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Balance</h3>
          <p className="text-3xl font-bold text-blue-600">₹{balance.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="expense" fill="#ff6b6b" name="Expenses" radius={[6, 6, 0, 0]} />
              <Bar dataKey="income" fill="#4ecdc4" name="Income" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%" cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTransactions.map(transaction => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{transaction.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{transaction.category}</td>
                  <td className={`px-6 py-4 text-sm font-medium ${transaction.type?.toLowerCase() === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type?.toLowerCase() === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(transaction.date), 'MMM dd, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;