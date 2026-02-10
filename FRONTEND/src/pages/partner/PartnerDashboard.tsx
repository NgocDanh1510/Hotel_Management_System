import React from "react";

const PartnerDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Partner Dashboard</h1>
      <p className="text-gray-600 mt-2">Welcome to your hotel management dashboard</p>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Hotels</h3>
          <p className="text-2xl font-bold mt-2">0</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
          <p className="text-2xl font-bold mt-2">0</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold mt-2">$0</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Avg Rating</h3>
          <p className="text-2xl font-bold mt-2">0.0</p>
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboard;
