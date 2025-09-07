import React from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadProgressProps {
  isVisible: boolean;
  progress: number;
  fileName?: string;
  status: 'uploading' | 'success' | 'error';
  message?: string;
  onClose?: () => void;
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  isVisible,
  progress,
  fileName,
  status,
  message,
  onClose
}) => {
  if (!isVisible) return null;

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[320px] z-50">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">
            {status === 'uploading' && 'Uploading...'}
            {status === 'success' && 'Upload Complete'}
            {status === 'error' && 'Upload Failed'}
          </h4>
          {fileName && (
            <p className="text-xs text-gray-600 mt-1 truncate max-w-[250px]">
              {fileName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {status === 'uploading' && (
        <>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-600">
            {Math.round(progress)}% complete
          </p>
        </>
      )}

      {message && (
        <p className={`text-xs mt-2 ${status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default UploadProgress;