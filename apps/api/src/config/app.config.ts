export default () => ({
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    port: Number.parseInt(process.env.PORT, 10) || 5000,
    backendUrl: process.env.BACKEND_URL || 'http://localhost:5000/api',
    env: process.env.NODE_ENV || 'development',
  },
  session: {
    expiresInSeconds: Number.parseInt(
      process.env.SESSION_EXPIRES_IN_SECONDS || '86400',
      10,
    ),
  },
  cookie: {
    httpOnly: process.env.COOKIE_HTTP_ONLY === 'true',
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
  },
  db: {
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number.parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'admin',
    password: process.env.POSTGRES_PASSWORD || 'password',
    database: process.env.POSTGRES_DB || 'participium',
  },
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: Number.parseInt(process.env.MINIO_PORT || '9000', 10),
    publicEndPoint: process.env.MINIO_PUBLIC_ENDPOINT,
    publicPort: Number.parseInt(process.env.MINIO_PUBLIC_PORT, 10) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
    secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
    bucketName: process.env.MINIO_BUCKET_NAME || 'participium-reports',
  },
});
