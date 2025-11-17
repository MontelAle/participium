export const MINIO_ERROR_MESSAGES = {
  BUCKET_INIT_FAILED: 'Failed to initialize MinIO bucket',
  BUCKET_CREATION_FAILED: 'Failed to create MinIO bucket',
  BUCKET_POLICY_FAILED: 'Failed to set bucket policy',
  FILE_UPLOAD_FAILED: 'Failed to upload file to MinIO',
  FILE_DELETE_FAILED: 'Failed to delete file from MinIO',
  FILES_DELETE_FAILED: 'Failed to delete files from MinIO',
} as const;
