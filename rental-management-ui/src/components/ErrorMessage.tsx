import React from 'react';
import { AlertCircle } from 'lucide-react';
import { extractErrorMessage } from '../utils/errorHandler';

interface ErrorMessageProps {
  message?: string;
  error?: unknown;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  error,
  className = ''
}) => {
  const apiError = error ? extractErrorMessage(error) : null;

  // Use provided message or extract from error
  const displayMessage = message || apiError?.message || 'An error occurred';
  const errorDetails = apiError?.errors || [];

  return (
    <div className={`bg-error-50 border border-error-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-error-600" />
        <div className="flex-1">
          <div className="text-sm text-error-600">
            {displayMessage}
          </div>
          {errorDetails.length > 0 && (
            <ul className="mt-2 space-y-1">
              {errorDetails.map((errorDetail, index) => (
                <li key={index} className="text-sm text-error-600">
                  • {errorDetail}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;