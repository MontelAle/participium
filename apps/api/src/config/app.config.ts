export default () => ({
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'localhost:5173',
    port: process.env.PORT || 5000,
    backendUrl: process.env.BACKEND_URL || 'http://localhost:5000/api',
    env: process.env.NODE_ENV || 'development',
  },
  session: {
    expiresInSeconds: parseInt(
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
    type: process.env.DB_TYPE || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'participium',
  },
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucketName: process.env.MINIO_BUCKET_NAME || 'participium-reports',
  },
});
