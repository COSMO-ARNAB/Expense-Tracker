// src/contexts/SettingsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
  displayName: 'Arnab', // Default to user's name
  avatarColor: '#6366f1', // Beautiful Indigo
  currency: '₹',
  locale: 'en-IN',
  dateFormat: 'dd MMM yyyy',
  budgetAlertThreshold: 80,
  alertEnabled: true,
  compactMode: false,
  defaultCategory: 'Food',
  defaultTransactionType: 'expense',
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('expenseos_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge defaults to ensure newly added settings are always present
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load settings from localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('expenseos_settings', JSON.stringify(settings));
      // Toggle compact class on document body
      if (settings.compactMode) {
        document.body.classList.add('compact');
      } else {
        document.body.classList.remove('compact');
      }
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateAllSettings = (newSettings) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  // Helper to dynamically choose between normal and compact layout classes
  const cx = (normal, compact) => (settings.compactMode ? compact : normal);

  // Global formatting utilities
  const formatCurrency = (amount) => {
    const number = Number(amount) || 0;
    const formattedVal = number.toLocaleString(settings.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    
    // For general aesthetic compatibility, prefix the currency symbol
    return `${settings.currency}${formattedVal}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '';
    try {
      // Handle SQLite format YYYY-MM-DD or standard JS Date objects/strings
      const cleanDate = typeof dateValue === 'string' && dateValue.includes('-') && !dateValue.includes('T')
        ? new Date(`${dateValue}T00:00:00`)
        : new Date(dateValue);

      if (isNaN(cleanDate.getTime())) return dateValue;
      return format(cleanDate, settings.dateFormat);
    } catch (error) {
      console.error('Error formatting date in SettingsContext:', error);
      return dateValue;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        settings,
        updateSetting,
        updateAllSettings,
        formatCurrency,
        formatDate,
        cx,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
