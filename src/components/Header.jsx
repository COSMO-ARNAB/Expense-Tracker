import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="#7DAACB bg-gradient-to-r from-blue-500 to-green-500 shadow-md">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            Expense Tracker
          </h1>

          <nav className="flex space-x-4">
            <Link
              to="/"
              className="text-white hover:text-gray-900"
            >
              Dashboard
            </Link>

            <Link
              to="/transactions"
              className="text-white hover:text-gray-900"
            >
              Transactions
            </Link>

            <Link
              to="/budget"
              className="text-white hover:text-gray-900"
            >
              Budget
            </Link>

            <Link
              to="/reports"
              className="text-white hover:text-gray-900"
            >
              Reports
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;