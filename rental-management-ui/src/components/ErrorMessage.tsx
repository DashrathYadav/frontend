import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className = '' }) => {
  return (
    <div className={`flex items-start space-x-2 text-error-600 bg-error-50 p-4 rounded-lg border border-error-200 ${className}`}>
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="text-sm whitespace-pre-line">{message}</div>
    </div>
  );
};

export default ErrorMessage;