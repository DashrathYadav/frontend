# Frontend File Upload Integration Guide

## Overview

This guide provides complete instructions for implementing file upload functionality in the frontend application using the RentWiz S3-based file upload system.

## Architecture

The file upload system uses a **3-step process**:
1. **Request Upload URL**: Frontend requests a presigned URL from the API
2. **Direct S3 Upload**: Frontend uploads directly to S3 using the presigned URL
3. **Confirm Upload**: Frontend confirms successful upload with the API

## API Endpoints

### Base URL
```
/api/v1/files
```

### Authentication
All endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

---

## Step-by-Step Implementation

### Step 1: Request Upload URL

**Endpoint:** `POST /api/v1/files/request-upload`

**Request Body:**
```json
{
  "entityType": "Tenant",        // String values: "Tenant" | "Owner" | "Property" | "Room"
  "entityId": 123,               // ID of the entity
  "fileCategory": "TenantImage", // "PropertyImage" | "TenantImage" | "RoomImage" | "OwnerImage" | "TenantDocument"
  "documentType": "Agreement",      // Optional, for documents: "Agreement" | "PermanentAddressProof" | "IdentityProof"
  "fileName": "photo.jpg",
  "fileSize": 2048576,           // Size in bytes
  "contentType": "image/jpeg"
}
```

**Success Response (200):**
```json
{
  "status": true,
  "responseCode": 200,
  "message": "Upload URL generated successfully",
  "data": {
    "uploadUrl": "https://rentwiz-assets.s3.amazonaws.com/...",
    "uploadToken": "abc123-def456-ghi789",
    "s3Key": "development/tenants/123/profile/2024-01-15T10-30-45-a1b2c3d4.jpg",
    "expiresAt": "2024-01-15T10:45:00Z",
    "maxFileSizeBytes": 5242880,
    "allowedContentTypes": ["image/jpeg", "image/png", "image/gif"]
  }
}
```

**Error Responses:**
- `400`: Invalid file type/size, validation errors
- `403`: User not authorized to upload for this entity
- `429`: Rate limit exceeded (5 uploads per minute)

---

### Step 2: Upload to S3

Use the `uploadUrl` from Step 1 to upload directly to S3:

```javascript
const uploadToS3 = async (uploadUrl, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(percentComplete);
      }
    });
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve({
          ok: true,
          headers: {
            get: (name) => xhr.getResponseHeader(name)
          }
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
```

**Important S3 Upload Notes:**
- Use `PUT` method
- Set `Content-Type` header to match the file type
- Upload will fail if file exceeds size limits or doesn't match expected content type
- Upload URL expires in 15 minutes

---

### Step 3: Confirm Upload

**Endpoint:** `POST /api/v1/files/confirm-upload`

**Request Body:**
```json
{
  "uploadToken": "abc123-def456-ghi789",
  "s3Key": "development/tenants/123/profile/2024-01-15T10-30-45-a1b2c3d4.jpg",
  "etag": "\"d41d8cd98f00b204e9800998ecf8427e\""  // Optional, from S3 response
}
```

**Success Response (201):**
```json
{
  "status": true,
  "responseCode": 201,
  "message": "File uploaded successfully",
  "data": {
    "fileId": 456,
    "cloudFrontUrl": "https://d1234567890.cloudfront.net/development/tenants/123/profile/2024-01-15T10-30-45-a1b2c3d4.jpg",
    "fileName": "photo.jpg",
    "fileSize": 2048576,
    "uploadedAt": "2024-01-15T10:30:00Z",
    "message": "File uploaded successfully"
  }
}
```

---

## Complete Upload Function

