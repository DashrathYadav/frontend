import React, { useState, useRef, useEffect } from 'react';
import { FileText, Upload, Trash2, Download, Check, AlertCircle } from 'lucide-react';
import { 
  uploadFile, 
  getEntityFiles,
  deleteFile, 
  replaceFile,
  formatFileSize,
  FileMetadataResponse
} from '../services/fileUploadApi';
import { EntityType, FileCategory, type DocumentTypeValue } from '../constants/fileUpload';
import UploadProgress from './UploadProgress';

interface DocumentUploadProps {
  tenantId: number;
  documentType: DocumentTypeValue;
  label: string;
  description?: string;
  onUploadSuccess?: (fileUrl: string) => void;
  onUploadError?: (error: string) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  tenantId,
  documentType,
  label,
  description,
  onUploadSuccess,
  onUploadError
}) => {
  const [currentDocument, setCurrentDocument] = useState<FileMetadataResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error'>('uploading');
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [showProgress, setShowProgress] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing document on mount
  useEffect(() => {
    loadExistingDocument();
  }, [tenantId, documentType]);

  const loadExistingDocument = async () => {
    try {
      const entityFiles = await getEntityFiles(EntityType.Tenant, tenantId, FileCategory.TenantDocument);
      const document = entityFiles.files.find(f => f.documentType === documentType);
      if (document) {
        setCurrentDocument(document);
      }
    } catch (error) {
      console.log('No existing document found');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      setUploadMessage('Please select a PDF file');
      setUploadStatus('error');
      setShowProgress(true);
      setTimeout(() => setShowProgress(false), 3000);
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage('File size must be less than 5MB');
      setUploadStatus('error');
      setShowProgress(true);
      setTimeout(() => setShowProgress(false), 3000);
      return;
    }

    setSelectedFile(file);
    setShowConfirmDialog(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setShowConfirmDialog(false);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setShowProgress(true);
    setUploadMessage('');

    try {
      // Upload or replace file
      let result;
      if (currentDocument) {
        result = await replaceFile(
          EntityType.Tenant,
          tenantId,
          FileCategory.TenantDocument,
          selectedFile,
          currentDocument.id,
          documentType,
          (progress) => setUploadProgress(progress)
        );
      } else {
        result = await uploadFile(
          EntityType.Tenant,
          tenantId,
          FileCategory.TenantDocument,
          selectedFile,
          documentType,
          (progress) => setUploadProgress(progress)
        );
      }

      // Update state with new document
      setCurrentDocument({
        id: result.fileId,
        entityType: EntityType.Tenant,
        entityId: tenantId,
        fileCategory: FileCategory.TenantDocument,
        documentType,
        fileName: result.fileName,
        fileSize: result.fileSize,
        contentType: selectedFile.type,
        cloudFrontUrl: result.cloudFrontUrl,
        uploadedAt: result.uploadedAt,
        uploadedBy: 0, // Will be set by backend
      });
      
      setUploadStatus('success');
      setUploadMessage('Document uploaded successfully!');
      onUploadSuccess?.(result.cloudFrontUrl);
      
      // Hide progress after 2 seconds
      setTimeout(() => {
        setShowProgress(false);
        setSelectedFile(null);
      }, 2000);
      
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Upload failed');
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
      
      // Hide progress after 3 seconds
      setTimeout(() => setShowProgress(false), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentDocument || !confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteFile(currentDocument.id);
      setCurrentDocument(null);
      setUploadStatus('success');
      setUploadMessage('Document deleted successfully');
      setShowProgress(true);
      setTimeout(() => setShowProgress(false), 2000);
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage('Failed to delete document');
      setShowProgress(true);
      setTimeout(() => setShowProgress(false), 3000);
    }
  };

  const handleDownload = () => {
    if (!currentDocument) return;
    window.open(currentDocument.cloudFrontUrl, '_blank');
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setSelectedFile(null);
  };

  const getStatusIcon = () => {
    if (currentDocument) {
      return <Check className="w-5 h-5 text-green-500" />;
    }
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gray-400" />
            <h4 className="text-sm font-medium text-gray-900">{label}</h4>
            {getStatusIcon()}
          </div>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>

      {currentDocument ? (
        <div className="bg-gray-50 rounded p-3 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentDocument.fileName}
              </p>
              <p className="text-xs text-gray-500">
                Size: {formatFileSize(currentDocument.fileSize)} • 
                Uploaded: {new Date(currentDocument.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Upload className="w-3 h-3 mr-1" />
              Replace
            </button>
            <button
              onClick={handleDelete}
              disabled={isUploading}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center space-y-1">
              <Upload className="w-6 h-6" />
              <span>Click to upload PDF</span>
              <span className="text-xs text-gray-400">Maximum 5MB</span>
            </div>
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Upload</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to upload this document?
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  Type: {label} • Size: {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      <UploadProgress
        isVisible={showProgress}
        progress={uploadProgress}
        fileName={selectedFile?.name}
        status={uploadStatus}
        message={uploadMessage}
        onClose={() => setShowProgress(false)}
      />
    </div>
  );
};

export default DocumentUpload;