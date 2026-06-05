import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import AddTransactionModal from '../components/AddTransactionModal';
import { useSettings } from '../contexts/SettingsContext.jsx';

const MainLayout = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { cx } = useSettings();

  return (
    <div className="flex bg-slate-50 h-screen overflow-hidden">
      {/* Pass the toggle function to the Sidebar */}
      <Sidebar onAddClick={() => setIsModalOpen(true)} />
      
      <main className={cx("flex-1 ml-64 overflow-y-auto", "flex-1 ml-56 overflow-y-auto")}>
        {children}
      </main>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default MainLayout;