```javascript
const uploadFile = async (entityType, entityId, fileCategory, file, documentType = null) => {
  let uploadToken = null;
  
  try {
    // Step 1: Validate file
    validateFile(file, fileCategory);
    
    // Step 2: Request upload URL
    const uploadRequest = await fetch('/api/v1/files/request-upload', {
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
      })
    });
    
    if (!uploadRequest.ok) {
      const error = await uploadRequest.json();
      throw new Error(error.message || 'Failed to get upload URL');
    }
    
    const { data } = await uploadRequest.json();
    uploadToken = data.uploadToken;
    
    // Step 3: Upload to S3
    const s3Response = await uploadToS3(data.uploadUrl, file, (progress) => {
      console.log(`Upload progress: ${progress}%`);
      // Update UI progress bar
    });
    
    if (!s3Response.ok) {
      throw new Error('S3 upload failed');
    }
    
    // Step 4: Confirm upload
    const confirmResponse = await fetch('/api/v1/files/confirm-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        uploadToken,
        s3Key: data.s3Key,
        etag: s3Response.headers.get('ETag')
      })
    });
    
    if (!confirmResponse.ok) {
      const error = await confirmResponse.json();
      throw new Error(error.message || 'Failed to confirm upload');
    }
    
    const result = await confirmResponse.json();
    return result.data;
    
  } catch (error) {
    // Cancel upload if token exists
    if (uploadToken) {
      await fetch('/api/v1/files/cancel-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ 
          uploadToken,
          reason: error.message 
        })
      }).catch(() => {}); // Ignore cancel errors
    }
    throw error;
  }
};
```

---

## File Validation

```javascript
const validateFile = (file, fileCategory) => {
  const limits = {
    TenantImage: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif']
    },
    PropertyImage: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif']
    },
    RoomImage: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif']
    },
    TenantDocument: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      allowedExtensions: ['.pdf', '.doc', '.docx']
    }
  };
  
  const limit = limits[fileCategory];
  if (!limit) {
    throw new Error(`Unknown file category: ${fileCategory}`);
  }
  
  if (file.size > limit.maxSize) {
    throw new Error(`File size exceeds ${limit.maxSize / 1024 / 1024}MB limit`);
  }
  
  if (!limit.allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed. Allowed types: ${limit.allowedTypes.join(', ')}`);
  }
  
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (!limit.allowedExtensions.includes(extension)) {
    throw new Error(`File extension ${extension} is not allowed. Allowed extensions: ${limit.allowedExtensions.join(', ')}`);
  }
};
```

---

## Retrieving Files

### Get Files for an Entity

**Endpoint:** `GET /api/v1/files/{entityType}/{entityId}`

**Query Parameters:**
- `fileCategory` (optional): Filter by specific file category (`PropertyImage`, `TenantImage`, `RoomImage`, `OwnerImage`, `TenantDocument`)

```javascript
const getEntityFiles = async (entityType, entityId, options = {}) => {
  const { fileCategory, includeDeleted = false } = options;
  
  // Build URL with optional query parameters
  const params = new URLSearchParams();
  if (fileCategory) params.set('fileCategory', fileCategory);
  if (includeDeleted) params.set('includeDeleted', 'true');
  
  const url = `/api/v1/files/${entityType}/${entityId}${params.toString() ? '?' + params.toString() : ''}`;
    
  try {
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
    return result.data; // EntityFilesResponseDto
  } catch (error) {
    console.error('Error getting entity files:', error.message);
    throw error;
  }
};

// Usage examples:
// Get all files for a tenant
const allFiles = await getEntityFiles('tenant', 123);

// Get only profile pictures for a tenant  
const tenantImages = await getEntityFiles('tenant', 123, { fileCategory: 'TenantImage' });

