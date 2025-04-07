import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { formatDate, formatCurrency } from '../utils/helpers';

const Dashboard: React.FC = () => {
  const today = new Date();
  const dummyData = [
    { id: 1, product: 'Product A', sales: 1200, date: new Date(today.getTime() - 86400000 * 2) },
    { id: 2, product: 'Product B', sales: 900, date: new Date(today.getTime() - 86400000 * 4) },
    { id: 3, product: 'Product C', sales: 1500, date: new Date(today.getTime() - 86400000 * 7) },
    { id: 4, product: 'Product D', sales: 750, date: new Date(today.getTime() - 86400000 * 10) },
    { id: 5, product: 'Product E', sales: 2200, date: new Date(today.getTime() - 86400000 * 14) },
  ];

  return (
    <MainLayout title="Dashboard" showSidebar>
      <div className="py-6">
        <h1 className="text-3xl font-bold text-blue-3 mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-1-5 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-blue-3 mb-2">Total Sales</h3>
            <p className="text-3xl font-bold">{formatCurrency(6550)}</p>
          </div>
          
          <div className="bg-green-0-5 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-green-1 mb-2">Products</h3>
            <p className="text-3xl font-bold">5</p>
          </div>
          
          <div className="bg-yellow-2/20 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-yellow-1 mb-2">Customers</h3>
            <p className="text-3xl font-bold">42</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-blue-3">Recent Sales</h2>
                <Button variant="primary" size="sm">View All</Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-0-5">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-1">Product</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-1">Date</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-1">Amount</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-1">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-0-5">
                    {dummyData.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-1-5/10">
                        <td className="px-4 py-3 text-sm text-gray-1">{item.product}</td>
                        <td className="px-4 py-3 text-sm text-gray-1">{formatDate(item.date)}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-1">
                          {formatCurrency(item.sales)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <Button variant="secondary" size="sm">Details</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-blue-3 mb-4">Quick Actions</h2>
              
              <div className="space-y-6">
                <div>
                  <Input 
                    label="Search Products"
                    placeholder="Enter product name..." 
                    fullWidth
                  />
                </div>
                
                <div className="space-y-3">
                  <Button variant="primary" fullWidth>Add New Product</Button>
                  <Button variant="success" fullWidth>Generate Report</Button>
                  <Button variant="warning" fullWidth>View Inventory</Button>
                  <Button variant="danger" fullWidth>Remove Old Items</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard; 