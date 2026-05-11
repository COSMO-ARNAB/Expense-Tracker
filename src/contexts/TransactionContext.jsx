import React, { createContext, useContext, useState, useEffect } from 'react';

const TransactionContext = createContext();

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from SQLite on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const txs = await window.electronAPI.db.getTransactions();
        const bds = await window.electronAPI.db.getBudgets();

        if (txs) setTransactions(txs);
        if (bds) setBudgets(bds);
      } catch (error) {
        console.error('Error loading data from SQLite:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Add transaction to DB and update local state
  const addTransaction = async (transaction) => {
    await window.electronAPI.db.addTransaction(transaction);
    setTransactions(prev => [...prev, transaction]);
  };

  // Update transaction in local state only (no DB handler yet)
  const updateTransaction = (id, updatedTransaction) => {
    setTransactions(prev => 
      prev.map(t => t.id === id ? updatedTransaction : t)
    );
  };

  // Delete transaction from DB and update local state
  const deleteTransaction = async (id) => {
    await window.electronAPI.db.deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Add budget to DB and update local state
  const addBudget = async (budget) => {
    await window.electronAPI.db.addBudget(budget);
    setBudgets(prev => [...prev, budget]);
  };

  // Update budget in local state only (no DB handler yet)
  const updateBudget = (id, updatedBudget) => {
    setBudgets(prev => 
      prev.map(b => b.id === id ? updatedBudget : b)
    );
  };

  // Delete budget from DB and update local state
  const deleteBudget = async (id) => {
    await window.electronAPI.db.deleteBudget(id);
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  return (
    <TransactionContext.Provider value={{
      transactions,
      budgets,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addBudget,
      updateBudget,
      deleteBudget,
      isLoading
    }}>
      {children}
    </TransactionContext.Provider>
  );
};

export default TransactionContext;