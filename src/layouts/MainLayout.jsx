import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import AddTransactionModal from '../components/AddTransactionModal';

const MainLayout = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      {/* Pass the toggle function to the Sidebar */}
      <Sidebar onAddClick={() => setIsModalOpen(true)} />
      
      <main className="flex-1 ml-64 overflow-y-auto">
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