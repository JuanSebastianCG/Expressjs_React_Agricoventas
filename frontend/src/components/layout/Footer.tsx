import React from 'react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-blue-3 text-white py-6 mt-auto">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">About</h3>
            <p className="text-blue-1-5">
              Our application provides a modern and responsive user interface built with React, Vite, and Tailwind CSS.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-blue-1-5 hover:text-white transition-colors">Home</a>
              </li>
              <li>
                <a href="#" className="text-blue-1-5 hover:text-white transition-colors">About</a>
              </li>
              <li>
                <a href="#" className="text-blue-1-5 hover:text-white transition-colors">Contact</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <p className="text-blue-1-5">
              Email: info@example.com<br />
              Phone: +1 (555) 123-4567
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-blue-1-5/30 text-center">
          <p>&copy; {year} Company Name. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 