// Get only documents for a tenant
const documents = await getEntityFiles('tenant', 123, { fileCategory: 'TenantDocument' });
```

### Get Latest File of Category

**Endpoint:** `GET /api/v1/files/{entityType}/{entityId}/latest/{fileCategory}`

```javascript
const getLatestFile = async (entityType, entityId, fileCategory) => {
  const response = await fetch(`/api/v1/files/${entityType}/${entityId}/latest/${fileCategory}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (response.status === 404) {
    return null; // No file found
  }
  
  const result = await response.json();
  return result.data; // FileMetadataResponseDto
};
```

### Get File by ID

**Endpoint:** `GET /api/v1/files/file/{fileId}`

```javascript
const getFileById = async (fileId) => {
  try {
    const response = await fetch(`/api/v1/files/file/${fileId}`, {
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
    return result.data; // FileMetadataResponseDto
  } catch (error) {
    console.error('Error getting file by ID:', error.message);
    throw error;
  }
};
```

### Delete File

**Endpoint:** `DELETE /api/v1/files/file/{fileId}`

```javascript
const deleteFile = async (fileId, confirmDelete = true) => {
  try {
    // Optional confirmation dialog
    if (confirmDelete && !confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return false;
    }
    
    const response = await fetch(`/api/v1/files/file/${fileId}`, {
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
    console.log('File deleted successfully');
    return result.data; // true
    
  } catch (error) {
    console.error('Error deleting file:', error.message);
    throw error;
  }
};
```

### Get User Files (Admin Only)

**Endpoint:** `GET /api/v1/files/user/{userId}`

```javascript
const getUserFiles = async (userId) => {
  try {
    const response = await fetch(`/api/v1/files/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Access denied - Admin privileges required');
      }
      throw new Error('Failed to get user files');
    }
    
    const result = await response.json();
    return result.data; // Array of FileMetadataResponseDto
  } catch (error) {
    console.error('Error getting user files:', error.message);
    throw error;
  }
};
```

---

## Usage Examples

### Upload Tenant Profile Picture

```javascript
const uploadTenantProfilePic = async (tenantId, imageFile) => {
  try {
    const result = await uploadFile('tenant', tenantId, 'TenantImage', imageFile);
    
    // Update UI with new image
    document.getElementById('tenant-avatar').src = result.cloudFrontUrl;
    
    console.log('Profile picture uploaded successfully:', result);
    return result;
  } catch (error) {
    console.error('Upload failed:', error.message);
    // Show error to user
    showError(`Upload failed: ${error.message}`);
  }
};
```

### Upload Document

```javascript
const uploadDocument = async (tenantId, documentFile, documentType) => {
  try {
    const result = await uploadFile('tenant', tenantId, 'TenantDocument', documentFile, documentType);
    
    console.log('Document uploaded successfully:', result);
    
    // Add to documents list in UI
    addTenantDocumentToList({
      id: result.fileId,
      name: result.fileName,
      type: documentType,
      url: result.cloudFrontUrl,
      uploadedAt: result.uploadedAt
    });
    
    return result;
  } catch (error) {
    console.error('Document upload failed:', error.message);
    showError(`Document upload failed: ${error.message}`);
  }
};
```

### Get Tenant Profile Picture

```javascript
const getTenantProfilePic = async (tenantId) => {
  try {
    const tenantImage = await getLatestFile('tenant', tenantId, 'TenantImage');
    
    if (tenantImage) {
      document.getElementById('tenant-avatar').src = tenantImage.cloudFrontUrl;
    } else {
      // Use default avatar
      document.getElementById('tenant-avatar').src = '/assets/default-avatar.png';
    }
    
    return tenantImage;
  } catch (error) {
    console.error('Failed to get profile picture:', error.message);
    // Use default avatar on error
    document.getElementById('tenant-avatar').src = '/assets/default-avatar.png';
  }
};
```

### Upload Room Image

```javascript
const uploadRoomImage = async (roomId, imageFile) => {
  try {
    const result = await uploadFile('room', roomId, 'RoomImage', imageFile);
    
    // Update UI with new room image
    const roomGallery = document.getElementById(`room-${roomId}-gallery`);
    const imgElement = document.createElement('img');
    imgElement.src = result.cloudFrontUrl;
    imgElement.alt = `Room ${roomId} image`;
    imgElement.className = 'room-image';
    roomGallery.appendChild(imgElement);
    
    console.log('Room image uploaded successfully:', result);
    return result;
  } catch (error) {
    console.error('Room image upload failed:', error.message);
    showError(`Upload failed: ${error.message}`);
  }
};
```

### Get Room Images

```javascript
const getRoomImages = async (roomId) => {
  try {
    const roomFiles = await getEntityFiles('room', roomId, { fileCategory: 'RoomImage' });
    
    const gallery = document.getElementById(`room-${roomId}-gallery`);
    gallery.innerHTML = ''; // Clear existing images
    
    roomFiles.files.forEach(file => {
      const imgElement = document.createElement('img');
      imgElement.src = file.cloudFrontUrl;
      imgElement.alt = file.fileName;
      imgElement.className = 'room-image';
      imgElement.onclick = () => openImageModal(file.cloudFrontUrl);
      gallery.appendChild(imgElement);
    });
    
    return roomFiles;
  } catch (error) {
    console.error('Failed to get room images:', error.message);
    showError('Failed to load room images');
  }
};
```

---

## Error Handling

### Common Error Codes

- **400**: Bad Request - Invalid file type, size, or validation errors
- **401**: Unauthorized - Invalid or missing JWT token
- **403**: Forbidden - User not authorized to upload for this entity
- **404**: Not Found - Entity or file not found
- **429**: Too Many Requests - Rate limit exceeded (5 uploads per minute)
- **500**: Internal Server Error - Server-side error

### Error Response Format

```json
{
  "status": false,
  "responseCode": 400,
  "message": "File size exceeds maximum allowed size of 5MB",
  "data": null,
  "errors": [] // Additional validation errors if any
}
```

### Specific Error Scenarios

#### Upload Token Expired
```javascript
// Handle expired upload tokens gracefully
const handleExpiredToken = async (originalUploadFn) => {
  try {
    return await originalUploadFn();
  } catch (error) {
    if (error.message.includes('expired') || error.message.includes('token')) {
      // Token expired, start over
      console.log('Upload token expired, restarting upload process...');
      showUserMessage('Upload session expired. Restarting upload...', 'warning');
      return await originalUploadFn(); // Retry with new token
    }
    throw error;
  }
};
```

#### Network Timeout Handling
```javascript
const uploadWithTimeout = async (uploadFn, timeoutMs = 300000) => { // 5 minutes
  return Promise.race([
    uploadFn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Upload timeout - please try again')), timeoutMs)
    )
  ]);
};
```

#### S3 Upload Failure Recovery
```javascript
const uploadToS3WithRetry = async (uploadUrl, file, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadToS3(uploadUrl, file, (progress) => {
        updateProgressBar(progress, attempt > 1 ? `Attempt ${attempt}` : null);
      });
    } catch (error) {
      console.log(`S3 upload attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Upload failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      showUserMessage(`Upload attempt ${attempt} failed, retrying in ${delay/1000}s...`, 'warning');
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

#### File Validation Errors
```javascript
const handleValidationErrors = (errors) => {
  const errorMessages = {
    'FILE_TOO_LARGE': 'File is too large. Please choose a smaller file.',
    'INVALID_FILE_TYPE': 'File type not supported. Please choose a different file.',
    'FILE_NAME_TOO_LONG': 'File name is too long. Please rename the file.',
    'RATE_LIMIT_EXCEEDED': 'You\'re uploading too quickly. Please wait a moment and try again.',
    'UNAUTHORIZED': 'You don\'t have permission to upload files for this entity.',
    'TOKEN_EXPIRED': 'Your session has expired. Please refresh the page and try again.'
  };
  
  errors.forEach(error => {
    const userMessage = errorMessages[error.code] || error.message;
    showUserMessage(userMessage, 'error');
  });
};
```

### Error Handling Best Practices

1. **Always validate files client-side** before making API calls
2. **Implement retry logic** for network errors
3. **Show progress indicators** during upload
4. **Cancel uploads** if user navigates away
5. **Handle rate limiting** gracefully with user feedback

---

## Rate Limiting

The API enforces rate limiting:
- **5 upload requests per minute** per user
- **10 confirm requests per minute** per user

When rate limited, implement exponential backoff:

```javascript
const uploadWithRetry = async (uploadFn, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFn();
    } catch (error) {
      if (error.message.includes('Rate limit') && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};
```

---

## Security Considerations

1. **CORS**: S3 bucket must be configured with proper CORS settings for your domain
2. **File Types**: Only allowed file types can be uploaded
3. **Size Limits**: Enforced both client and server side
4. **Authentication**: All operations require valid JWT tokens
5. **Authorization**: Users can only upload/access files for entities they own/manage

---

## Testing

### Test Checklist

- [ ] File validation (type, size, extension)
- [ ] Upload progress tracking
- [ ] S3 upload success/failure
- [ ] Network interruption handling
- [ ] Rate limiting behavior
- [ ] File retrieval and display
- [ ] Error message display
- [ ] Multiple file uploads
- [ ] Different file categories
- [ ] Different entity types (tenant, owner, property)

### Test Files

Use these for testing:
- **Valid image**: Small JPEG/PNG under 5MB
- **Invalid type**: .txt or .exe file
- **Too large**: Image over 5MB
- **Valid document**: PDF under 10MB

---

## Performance Tips

1. **Compress images** before upload when possible
2. **Show upload progress** to improve user experience  
3. **Cache file URLs** to avoid repeated API calls
4. **Implement image lazy loading** for better performance
5. **Use WebP format** when browser supports it

---

## Advanced Integration Patterns

### File Replacement Workflow

```javascript
const replaceFile = async (entityType, entityId, fileCategory, newFile, oldFileId = null) => {
  try {
    // Step 1: Upload new file
    const uploadResult = await uploadFile(entityType, entityId, fileCategory, newFile);
    
    // Step 2: Delete old file if specified
    if (oldFileId) {
      try {
        await deleteFile(oldFileId, false); // Don't prompt for confirmation
        console.log('Old file deleted successfully');
      } catch (error) {
        console.warn('Failed to delete old file:', error.message);
        // Continue anyway - new file uploaded successfully
      }
    }
    
    return uploadResult;
  } catch (error) {
    console.error('File replacement failed:', error.message);
    throw error;
  }
};
```

### Bulk File Upload

```javascript
const uploadMultipleFiles = async (entityType, entityId, filesData, onProgress = null) => {
  const results = [];
  const errors = [];
  
  for (let i = 0; i < filesData.length; i++) {
    const { file, fileCategory, documentType } = filesData[i];
    
    try {
      onProgress?.(i + 1, filesData.length, `Uploading ${file.name}...`);
      
      const result = await uploadFile(entityType, entityId, fileCategory, file, documentType);
      results.push({ success: true, file: file.name, result });
      
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error.message);
      errors.push({ file: file.name, error: error.message });
      results.push({ success: false, file: file.name, error: error.message });
    }
    
    // Small delay between uploads to avoid rate limiting
    if (i < filesData.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  onProgress?.(filesData.length, filesData.length, 'Upload complete');
  
  return {
    results,
    errors,
    successCount: results.filter(r => r.success).length,
    errorCount: errors.length
  };
};
```

### Drag and Drop Upload Component

```javascript
class DragDropUploader {
  constructor(dropZoneId, options = {}) {
    this.dropZone = document.getElementById(dropZoneId);
    this.options = {
      allowMultiple: true,
      allowedCategories: ['TenantImage', 'TenantDocument'],
      maxFiles: 10,
      ...options
    };
    
    this.initializeEventListeners();
  }
  
  initializeEventListeners() {
    this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
    this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.dropZone.addEventListener('drop', this.handleDrop.bind(this));
  }
  
  handleDragOver(e) {
    e.preventDefault();
    this.dropZone.classList.add('drag-over');
  }
  
  handleDragLeave(e) {
    e.preventDefault();
    this.dropZone.classList.remove('drag-over');
  }
  
  async handleDrop(e) {
    e.preventDefault();
    this.dropZone.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length > this.options.maxFiles) {
      showUserMessage(`Too many files. Maximum ${this.options.maxFiles} files allowed.`, 'error');
      return;
    }
    
    const filesData = files.map(file => ({
      file,
      fileCategory: this.categorizeFile(file),
      documentType: this.getDocumentType(file)
    }));
    
    try {
      const results = await uploadMultipleFiles(
        this.options.entityType,
        this.options.entityId,
        filesData,
        this.updateProgress.bind(this)
      );
      
      this.handleUploadResults(results);
    } catch (error) {
      showUserMessage(`Upload failed: ${error.message}`, 'error');
    }
  }
  
  categorizeFile(file) {
    if (file.type.startsWith('image/')) {
      return 'TenantImage';
    }
    return 'TenantDocument';
  }
  
  getDocumentType(file) {
    const name = file.name.toLowerCase();
    if (name.includes('aadhar') || name.includes('aadhaar')) return 'Aadhar';
    if (name.includes('pan')) return 'PAN';
    if (name.includes('agreement')) return 'Agreement';
    return null;
  }
  
  updateProgress(current, total, message) {
    const percent = (current / total) * 100;
    document.getElementById('upload-progress').style.width = `${percent}%`;
    document.getElementById('upload-message').textContent = message;
  }
  
  handleUploadResults(results) {
    if (results.errorCount === 0) {
      showUserMessage(`Successfully uploaded ${results.successCount} files!`, 'success');
    } else {
      showUserMessage(`Uploaded ${results.successCount} files with ${results.errorCount} errors`, 'warning');
    }
    
    // Refresh file list
    this.options.onUploadComplete?.(results);
  }
}

// Usage
const uploader = new DragDropUploader('drop-zone', {
  entityType: 'Tenant',
  entityId: 123,
  maxFiles: 5,
  onUploadComplete: (results) => {
    console.log('Upload completed:', results);
    refreshFileList();
  }
});
```

### File Preview and Thumbnail Generation

```javascript
const generatePreview = (file) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate thumbnail size (max 200x200)
        const maxSize = 200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const createFilePreviewElement = async (file, fileId = null) => {
  const preview = document.createElement('div');
  preview.className = 'file-preview';
  
  if (file.type.startsWith('image/')) {
    const thumbnail = await generatePreview(file);
    preview.innerHTML = `
      <img src="${thumbnail}" alt="${file.name}" class="thumbnail">
      <div class="file-info">
        <span class="file-name">${file.name}</span>
        <span class="file-size">${formatFileSize(file.size)}</span>
      </div>
      ${fileId ? `<button onclick="deleteFile(${fileId})" class="delete-btn">×</button>` : ''}
    `;
  } else {
    const icon = getFileIcon(file.type);
    preview.innerHTML = `
      <div class="file-icon">${icon}</div>
      <div class="file-info">
        <span class="file-name">${file.name}</span>
        <span class="file-size">${formatFileSize(file.size)}</span>
      </div>
      ${fileId ? `<button onclick="deleteFile(${fileId})" class="delete-btn">×</button>` : ''}
    `;
  }
  
  return preview;
};
```

### Image Compression Before Upload

```javascript
const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        });
        resolve(compressedFile);
      }, file.type, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Usage in upload function
