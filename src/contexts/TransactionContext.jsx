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
  const [customCategories, setCustomCategories] = useState([]);

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

  const addTransaction = async (transaction) => {
    try {
      const newId = await window.electronAPI.db.addTransaction(transaction);
      const savedTransaction = { ...transaction, id: newId };
      setTransactions(prev => [...prev, savedTransaction]);
      return newId;
    } catch (error) {
      console.error("Failed to add transaction:", error);
    }
  };

  const updateTransaction = async (id, updatedTransaction) => {
    try {
      // PRECAUTION: Always ensure the DB is updated before or alongside the state
      await window.electronAPI.db.updateTransaction(id, updatedTransaction);
      setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
    } catch (error) {
      console.error("Failed to update transaction:", error);
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await window.electronAPI.db.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  const addBudget = async (budget) => {
    try {
      const newId = await window.electronAPI.db.addBudget(budget);
      const savedBudget = { ...budget, id: newId };
      setBudgets(prev => [...prev, savedBudget]);
      return newId;
    } catch (error) {
      console.error("Failed to add budget:", error);
    }
  };

  const updateBudget = async (id, updatedBudget) => {
    try {
      // PRECAUTION: Fixed the "missing DB handler" issue
      await window.electronAPI.db.updateBudget(id, updatedBudget);
      setBudgets(prev => prev.map(b => b.id === id ? updatedBudget : b));
    } catch (error) {
      console.error("Failed to update budget in DB:", error);
    }
  };

  const deleteBudget = async (id) => {
    try {
      await window.electronAPI.db.deleteBudget(id);
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error("Failed to delete budget:", error);
    }
  };

  const saveCustomCategory = async (category) => {
    try {
      await window.electronAPI.db.addCustomCategory(category);
      setCustomCategories(prev => [...prev, category]);
    } catch (error) {
      console.error("Failed to save custom category:", error);
    }
  };

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
      saveCustomCategory,
      removeCustomCategory,
      isLoading
    }}>
      {children}
    </TransactionContext.Provider>
  );
};

export default TransactionContext;