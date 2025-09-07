import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, User, Building2, Home } from 'lucide-react';
import { 
  uploadFile, 
  getLatestFile, 
  deleteFile, 
  replaceFile,
  compressImage,
  formatFileSize,
  FileMetadataResponse
} from '../services/fileUploadApi';
import { EntityType, getFileCategoryForEntity, type EntityTypeValue } from '../constants/fileUpload';
import UploadProgress from './UploadProgress';

interface ProfilePictureUploadProps {
  entityType: EntityTypeValue;
  entityId: number;
  entityName?: string;
  onUploadSuccess?: (fileUrl: string) => void;
  onUploadError?: (error: string) => void;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  entityType,
  entityId,
  entityName,
  onUploadSuccess,
  onUploadError
}) => {
  const [currentImage, setCurrentImage] = useState<FileMetadataResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error'>('uploading');
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [showProgress, setShowProgress] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing image on mount
  useEffect(() => {
    loadExistingImage();
  }, [entityType, entityId]);

  const loadExistingImage = async () => {
    try {
      const fileCategory = getFileCategoryForEntity(entityType);
      const existingFile = await getLatestFile(entityType, entityId, fileCategory);
      if (existingFile) {
        setCurrentImage(existingFile);
        setPreviewUrl(existingFile.cloudFrontUrl);
      }
    } catch (error) {
      console.log('No existing image found');
    }
  };

  const getDefaultIcon = () => {
    switch (entityType) {
      case EntityType.Tenant:
      case EntityType.Owner:
        return <User className="w-20 h-20 text-gray-400" />;
      case EntityType.Property:
        return <Building2 className="w-20 h-20 text-gray-400" />;
      case EntityType.Room:
        return <Home className="w-20 h-20 text-gray-400" />;
      default:
        return <User className="w-20 h-20 text-gray-400" />;
    }
  };

  const getEntityLabel = () => {
    switch (entityType) {
      case EntityType.Tenant:
        return 'Tenant Profile Picture';
      case EntityType.Owner:
        return 'Owner Profile Picture';
      case EntityType.Property:
        return 'Property Image';
      case EntityType.Room:
        return 'Room Image';
      default:
        return 'Profile Picture';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadMessage('Please select an image file');
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
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Show confirmation dialog
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
      // Compress image if needed
      const fileToUpload = await compressImage(selectedFile);
      const fileCategory = getFileCategoryForEntity(entityType);
      
      // Upload or replace file
      let result;
      if (currentImage) {
        result = await replaceFile(
          entityType,
          entityId,
          fileCategory,
          fileToUpload,
          currentImage.id,
          undefined,
          (progress) => setUploadProgress(progress)
        );
      } else {
        result = await uploadFile(
          entityType,
          entityId,
          fileCategory,
          fileToUpload,
          undefined,
          (progress) => setUploadProgress(progress)
        );
      }

      // Update state with new image
      setCurrentImage({
        id: result.fileId,
        entityType,
        entityId,
        fileCategory,
        fileName: result.fileName,
        fileSize: result.fileSize,
        contentType: selectedFile.type,
        cloudFrontUrl: result.cloudFrontUrl,
        uploadedAt: result.uploadedAt,
        uploadedBy: 0, // Will be set by backend
      });
      
      setPreviewUrl(result.cloudFrontUrl);
      setUploadStatus('success');
      setUploadMessage('Image uploaded successfully!');
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
      
      // Reset preview if upload failed
      if (currentImage) {
        setPreviewUrl(currentImage.cloudFrontUrl);
      } else {
        setPreviewUrl(null);
      }
      
      // Hide progress after 3 seconds
      setTimeout(() => setShowProgress(false), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentImage || !confirm('Are you sure you want to delete this image?')) return;

    try {
      await deleteFile(currentImage.id);
      setCurrentImage(null);
      setPreviewUrl(null);
      setUploadStatus('success');
      setUploadMessage('Image deleted successfully');
      setShowProgress(true);
      setTimeout(() => setShowProgress(false), 2000);
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage('Failed to delete image');
      setShowProgress(true);
      setTimeout(() => setShowProgress(false), 3000);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setSelectedFile(null);
    
    // Reset preview
    if (currentImage) {
      setPreviewUrl(currentImage.cloudFrontUrl);
    } else {
      setPreviewUrl(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{getEntityLabel()}</h3>
        {entityName && (
          <span className="text-sm text-gray-500">{entityName}</span>
        )}
      </div>

      <div className="flex items-start space-x-6">
        {/* Image Preview */}
        <div className="relative">
          <div className="w-32 h-32 rounded-lg border-2 border-gray-300 border-dashed overflow-hidden bg-gray-50 flex items-center justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={getEntityLabel()}
                className="w-full h-full object-cover"
              />
            ) : (
              getDefaultIcon()
            )}
          </div>
          
          {currentImage && (
            <div className="absolute -top-2 -right-2">
              <button
                onClick={handleDelete}
                className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Delete image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentImage ? (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Change Image
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </>
            )}
          </button>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Maximum file size: 5MB</p>
            <p>• Supported formats: JPG, PNG, GIF</p>
            <p>• Image will be automatically compressed</p>
          </div>

          {currentImage && (
            <div className="text-xs text-gray-600 mt-2">
              <p>Current image: {currentImage.fileName}</p>
              <p>Size: {formatFileSize(currentImage.fileSize)}</p>
              <p>Uploaded: {new Date(currentImage.uploadedAt).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Upload</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to upload this image?
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">Size: {formatFileSize(selectedFile.size)}</p>
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

export default ProfilePictureUpload;