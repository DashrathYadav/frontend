// File upload service using native fetch API
import { FileCategory, type EntityTypeValue, type FileCategoryValue, type DocumentTypeValue } from '../constants/fileUpload';

// Types for file upload
export interface FileUploadRequest {
  entityType: EntityTypeValue;
  entityId: number;
  fileCategory: FileCategoryValue;
  documentType?: DocumentTypeValue;
  fileName: string;
  fileSize: number;
  contentType: string;
}

export interface FileUploadUrlResponse {
  uploadUrl: string;
  uploadToken: string;
  s3Key: string;
  expiresAt: string;
  maxFileSizeBytes: number;
  allowedContentTypes: string[];
}

export interface FileConfirmUploadRequest {
  uploadToken: string;
  s3Key: string;
  etag?: string;
}

export interface FileUploadConfirmationResponse {
  fileId: number;
  cloudFrontUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  message: string;
}

export interface FileMetadataResponse {
  id: number;
  entityType: string;
  entityId: number;
  fileCategory: string;
  documentType?: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  cloudFrontUrl: string;
  uploadedAt: string;
  uploadedBy: number;
  uploadedByName?: string;
}

export interface EntityFilesResponse {
  entityType: string;
  entityId: number;
  files: FileMetadataResponse[];
  totalFileSize: number;
  totalFileCount: number;
}

// Get base URL and auth token
const getBaseUrl = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:5268/api/v1';
const getAuthToken = () => localStorage.getItem('authToken');

// File validation limits
const FILE_LIMITS = {
  [FileCategory.TenantImage]: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif']
  },
  [FileCategory.OwnerImage]: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif']
  },
  [FileCategory.PropertyImage]: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif']
  },
  [FileCategory.RoomImage]: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif']
  },
  [FileCategory.TenantDocument]: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf'],
    allowedExtensions: ['.pdf']
  }
};

// Validate file before upload
export const validateFile = (file: File, fileCategory: FileCategoryValue): void => {
  const limit = FILE_LIMITS[fileCategory];
  if (!limit) {
    throw new Error(`Unknown file category: ${fileCategory}`);
  }

  if (file.size > limit.maxSize) {
    throw new Error(`File size exceeds ${limit.maxSize / 1024 / 1024}MB limit`);
  }

  if (!limit.allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed. Allowed types: ${limit.allowedTypes.join(', ')}`);
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!limit.allowedExtensions.includes(extension)) {
    throw new Error(`File extension ${extension} is not allowed. Allowed extensions: ${limit.allowedExtensions.join(', ')}`);
  }
};

// Upload to S3 with progress tracking
const uploadToS3 = async (
  uploadUrl: string, 
  file: File, 
  onProgress?: (percentComplete: number) => void
): Promise<{ ok: boolean; headers: Headers }> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress?.(percentComplete);
      }
    });
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        const headers = new Headers();
        const etag = xhr.getResponseHeader('ETag');
        if (etag) headers.set('ETag', etag);
        
        resolve({
          ok: true,
          headers
        });
      } else {
        reject(new Error(`S3 upload failed: ${xhr.status}`));
      }
    };
    
    xhr.onerror = () => reject(new Error('Network error during upload'));
    
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
};

// Main file upload function
export const uploadFile = async (
  entityType: EntityTypeValue,
  entityId: number,
  fileCategory: FileCategoryValue,
  file: File,
  documentType?: DocumentTypeValue,
  onProgress?: (percentComplete: number) => void
): Promise<FileUploadConfirmationResponse> => {
  let uploadToken: string | null = null;
  
  try {
    // Step 1: Validate file
    validateFile(file, fileCategory);
    
    // Step 2: Request upload URL
    const uploadRequest = await fetch(`${getBaseUrl()}/files/request-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        entityType,
        entityId,
        fileCategory,
        documentType,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type
      } as FileUploadRequest)
    });
    
    if (!uploadRequest.ok) {
      const error = await uploadRequest.json();
      throw new Error(error.message || 'Failed to get upload URL');
    }
    
    const uploadResponse = await uploadRequest.json();
    const uploadData: FileUploadUrlResponse = uploadResponse.data;
    uploadToken = uploadData.uploadToken;
    
    // Step 3: Upload to S3
    const s3Response = await uploadToS3(uploadData.uploadUrl, file, onProgress);
    
    if (!s3Response.ok) {
      throw new Error('S3 upload failed');
    }
    
    // Step 4: Confirm upload
    const confirmResponse = await fetch(`${getBaseUrl()}/files/confirm-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        uploadToken,
        s3Key: uploadData.s3Key,
        etag: s3Response.headers.get('ETag')
      } as FileConfirmUploadRequest)
    });
    
    if (!confirmResponse.ok) {
      const error = await confirmResponse.json();
      throw new Error(error.message || 'Failed to confirm upload');
    }
    
    const result = await confirmResponse.json();
    return result.data as FileUploadConfirmationResponse;
    
  } catch (error) {
    // Cancel upload if token exists
    if (uploadToken) {
      await fetch(`${getBaseUrl()}/files/cancel-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ 
          uploadToken,
          reason: error instanceof Error ? error.message : 'Upload failed'
        })
      }).catch(() => {}); // Ignore cancel errors
    }
    throw error;
  }
};

