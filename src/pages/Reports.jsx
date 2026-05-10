import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format, subDays } from 'date-fns';

const Reports = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [reportData, setReportData] = useState({});
  const [categoryData, setCategoryData] = useState([]);

  // Mock data for demonstration
  useEffect(() => {
    // Mock transaction data for reports
    const mockTransactions = [
      { id: 1, title: 'Grocery Shopping', amount: 150, category: 'Food', date: '2023-05-15', type: 'expense' },
      { id: 2, title: 'Electricity Bill', amount: 200, category: 'Bills', date: '2023-05-10', type: 'expense' },
      { id: 3, title: 'Salary', amount: 5000, category: 'Income', date: '2023-05-01', type: 'income' },
      { id: 4, title: 'Movie Tickets', amount: 200, category: 'Entertainment', date: '2023-05-20', type: 'expense' },
      { id: 5, title: 'Freelance Work', amount: 1500, category: 'Income', date: '2023-05-12', type: 'income' },
      { id: 6, title: 'Gas', amount: 100, category: 'Transport', date: '2023-05-05', type: 'expense' },
      { id: 7, title: 'Dinner Out', amount: 300, category: 'Food', date: '2023-05-25', type: 'expense' },
      { id: 8, title: 'Online Shopping', amount: 500, category: 'Shopping', date: '2023-05-18', type: 'expense' },
    ];

    // Generate report data based on time range
    let filteredData = mockTransactions;
    
    if (timeRange === 'week') {
      const oneWeekAgo = subDays(new Date(), 7);
      filteredData = mockTransactions.filter(t => new Date(t.date) >= oneWeekAgo);
    } else if (timeRange === 'month') {
      const oneMonthAgo = subDays(new Date(), 30);
      filteredData = mockTransactions.filter(t => new Date(t.date) >= oneMonthAgo);
    }

    // Calculate total income and expenses
    const totalIncome = filteredData
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Group data by category for pie chart
    const categoryTotals = filteredData.reduce((acc, transaction) => {
      if (transaction.type === 'expense') {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
      }
      return acc;
    }, {});

    const categoryChartData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value
    }));

    // Generate line chart data for monthly trend
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = subDays(new Date(), i * 30);
      const month = format(date, 'MMM yyyy');
      monthlyData.push({
        month,
        income: Math.random() * 10000,
        expenses: Math.random() * 5000
      });
    }

    setReportData({
      totalIncome,
      totalExpenses,
      net: totalIncome - totalExpenses,
      transactions: filteredData
    });

    setCategoryData(categoryChartData);
  }, [timeRange]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#8B4513', '#9370DB', '#20B2AA'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-md ${timeRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-md ${timeRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2 rounded-md ${timeRange === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Total Income</h3>
          <p className="text-3xl font-bold text-green-600">₹{reportData.totalIncome?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Total Expenses</h3>
          <p className="text-3xl font-bold text-red-600">₹{reportData.totalExpenses?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Net Savings</h3>
          <p className={`text-3xl font-bold ${reportData.net && reportData.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{reportData.net?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense by Category */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Income vs Expenses Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Income vs Expenses Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={[
                { month: 'Jan', income: 4000, expenses: 2400 },
                { month: 'Feb', income: 3000, expenses: 1398 },
                { month: 'Mar', income: 2000, expenses: 9800 },
                { month: 'Apr', income: 2780, expenses: 3908 },
                { month: 'May', income: 1890, expenses: 4800 },
                { month: 'Jun', income: 2390, expenses: 3800 },
                { month: 'Jul', income: 3490, expenses: 4300 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="income" stroke="#00C49F" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="#FF6B6B" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Transaction List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Transaction History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.transactions?.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.category}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {transaction.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;