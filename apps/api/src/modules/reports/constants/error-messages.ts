export const REPORT_ERROR_MESSAGES = {
  IMAGES_REQUIRED: 'You must upload between 1 and 3 images',
  INVALID_FILE_TYPE: (mimetype: string) =>
    `Invalid file type: ${mimetype}. Allowed types: JPEG, PNG, WebP`,
  FILE_SIZE_EXCEEDED: (filename: string) =>
    `File ${filename} exceeds 5MB limit`,
  REPORT_NOT_FOUND: (id: string) => `Report with ID ${id} not found`,
  IMAGE_UPLOAD_FAILED: 'Failed to upload images to storage',
  IMAGE_DELETE_FAILED: 'Failed to delete images from storage',
  COORDINATES_OUTSIDE_BOUNDARY:
    'The provided coordinates are outside the allowed municipal boundaries',
  EXTERNAL_MAINTAINER_INVALID_USER:
    'The specified user is not an external maintainer',
  EXTERNAL_MAINTAINER_INVALID_STATUS_TRANSITION: (
    currentStatus: string,
    targetStatus: string,
  ) =>
    `External maintainer cannot change status from ${currentStatus} to ${targetStatus}`,
  OFFICER_INVALID_STATUS_TRANSITION: (
    currentStatus: string,
    targetStatus: string,
    role?: string,
  ) =>
    `${role ?? 'Officer'} cannot change status from ${currentStatus} to ${targetStatus}`,
  OFFICER_NOT_FOR_CATEGORY: (officerId: string, categoryId: string) =>
    `Officer ${officerId} does not belong to the office responsible for category ${categoryId}`,
  OFFICER_NOT_FOUND: (officerId: string) =>
    `Officer with ID ${officerId} not found`,
  EXTERNAL_MAINTAINER_NOT_FOR_CATEGORY: (
    externalMaintainerId: string,
    categoryId: string,
  ) =>
    `External maintainer ${externalMaintainerId} does not belong to the external office responsible for category ${categoryId}`,
  EXTERNAL_MAINTAINER_NOT_ASSIGNED_TO_REPORT:
    'You can only modify reports assigned to you',
} as const;

export const ALLOWED_IMAGE_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MIN_IMAGES = 1;
export const MAX_IMAGES = 3;
