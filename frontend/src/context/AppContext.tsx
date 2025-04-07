import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of our context state
interface AppContextState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

// Create the context with a default value
const AppContext = createContext<AppContextState | undefined>(undefined);

// Custom hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    // You could also persist this to localStorage here
  };
  
  const login = () => {
    // Here you would typically handle actual authentication logic
    setIsAuthenticated(true);
  };
  
  const logout = () => {
    // Clean up any user data or tokens
    setIsAuthenticated(false);
  };
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo(() => ({
    theme,
    toggleTheme,
    isAuthenticated,
    login,
    logout
  }), [theme, isAuthenticated]);
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider; 