// Get files for an entity
export const getEntityFiles = async (
  entityType: EntityTypeValue,
  entityId: number,
  fileCategory?: FileCategoryValue
): Promise<EntityFilesResponse> => {
  const params = new URLSearchParams();
  if (fileCategory) params.set('fileCategory', fileCategory);
  
  const url = `${getBaseUrl()}/files/${entityType}/${entityId}${params.toString() ? '?' + params.toString() : ''}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Access denied - you can only access your own entities');
    }
    throw new Error('Failed to get entity files');
  }
  
  const result = await response.json();
  return result.data as EntityFilesResponse;
};

// Get latest file of a specific category
export const getLatestFile = async (
  entityType: EntityTypeValue,
  entityId: number,
  fileCategory: FileCategoryValue
): Promise<FileMetadataResponse | null> => {
  const response = await fetch(`${getBaseUrl()}/files/${entityType}/${entityId}/latest/${fileCategory}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (response.status === 404) {
    return null; // No file found
  }
  
  if (!response.ok) {
    throw new Error('Failed to get latest file');
  }
  
  const result = await response.json();
  return result.data as FileMetadataResponse;
};

// Get file by ID
export const getFileById = async (fileId: number): Promise<FileMetadataResponse> => {
  const response = await fetch(`${getBaseUrl()}/files/file/${fileId}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('File not found');
    }
    if (response.status === 403) {
      throw new Error('Access denied - you can only access your own files');
    }
    throw new Error('Failed to get file');
  }
  
  const result = await response.json();
  return result.data as FileMetadataResponse;
};

// Delete file
export const deleteFile = async (fileId: number): Promise<boolean> => {
  const response = await fetch(`${getBaseUrl()}/files/file/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('File not found or already deleted');
    }
    if (response.status === 403) {
      throw new Error('Access denied - you can only delete your own files');
    }
    throw new Error('Failed to delete file');
  }
  
  const result = await response.json();
  return result.data as boolean;
};

// Replace file (upload new and delete old)
export const replaceFile = async (
  entityType: EntityTypeValue,
  entityId: number,
  fileCategory: FileCategoryValue,
  newFile: File,
  oldFileId?: number,
  documentType?: DocumentTypeValue,
  onProgress?: (percentComplete: number) => void
): Promise<FileUploadConfirmationResponse> => {
  try {
    // Step 1: Upload new file
    const uploadResult = await uploadFile(entityType, entityId, fileCategory, newFile, documentType, onProgress);
    
    // Step 2: Delete old file if specified
    if (oldFileId) {
      try {
        await deleteFile(oldFileId);
        console.log('Old file deleted successfully');
      } catch (error) {
        console.warn('Failed to delete old file:', error);
        // Continue anyway - new file uploaded successfully
      }
    }
    
    return uploadResult;
  } catch (error) {
    console.error('File replacement failed:', error);
    throw error;
  }
};

// Compress image before upload
export const compressImage = (file: File, maxWidth = 1920, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      }, file.type, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};