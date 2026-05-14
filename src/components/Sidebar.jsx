import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ReceiptIndianRupee, 
  PieChart, 
  Target, 
  Settings,
  PlusCircle
} from 'lucide-react';

const NavItem = ({ icon: Icon, label, to, active }) => (
  <Link to={to}>
    <motion.div
      whileHover={{ x: 4, backgroundColor: 'rgba(241, 245, 249, 1)' }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${
        active ? 'bg-indigo-50 text-indigo-600' : 'text-secondary hover:text-primary'
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      <span className={`text-sm font-medium ${active ? 'font-semibold' : ''}`}>{label}</span>
    </motion.div>
  </Link>
);

// Destructure onAddClick from props here
const Sidebar = ({ onAddClick }) => {
  const location = useLocation();

  return (
    <aside className="w-64 h-screen border-r border-default bg-surface flex flex-col p-4 fixed left-0 top-0 z-50">
      {/* BRAND ZONE */}
      <div className="px-4 py-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            E
          </div>
          <span className="text-lg font-bold tracking-tight text-primary">ExpenseOS</span>
        </div>
      </div>

      {/* NAVIGATION ZONE */}
      <nav className="flex-1 space-y-1">
        <NavItem icon={LayoutDashboard} label="Dashboard" to="/" active={location.pathname === '/'} />
        <NavItem icon={ReceiptIndianRupee} label="Transactions" to="/transactions" active={location.pathname === '/transactions'} />
        <NavItem icon={PieChart} label="Reports" to="/reports" active={location.pathname === '/reports'} />
        <NavItem icon={Target} label="Budgets" to="/budget" active={location.pathname === '/budget'} />
      </nav>

      {/* QUICK ACTION */}
      <div className="mb-6 px-2">
        <motion.button
          onClick={onAddClick} // <--- Attached the trigger here
          whileTap={{ scale: 0.95 }}
          className="liquid-accent text-white rounded-xl w-full py-3 flex items-center justify-center gap-2 text-sm font-bold"
        >
          <PlusCircle size={18} />
          Add Transaction
        </motion.button>
      </div>

      {/* UTILITY ZONE */}
      <div className="border-t border-slate-50 pt-4">
        <NavItem icon={Settings} label="Settings" to="/settings" active={location.pathname === '/settings'} />
      </div>
    </aside>
  );
};

export default Sidebar;