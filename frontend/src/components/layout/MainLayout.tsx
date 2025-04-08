import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  title?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  showSidebar = false,
  title = 'React App'
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header title={title} />
      
      <div className="flex flex-1">
        {showSidebar && (
          <div className="hidden md:block">
            <Sidebar isOpen={true} />
          </div>
        )}
        
        {/* Mobile sidebar */}
        {showSidebar && (
          <div className="md:hidden">
            <button
              onClick={toggleSidebar}
              className="fixed top-24 left-4 z-20 bg-blue-3 text-white p-2 rounded-md shadow-md"
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
            
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 
              ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              onClick={() => setSidebarOpen(false)}
            />
            
            <div className="fixed inset-y-0 left-0 z-40">
              <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}
        
        <main className="flex-1 w-full">
          <div className="max-w-7xl mx-auto  sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default MainLayout; 