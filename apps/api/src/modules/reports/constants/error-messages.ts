export const REPORT_ERROR_MESSAGES = {
  IMAGES_REQUIRED: 'You must upload between 1 and 3 images',
  INVALID_FILE_TYPE: (mimetype: string) =>
    `Invalid file type: ${mimetype}. Allowed types: JPEG, PNG, WebP`,
  FILE_SIZE_EXCEEDED: (filename: string) =>
    `File ${filename} exceeds 5MB limit`,
  REPORT_NOT_FOUND: (id: string) => `Report with ID ${id} not found`,
  IMAGE_UPLOAD_FAILED: 'Failed to upload images to storage',
  IMAGE_DELETE_FAILED: 'Failed to delete images from storage',
} as const;

export const ALLOWED_IMAGE_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MIN_IMAGES = 1;
export const MAX_IMAGES = 3;
