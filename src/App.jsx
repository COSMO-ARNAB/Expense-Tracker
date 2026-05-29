// src/App.jsx
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/TransactionsPage';
import Budgets from './pages/Budget';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { TransactionProvider } from './contexts/TransactionContext.jsx';
import { SettingsProvider } from './contexts/SettingsContext.jsx';

function App() {
  return (
    <SettingsProvider>
      <TransactionProvider>
        <Router>
          {/* MainLayout handles the Sidebar and the main scrolling area */}
          <MainLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/budget" element={<Budgets />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </MainLayout>
        </Router>
      </TransactionProvider>
    </SettingsProvider>
  );
}

export default App;