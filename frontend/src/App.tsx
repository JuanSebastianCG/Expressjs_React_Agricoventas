import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

type Page = 'home' | 'login' | 'register' | 'dashboard';

function App() {
  // In a real application, you would use react-router-dom here
  // This is a simplified version just for demonstration
  const [currentPage, setCurrentPage] = useState<Page>('home');

  // Check the URL path to determine which page to show
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/login') {
      setCurrentPage('login');
    } else if (path === '/register') {
      setCurrentPage('register');
    } else if (path === '/dashboard') {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('home');
    }

    // Listen for URL changes (back/forward button)
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/login') {
        setCurrentPage('login');
      } else if (path === '/register') {
        setCurrentPage('register');
      } else if (path === '/dashboard') {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Function to navigate between pages
  const navigate = (page: Page) => {
    window.history.pushState({}, '', page === 'home' ? '/' : `/${page}`);
    setCurrentPage(page);
  };

  // Update window object to make navigation available globally
  useEffect(() => {
    // Add a navigate function to the window object for easy access from links
    // @ts-ignore
    window.navigate = navigate;
    
    // Update all links to use the navigate function
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.getAttribute('href')?.startsWith('/') && !link.getAttribute('target')) {
        e.preventDefault();
        const href = link.getAttribute('href') || '/';
        
        if (href === '/login') {
          navigate('login');
        } else if (href === '/register') {
          navigate('register');
        } else if (href === '/dashboard') {
          navigate('dashboard');
        } else if (href === '/') {
          navigate('home');
        } else {
          // For other URLs, just use the default browser behavior
          window.location.href = href;
        }
      }
    };
    
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <AppProvider>
      {currentPage === 'home' && <Home />}
      {currentPage === 'login' && <Login />}
      {currentPage === 'register' && <Register />}
      {currentPage === 'dashboard' && <Dashboard />}
      
      {/* Simple navigation controls for demo purposes */}
      <div className="fixed bottom-4 right-4 flex space-x-2 z-50 bg-white p-2 rounded-lg shadow-lg">
        <button 
          onClick={() => navigate('home')}
          className={`px-4 py-2 rounded-md shadow-md ${
            currentPage === 'home' 
              ? 'bg-blue-3 text-white' 
              : 'bg-gray-0-5 text-white hover:bg-gray-1'
          }`}
        >
          Home
        </button>
        <button 
          onClick={() => navigate('login')}
          className={`px-4 py-2 rounded-md shadow-md ${
            currentPage === 'login' 
              ? 'bg-blue-3 text-white' 
              : 'bg-gray-0-5 text-white hover:bg-gray-1'
          }`}
        >
          Login
        </button>
        <button 
          onClick={() => navigate('register')}
          className={`px-4 py-2 rounded-md shadow-md ${
            currentPage === 'register' 
              ? 'bg-blue-3 text-white' 
              : 'bg-gray-0-5 text-white hover:bg-gray-1'
          }`}
        >
          Register
        </button>
        <button 
          onClick={() => navigate('dashboard')}
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
