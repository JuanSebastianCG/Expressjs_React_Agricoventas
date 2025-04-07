import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/common/Button';

const Home: React.FC = () => {
  return (
    <MainLayout title="Home">
      <div className="py-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-blue-3 mb-4">
            Welcome to Our React Application
          </h1>
          <p className="text-xl text-gray-1 mb-8">
            A modern web application built with React, Vite, and Tailwind CSS 4
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-blue-3 mb-3">
                React and TypeScript
              </h2>
              <p className="text-gray-1 mb-4">
                Develop with the power of React and the type safety of TypeScript.
              </p>
              <Button variant="primary" size="md">
                Learn More
              </Button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-green-1 mb-3">
                Vite Build System
              </h2>
              <p className="text-gray-1 mb-4">
                Lightning-fast development and optimized production builds with Vite.
              </p>
              <Button variant="success" size="md">
                Explore Vite
              </Button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-yellow-1 mb-3">
                Tailwind CSS 4
              </h2>
              <p className="text-gray-1 mb-4">
                Modern, responsive designs with the utility-first CSS framework.
              </p>
              <Button variant="warning" size="md">
                View Styles
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
            <Button variant="secondary" size="lg">
              Documentation
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home; 