const uploadCompressedImage = async (entityType, entityId, file) => {
  try {
    // Compress image before upload
    const compressedFile = await compressImage(file);
    const savings = ((file.size - compressedFile.size) / file.size) * 100;
    
    if (savings > 10) {
      console.log(`Image compressed by ${savings.toFixed(1)}%`);
    }
    
    return await uploadFile(entityType, entityId, 'TenantImage', compressedFile);
  } catch (error) {
    console.error('Compressed upload failed:', error.message);
    throw error;
  }
};
```

### Complete Form Integration Example

```javascript
class TenantFileManager {
  constructor(tenantId) {
    this.tenantId = tenantId;
    this.files = new Map();
    this.initialize();
  }
  
  async initialize() {
    await this.loadExistingFiles();
    this.setupEventListeners();
  }
  
  async loadExistingFiles() {
    try {
      const entityFiles = await getEntityFiles('tenant', this.tenantId);
      
      entityFiles.files.forEach(file => {
        this.files.set(file.fileCategory, file);
      });
      
      this.updateUI();
    } catch (error) {
      console.error('Failed to load existing files:', error.message);
    }
  }
  
  setupEventListeners() {
    // Profile picture upload
    document.getElementById('profile-pic-input').addEventListener('change', (e) => {
      this.handleFileUpload(e.target.files[0], 'TenantImage');
    });
    
    // Document uploads
    document.getElementById('aadhar-input').addEventListener('change', (e) => {
      this.handleFileUpload(e.target.files[0], 'TenantDocument', 'IdentityProof');
    });
    
    document.getElementById('pan-input').addEventListener('change', (e) => {
      this.handleFileUpload(e.target.files[0], 'TenantDocument', 'PermanentAddressProof');
    });
  }
  
