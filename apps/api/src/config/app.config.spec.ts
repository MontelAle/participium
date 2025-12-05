import appConfig from './app.config';

describe('appConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('default values', () => {
    it('should return default configuration when no environment variables are set', () => {
      process.env = {};
      const config = appConfig();

      expect(config).toEqual({
        app: {
          frontendUrl: 'http://localhost:5173',
          port: 5000,
          backendUrl: 'http://localhost:5000/api',
          env: 'development',
        },
        session: {
          expiresInSeconds: 86400,
        },
        cookie: {
          httpOnly: false,
          secure: false,
          sameSite: 'lax',
        },
        db: {
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'admin',
          password: 'password',
          database: 'participium',
        },
        minio: {
          accessKey: 'minioadmin',
          bucketName: 'participium-reports',
          endPoint: 'localhost',
          port: 9000,
          publicEndPoint: undefined,
          publicPort: 9000,
          secretKey: 'minioadmin',
          useSSL: false,
        },
      });
    });
  });

  describe('environment variables override', () => {
    it('should use environment variables when provided', () => {
      process.env.FRONTEND_URL = 'https://example.com';
      process.env.PORT = '4000';
      process.env.BACKEND_URL = 'https://api.example.com';
      process.env.NODE_ENV = 'production';

      process.env.SESSION_EXPIRES_IN_SECONDS = '3600';
      process.env.COOKIE_HTTP_ONLY = 'true';
      process.env.COOKIE_SECURE = 'true';
      process.env.COOKIE_SAME_SITE = 'strict';

      process.env.POSTGRES_HOST = 'db.example.com';
      process.env.POSTGRES_PORT = '5433';
      process.env.POSTGRES_USER = 'custom_user';
      process.env.POSTGRES_PASSWORD = 'custom_password';
      process.env.POSTGRES_DB = 'custom_db';

      process.env.MINIO_ENDPOINT = 'minio.example.com';
      process.env.MINIO_PORT = '9001';
      process.env.MINIO_USE_SSL = 'true';
      process.env.MINIO_ROOT_USER = 'new_minio_user';
      process.env.MINIO_ROOT_PASSWORD = 'new_minio_secret';
      process.env.MINIO_BUCKET_NAME = 'new-bucket';

      const config = appConfig();

      expect(config.app.frontendUrl).toBe('https://example.com');
      expect(config.app.port).toBe(4000);
      expect(config.app.backendUrl).toBe('https://api.example.com');
      expect(config.app.env).toBe('production');

      expect(config.session.expiresInSeconds).toBe(3600);
      expect(config.cookie.httpOnly).toBe(true);
      expect(config.cookie.secure).toBe(true);
      expect(config.cookie.sameSite).toBe('strict');

      expect(config.db.type).toBe('postgres');
      expect(config.db.host).toBe('db.example.com');
      expect(config.db.port).toBe(5433);
      expect(config.db.username).toBe('custom_user');
      expect(config.db.password).toBe('custom_password');
      expect(config.db.database).toBe('custom_db');

      expect(config.minio.endPoint).toBe('minio.example.com');
      expect(config.minio.port).toBe(9001);
      expect(config.minio.useSSL).toBe(true);
      expect(config.minio.accessKey).toBe('new_minio_user');
      expect(config.minio.secretKey).toBe('new_minio_secret');
      expect(config.minio.bucketName).toBe('new-bucket');
    });
  });

  describe('parseInt logic', () => {
    it('should parse SESSION_EXPIRES_IN_SECONDS as integer', () => {
      process.env.SESSION_EXPIRES_IN_SECONDS = '7200';
      const config = appConfig();

      expect(config.session.expiresInSeconds).toBe(7200);
      expect(typeof config.session.expiresInSeconds).toBe('number');
    });

    it('should parse POSTGRES_PORT as integer', () => {
      process.env.POSTGRES_PORT = '5433';
      const config = appConfig();

      expect(config.db.port).toBe(5433);
      expect(typeof config.db.port).toBe('number');
    });

    it('should parse MINIO_PORT as integer', () => {
      process.env.MINIO_PORT = '9001';
      const config = appConfig();

      expect(config.minio.port).toBe(9001);
      expect(typeof config.minio.port).toBe('number');
    });

    it('should handle invalid SESSION_EXPIRES_IN_SECONDS gracefully', () => {
      process.env.SESSION_EXPIRES_IN_SECONDS = 'invalid';
      const config = appConfig();

      expect(config.session.expiresInSeconds).toBeNaN();
    });

    it('should handle invalid POSTGRES_PORT gracefully', () => {
      process.env.POSTGRES_PORT = 'invalid';
      const config = appConfig();

      expect(config.db.port).toBeNaN();
    });
  });

  describe('boolean conversion logic', () => {
    it('should set httpOnly to true when COOKIE_HTTP_ONLY is "true"', () => {
      process.env.COOKIE_HTTP_ONLY = 'true';
      const config = appConfig();
      expect(config.cookie.httpOnly).toBe(true);
    });

    it('should set httpOnly to false when COOKIE_HTTP_ONLY is not "true"', () => {
      process.env.COOKIE_HTTP_ONLY = 'false';
      const config = appConfig();
      expect(config.cookie.httpOnly).toBe(false);
    });

    it('should set httpOnly to false when COOKIE_HTTP_ONLY is undefined', () => {
      delete process.env.COOKIE_HTTP_ONLY;
      const config = appConfig();
      expect(config.cookie.httpOnly).toBe(false);
    });

    it('should set secure to true when COOKIE_SECURE is "true"', () => {
      process.env.COOKIE_SECURE = 'true';
      const config = appConfig();
      expect(config.cookie.secure).toBe(true);
    });

    it('should set secure to false when COOKIE_SECURE is not "true"', () => {
      process.env.COOKIE_SECURE = 'false';
      const config = appConfig();
      expect(config.cookie.secure).toBe(false);
    });

    it('should set secure to false when COOKIE_SECURE is undefined', () => {
      delete process.env.COOKIE_SECURE;
      const config = appConfig();
      expect(config.cookie.secure).toBe(false);
    });

    it('should set useSSL to true when MINIO_USE_SSL is "true"', () => {
      process.env.MINIO_USE_SSL = 'true';
      const config = appConfig();
      expect(config.minio.useSSL).toBe(true);
    });
  });

  describe('sameSite fallback', () => {
    it('should use default "lax" when COOKIE_SAME_SITE is not set', () => {
      delete process.env.COOKIE_SAME_SITE;
      const config = appConfig();
      expect(config.cookie.sameSite).toBe('lax');
    });

    it('should use provided value when COOKIE_SAME_SITE is set', () => {
      process.env.COOKIE_SAME_SITE = 'none';
      const config = appConfig();
      expect(config.cookie.sameSite).toBe('none');
    });
  });
});
