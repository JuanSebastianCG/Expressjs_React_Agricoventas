import React from 'react';
import { AppProvider } from './context/AppContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

function App() {
  // For a real application, you would use react-router-dom here
  // This is a simplified version just for demonstration
  const [currentPage, setCurrentPage] = React.useState<'home' | 'dashboard'>('home');

  return (
    <AppProvider>
      {currentPage === 'home' && <Home />}
      {currentPage === 'dashboard' && <Dashboard />}
      
      {/* Simple navigation controls for demo purposes */}
      <div className="fixed bottom-4 right-4 flex space-x-2">
        <button 
          onClick={() => setCurrentPage('home')}
          className={`px-4 py-2 rounded-md shadow-md ${
            currentPage === 'home' 
              ? 'bg-blue-3 text-white' 
              : 'bg-gray-0-5 text-white hover:bg-gray-1'
          }`}
        >
          Home
        </button>
        <button 
          onClick={() => setCurrentPage('dashboard')}
          className={`px-4 py-2 rounded-md shadow-md ${
            currentPage === 'dashboard' 
              ? 'bg-blue-3 text-white' 
              : 'bg-gray-0-5 text-white hover:bg-gray-1'
          }`}
        >
          Dashboard
        </button>
      </div>
    </AppProvider>
  );
}

export default App;