  async handleFileUpload(file, fileCategory, documentType = null) {
    if (!file) return;
    
    try {
      // Show loading state
      this.setLoadingState(fileCategory, true);
      
      // Get existing file for replacement
      const existingFile = Array.from(this.files.values())
        .find(f => f.fileCategory === fileCategory && f.documentType === documentType);
      
      // Upload new file (with compression for images)
      const result = fileCategory === 'TenantImage' 
        ? await uploadCompressedImage('tenant', this.tenantId, file)
        : await uploadFile('tenant', this.tenantId, fileCategory, file, documentType);
      
      // Delete old file if exists
      if (existingFile) {
        await deleteFile(existingFile.id, false);
      }
      
      // Update local state
      const key = documentType ? `${fileCategory}-${documentType}` : fileCategory;
      this.files.set(key, result);
      
      this.updateUI();
      showUserMessage('File uploaded successfully!', 'success');
      
    } catch (error) {
      console.error('File upload failed:', error.message);
      showUserMessage(`Upload failed: ${error.message}`, 'error');
    } finally {
      this.setLoadingState(fileCategory, false);
    }
  }
  
  setLoadingState(fileCategory, loading) {
    const element = document.querySelector(`[data-category="${fileCategory}"]`);
    if (element) {
      element.classList.toggle('loading', loading);
    }
  }
  
