import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useTransactions } from '../contexts/TransactionContext.jsx';

const PREBUILT_CATEGORIES = {
  Expense: ["Food", "Transport", "Bills", "Entertainment", "Shopping", "Health", "Education", "Others"],
  Income: ["Salary", "Bonus", "Allowance", "Freelance", "Investment", "Other"]
};

const TransactionsPage = () => {
  const { 
    transactions, 
    addTransaction, 
    deleteTransaction, 
    customCategories, 
    saveCustomCategory, 
    isLoading 
  } = useTransactions();

  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Filters State
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // New Transaction Form State
  const [newTransaction, setNewTransaction] = useState({
    title: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Expense' 
  });

  const [customName, setCustomName] = useState("");
  const [shouldSave, setShouldSave] = useState(false);

  // Get categories based on selected Type
  const availableCategories = [
    ...(PREBUILT_CATEGORIES[newTransaction.type] || []),
    ...customCategories.filter(c => c.type === newTransaction.type).map(c => c.name),
    "Custom"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'type') {
      setNewTransaction(prev => ({ ...prev, [name]: value, category: '' }));
    } else {
      setNewTransaction(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTransaction.title || !newTransaction.amount || !newTransaction.category) {
      alert('Please fill in all required fields');
      return;
    }

    let finalCategory = newTransaction.category;
    if (newTransaction.category === "Custom") {
      finalCategory = customName;
      if (shouldSave) {
        await saveCustomCategory({
          id: Date.now().toString(),
          name: customName,
          type: newTransaction.type
        });
      }
    }

    await addTransaction({
      ...newTransaction,
      id: Date.now().toString(),
      amount: parseFloat(newTransaction.amount),
      category: finalCategory,
    });
    
    setNewTransaction({ title: '', amount: '', category: '', date: new Date().toISOString().split('T')[0], type: 'Expense' });
    setCustomName("");
    setShouldSave(false);
    setShowAddForm(false);
  };

  // Filter Logic
  useEffect(() => {
    let filtered = transactions || [];
    if (filterCategory !== 'all') filtered = filtered.filter(t => t.category === filterCategory);
    if (filterType !== 'all') filtered = filtered.filter(t => t.type.toLowerCase() === filterType.toLowerCase());
    setFilteredTransactions(filtered);
  }, [filterCategory, filterType, transactions]);

  if (isLoading) return <div className="p-6 text-center text-gray-500">Loading Transactions...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Transactions</h1>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          {showAddForm ? 'Cancel' : 'Add Transaction'}
        </button>
      </div>

      {/* Add Transaction Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-blue-600">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">New Entry</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select name="type" value={newTransaction.type} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md">
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" value={newTransaction.category} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md" required>
                <option value="">Select Category</option>
                {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            {newTransaction.category === "Custom" && (
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-md border border-dashed border-gray-300">
                <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full px-3 py-2 border rounded-md mb-2" placeholder="Category Name" required />
                <label className="flex items-center text-sm text-gray-600">
                  <input type="checkbox" checked={shouldSave} onChange={(e) => setShouldSave(e.target.checked)} className="mr-2" />
                  Save for future use
                </label>
              </div>
            )}
            <input type="text" name="title" placeholder="Title" value={newTransaction.title} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md" required />
            <input type="number" name="amount" placeholder="Amount" value={newTransaction.amount} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md" required />
            <div className="md:col-span-2">
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Filters</h2>
        <div className="flex gap-4">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border rounded-md">
            <option value="all">All Types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
          <button onClick={() => { setFilterCategory('all'); setFilterType('all'); }} className="text-sm text-blue-600">Reset</button>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((t) => (
                <tr key={t.id}>
                  <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(t.date), 'MMM dd, yyyy')}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{t.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{t.category}</td>
                  <td className={`px-6 py-4 text-sm font-bold ${t.type.toLowerCase() === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type.toLowerCase() === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => deleteTransaction(t.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="text-center py-10 text-gray-400">No transactions found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;