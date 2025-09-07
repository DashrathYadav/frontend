import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, Shield, Home as HomeIcon, CreditCard } from 'lucide-react';
import { tenantApi } from '../../services/api';
import DocumentUpload from '../../components/DocumentUpload';
import { DocumentType } from '../../constants/fileUpload';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const TenantDocuments: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tenantId = parseInt(id!);
  const [uploadedCount, setUploadedCount] = useState(0);

  // Fetch tenant details
  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => tenantApi.getById(tenantId),
    enabled: !!tenantId,
  });

  const handleUploadSuccess = () => {
    setUploadedCount(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !tenant) {
    return <ErrorMessage message="Failed to load tenant details" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Document Upload</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Upload documents for {tenant.tenantName}
                </p>
              </div>
            </div>
            <Link
              to={`/tenants/${tenantId}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Important Instructions</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>All documents must be in PDF format</li>
                <li>Maximum file size is 5MB per document</li>
                <li>Documents are securely stored and encrypted</li>
                <li>You can replace or delete documents at any time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload Sections */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Required Documents</h2>
          <p className="text-sm text-gray-500 mt-1">
            Please upload the following documents for verification
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Agreement Document */}
          <div>
            <div className="flex items-center mb-3">
              <FileText className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-md font-medium text-gray-900">1. Rental Agreement</h3>
            </div>
            <DocumentUpload
              tenantId={tenantId}
              documentType={DocumentType.Agreement}
              label="Rental Agreement Document"
              description="Upload the signed rental agreement between tenant and owner"
              onUploadSuccess={handleUploadSuccess}
            />
          </div>

          {/* Permanent Address Document */}
          <div>
            <div className="flex items-center mb-3">
              <HomeIcon className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-md font-medium text-gray-900">2. Permanent Address Proof</h3>
            </div>
            <DocumentUpload
              tenantId={tenantId}
              documentType={DocumentType.PermanentAddressProof}
              label="Permanent Address Document"
              description="Upload any government-issued address proof (Voter ID, Driving License, etc.)"
              onUploadSuccess={handleUploadSuccess}
            />
          </div>

          {/* Aadhaar Card */}
          <div>
            <div className="flex items-center mb-3">
              <CreditCard className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-md font-medium text-gray-900">3. Aadhaar Card</h3>
            </div>
            <DocumentUpload
              tenantId={tenantId}
              documentType={DocumentType.IdentityProof}
              label="Aadhaar Card"
              description="Upload Aadhaar card (both sides in single PDF)"
              onUploadSuccess={handleUploadSuccess}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Link
          to={`/tenants/${tenantId}`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          View Tenant Details →
        </Link>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back
          </button>
          <Link
            to="/tenants"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Done
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TenantDocuments;