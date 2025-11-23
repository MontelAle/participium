export const USER_ERROR_MESSAGES = {
  USER_NOT_FOUND: (id: string) => `User with ID ${id} not found`,
  MUNICIPALITY_USER_NOT_FOUND: 'Municipality user not found',
  PROFILE_NOT_FOUND: 'User not found',
  ROLE_NOT_FOUND: 'Role not found',
  USERNAME_ALREADY_EXISTS: 'User with this username already exists',
  EMAIL_ALREADY_EXISTS: 'User with this email already exists',
  INVALID_PROFILE_PICTURE_TYPE: (mimetype: string) =>
    `Invalid file type: ${mimetype}. Allowed types: JPEG, PNG, WebP`,
  PROFILE_PICTURE_SIZE_EXCEEDED: 'File size must not exceed 5MB',
  MUNICIPALITY_USER_CANNOT_EDIT_PROFILE:
    'Municipality users cannot edit their profile through this endpoint',
} as const;

export const ALLOWED_PROFILE_PICTURE_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024;
