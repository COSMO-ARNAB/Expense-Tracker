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
import { useSettings } from '../contexts/SettingsContext.jsx';

const NavItem = ({ icon: Icon, label, to, active }) => (
  <Link to={to}>
    <motion.div
      whileHover={{ x: 8, backgroundColor: 'rgba(241, 235, 300, 2)' }}
      className={`flex items-center gap-6 px-5 py-2.5 rounded-xl cursor-pointer transition-colors ${
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
  const { displayName, avatarColor } = useSettings();

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
          whileTap={{ scale: 1.05 }}
          className="liquid-accent text-white rounded-xl w-full py-3 flex items-center justify-center gap-3 text-sm font-bold"
        >
          <PlusCircle size={18} />
          Add Transaction
        </motion.button>
      </div>

      {/* UTILITY ZONE */}
      <div className="border-t border-slate-100 pt-4 space-y-1">
        {/* User Card */}
        <div className="px-3 py-2 flex items-center gap-3 mb-1 bg-slate-50/70 border border-slate-50 rounded-2xl">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-xs shadow-sm shrink-0 transition-all duration-300"
            style={{ backgroundColor: avatarColor }}
          >
            {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-800 truncate">{displayName || 'User'}</span>
            <span className="text-[9px] text-slate-400 font-semibold truncate">Local Sync</span>
          </div>
        </div>

        <NavItem icon={Settings} label="Settings" to="/settings" active={location.pathname === '/settings'} />
      </div>
    </aside>
  );
};

export default Sidebar;