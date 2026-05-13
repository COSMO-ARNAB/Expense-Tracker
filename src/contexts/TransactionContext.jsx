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
  const [customCategories, setCustomCategories] = useState([]); //custom categories state

  // Load data from SQLite on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const txs = await window.electronAPI.db.getTransactions();
        const bds = await window.electronAPI.db.getBudgets();
        const cc = await window.electronAPI.db.getCustomCategories();

        if (txs) setTransactions(txs);
        if (bds) setBudgets(bds);
        if (cc) setCustomCategories(cc);
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
    // 1. Send to DB and capture the response (the new real ID)
    const newId = await window.electronAPI.db.addTransaction(transaction);
    
    // 2. Overwrite the temporary UUID with the real database ID
    const savedTransaction = { ...transaction, id: newId };
    
    // 3. Update React
    setTransactions(prev => [...prev, savedTransaction]);
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

  // Save custom category to DB and state
  const saveCustomCategory = async (category) => {
    try {
      await window.electronAPI.db.addCustomCategory(category);
      setCustomCategories(prev => [...prev, category]);
    } catch (error) {
      console.error("Failed to save custom category:", error);
    }
  };

  // Delete custom category from DB and state
  const removeCustomCategory = async (id) => {
    try {
      await window.electronAPI.db.deleteCustomCategory(id);
      setCustomCategories(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error("Failed to delete custom category:", error);
    }
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
      customCategories,
      saveCustomCategory, // Expose saveCustomCategory to context
      removeCustomCategory, // Expose removeCustomCategory to context
      isLoading
    }}>
      {children}
    </TransactionContext.Provider>
  );
};

export default TransactionContext;