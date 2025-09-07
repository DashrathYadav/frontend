// File upload constants matching API backend constants
// These must stay in sync with the backend constants

export const EntityType = {
  Tenant: 'Tenant',
  Owner: 'Owner', 
  Property: 'Property',
  Room: 'Room'
} as const;

export const FileCategory = {
  PropertyImage: 'PropertyImage',
  TenantImage: 'TenantImage',
  RoomImage: 'RoomImage',
  OwnerImage: 'OwnerImage',
  TenantDocument: 'TenantDocument'
} as const;

export const DocumentType = {
  Agreement: 'Agreement',
  PermanentAddressProof: 'PermanentAddressProof',
  IdentityProof: 'IdentityProof'
} as const;

// Type definitions for TypeScript
export type EntityTypeValue = typeof EntityType[keyof typeof EntityType];
export type FileCategoryValue = typeof FileCategory[keyof typeof FileCategory];
export type DocumentTypeValue = typeof DocumentType[keyof typeof DocumentType];

// Helper arrays for validation and iteration
export const AllEntityTypes = Object.values(EntityType);
export const AllFileCategories = Object.values(FileCategory);
export const AllDocumentTypes = Object.values(DocumentType);

// Helper functions
export const getFileCategoryForEntity = (entityType: EntityTypeValue): FileCategoryValue => {
  switch (entityType) {
    case EntityType.Tenant:
      return FileCategory.TenantImage;
    case EntityType.Owner:
      return FileCategory.OwnerImage;
    case EntityType.Property:
      return FileCategory.PropertyImage;
    case EntityType.Room:
      return FileCategory.RoomImage;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
};

export const isDocumentCategory = (category: FileCategoryValue): boolean => {
  return category === FileCategory.TenantDocument;
};

export const isImageCategory = (category: FileCategoryValue): boolean => {
  return [
    FileCategory.TenantImage,
    FileCategory.OwnerImage,
    FileCategory.PropertyImage,
    FileCategory.RoomImage
  ].includes(category as any);
};