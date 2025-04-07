import React, { useState } from 'react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen = true, 
  onClose 
}) => {
  const [collapsed, setCollapsed] = useState(false);
  
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  
  const sidebarClasses = `
    min-h-screen bg-blue-3 text-white transition-all duration-300 ease-in-out
    ${collapsed ? 'w-16' : 'w-64'}
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;
  
  const navItems = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'Analytics', icon: '📈' },
    { name: 'Products', icon: '📦' },
    { name: 'Customers', icon: '👥' },
    { name: 'Settings', icon: '⚙️' },
  ];
  
  return (
    <aside className={sidebarClasses}>
      <div className="p-4 flex items-center justify-between border-b border-blue-1-5/20">
        {!collapsed && <h2 className="text-xl font-bold">Menu</h2>}
        <button 
          onClick={toggleCollapse} 
          className="text-white hover:text-blue-1-5 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
        
        {!collapsed && onClose && (
          <button 
            onClick={onClose}
            className="text-white hover:text-red-1 transition-colors"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        )}
      </div>
      
      <nav className="py-4">
        <ul>
          {navItems.map((item, index) => (
            <li key={index}>
              <a 
                href="#"
                className="flex items-center py-3 px-4 hover:bg-blue-1-5/10 transition-colors"
              >
                <span className="text-xl">{item.icon}</span>
                {!collapsed && <span className="ml-3">{item.name}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar; 