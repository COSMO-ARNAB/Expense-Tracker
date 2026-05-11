// src/contexts/TransactionContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage.js';

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

  // Load data from persistent storage on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedTransactions = await storage.getItem('transactions');
        const savedBudgets = await storage.getItem('budgets');
        
        if (savedTransactions) {
          setTransactions(JSON.parse(savedTransactions));
        }
        
        if (savedBudgets) {
          setBudgets(JSON.parse(savedBudgets));
        }
      } catch (error) {
        console.error('Error loading data from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Save transactions to persistent storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      storage.setItem('transactions', JSON.stringify(transactions));
    }
  }, [transactions, isLoading]);

  // Save budgets to persistent storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      storage.setItem('budgets', JSON.stringify(budgets));
    }
  }, [budgets, isLoading]);

  const addTransaction = (transaction) => {
    setTransactions(prev => [...prev, transaction]);
  };

  const updateTransaction = (id, updatedTransaction) => {
    setTransactions(prev => 
      prev.map(t => t.id === id ? updatedTransaction : t)
    );
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addBudget = (budget) => {
    setBudgets(prev => [...prev, budget]);
  };

  const updateBudget = (id, updatedBudget) => {
    setBudgets(prev => 
      prev.map(b => b.id === id ? updatedBudget : b)
    );
  };

  const deleteBudget = (id) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  const value = {
    transactions,
    budgets,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    deleteBudget,
    isLoading
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export default TransactionContext;