import React from 'react';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'Application Name' }) => {
  return (
    <header className="bg-blue-3 text-black shadow-md">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <a 
                href="/" 
                className="hover:text-blue-1-5 transition-colors"
              >
                Home
              </a>
            </li>
            <li>
              <a 
                href="/dashboard" 
                className="hover:text-blue-1-5 transition-colors"
              >
                Dashboard
              </a>
            </li>
            <li>
              <a 
                href="/profile" 
                className="hover:text-blue-1-5 transition-colors"
              >
                Profile
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 