  updateUI() {
    // Update profile picture
    const tenantImage = this.files.get('TenantImage');
    const avatarImg = document.getElementById('tenant-avatar');
    
    if (tenantImage) {
      avatarImg.src = tenantImage.cloudFrontUrl;
      avatarImg.style.display = 'block';
    } else {
      avatarImg.src = '/assets/default-avatar.png';
    }
    
    // Update document status
    const documents = ['Aadhar', 'PAN'];
    documents.forEach(docType => {
      const doc = this.files.get(`TenantDocument-${docType}`);
      const statusElement = document.getElementById(`${docType.toLowerCase()}-status`);
      
      if (doc) {
        statusElement.textContent = '✓ Uploaded';
        statusElement.className = 'status-success';
      } else {
        statusElement.textContent = '○ Not uploaded';
        statusElement.className = 'status-pending';
      }
    });
  }
}

// Initialize for tenant form
const fileManager = new TenantFileManager(tenantId);
```

---

## Utility Functions

```javascript
// Helper functions for the examples above

const formatFileSize = (bytes) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const getFileIcon = (mimeType) => {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('image')) return '🖼️';
  return '📎';
};

const showUserMessage = (message, type = 'info') => {
  // Implementation depends on your UI framework
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // Example with toast notification
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
};

const updateProgressBar = (percent, additionalText = '') => {
  const progressBar = document.getElementById('upload-progress-bar');
  const progressText = document.getElementById('upload-progress-text');
  
  if (progressBar) {
    progressBar.style.width = `${percent}%`;
  }
  
  if (progressText) {
    progressText.textContent = `${Math.round(percent)}%${additionalText ? ` - ${additionalText}` : ''}`;
  }
};
```

---

This comprehensive implementation provides a production-ready, user-friendly file upload system that handles edge cases, provides excellent user experience, and follows modern web development best practices. The system is designed to work seamlessly with the RentWiz backend API and can be easily integrated into any frontend framework.