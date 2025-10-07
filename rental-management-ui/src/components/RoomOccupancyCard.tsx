import React from 'react';
import { Home, CheckCircle, XCircle, Percent } from 'lucide-react';

interface RoomOccupancyCardProps {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyPercentage: number;
}

const RoomOccupancyCard: React.FC<RoomOccupancyCardProps> = ({
  totalRooms,
  occupiedRooms,
  availableRooms,
  occupancyPercentage
}) => {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Room Occupancy</h2>
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Home className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Total Rooms */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Home className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Total Rooms</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">{totalRooms}</span>
        </div>

        {/* Occupied Rooms */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            <span className="text-sm text-gray-600">Occupied</span>
          </div>
          <span className="text-lg font-semibold text-green-600">{occupiedRooms}</span>
        </div>

        {/* Available Rooms */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <XCircle className="w-4 h-4 text-blue-500 mr-2" />
            <span className="text-sm text-gray-600">Available</span>
          </div>
          <span className="text-lg font-semibold text-blue-600">{availableRooms}</span>
        </div>

        {/* Occupancy Percentage */}
        <div className="pt-4 mt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Percent className="w-4 h-4 text-primary-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Occupancy Rate</span>
            </div>
            <span className={`text-xl font-bold ${occupancyPercentage >= 80 ? 'text-green-600' : occupancyPercentage >= 50 ? 'text-blue-600' : 'text-yellow-600'}`}>
              {occupancyPercentage.toFixed(1)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${occupancyPercentage >= 80 ? 'bg-green-500' : occupancyPercentage >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
              style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomOccupancyCard;
