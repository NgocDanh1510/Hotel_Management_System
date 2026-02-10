import React from "react";

const PartnerRoomTypesPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Room Types</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Room Type
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">No room types created yet.</p>
      </div>
    </div>
  );
};

export default PartnerRoomTypesPage;
