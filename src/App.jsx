// src/App.jsx
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/TransactionsPage';
import Budgets from './pages/Budget';
import Reports from './pages/Reports';
import { TransactionProvider } from './contexts/TransactionContext.jsx';

function App() {
  return (
    <TransactionProvider>
      <Router>
        {/* MainLayout handles the Sidebar and the main scrolling area */}
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budget" element={<Budgets />} />
            <Route path="/reports" element={<Reports />} />
            {/* Future: Add a Settings page here */}
          </Routes>
        </MainLayout>
      </Router>
    </TransactionProvider>
  );
}

export default App;