import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';

interface FinancialSummaryCardProps {
  monthName: string;
  totalExpectedRent: number;
  totalCollectedRent: number;
  totalPendingRent: number;
  collectionPercentage: number;
  currencySymbol?: string;
}

const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  monthName,
  totalExpectedRent,
  totalCollectedRent,
  totalPendingRent,
  collectionPercentage,
  currencySymbol = '₹'
}) => {
  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Monthly Collection Summary</h2>
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-green-600" />
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">{monthName}</p>

      <div className="space-y-4">
        {/* Expected Rent */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-sm text-gray-600">Total Expected</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">{formatAmount(totalExpectedRent)}</span>
        </div>

        {/* Collected Rent */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm text-gray-600">Collected</span>
          </div>
          <span className="text-lg font-semibold text-green-600">{formatAmount(totalCollectedRent)}</span>
        </div>

        {/* Pending Rent */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <span className="text-lg font-semibold text-yellow-600">{formatAmount(totalPendingRent)}</span>
        </div>

        {/* Collection Percentage */}
        <div className="pt-4 mt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 text-primary-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Collection Rate</span>
            </div>
            <span className={`text-xl font-bold ${collectionPercentage >= 80 ? 'text-green-600' : collectionPercentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {collectionPercentage.toFixed(1)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${collectionPercentage >= 80 ? 'bg-green-500' : collectionPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(collectionPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummaryCard;
