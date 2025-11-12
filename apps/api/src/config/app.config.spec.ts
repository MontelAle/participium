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
          frontendUrl: 'localhost:5173',
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
      });
    });
  });

  describe('environment variables override', () => {
    it('should use environment variables when provided', () => {
      process.env.FRONTEND_URL = 'https://example.com';
      process.env.PORT = '3000';
      process.env.BACKEND_URL = 'https://api.example.com';
      process.env.NODE_ENV = 'production';
      process.env.SESSION_EXPIRES_IN_SECONDS = '3600';
      process.env.COOKIE_HTTP_ONLY = 'true';
      process.env.COOKIE_SECURE = 'true';
      process.env.COOKIE_SAME_SITE = 'strict';
      process.env.DB_TYPE = 'mysql';
      process.env.DB_HOST = 'db.example.com';
      process.env.DB_PORT = '3306';
      process.env.DB_USERNAME = 'user';
      process.env.DB_PASSWORD = 'pass';
      process.env.DB_DATABASE = 'mydb';

      const config = appConfig();

      expect(config.app.frontendUrl).toBe('https://example.com');
      expect(config.app.port).toBe('3000');
      expect(config.app.backendUrl).toBe('https://api.example.com');
      expect(config.app.env).toBe('production');
      expect(config.session.expiresInSeconds).toBe(3600);
      expect(config.cookie.httpOnly).toBe(true);
      expect(config.cookie.secure).toBe(true);
      expect(config.cookie.sameSite).toBe('strict');
      expect(config.db.type).toBe('mysql');
      expect(config.db.host).toBe('db.example.com');
      expect(config.db.port).toBe(3306);
      expect(config.db.username).toBe('user');
      expect(config.db.password).toBe('pass');
      expect(config.db.database).toBe('mydb');
    });
  });

  describe('parseInt logic', () => {
    it('should parse SESSION_EXPIRES_IN_SECONDS as integer', () => {
      process.env.SESSION_EXPIRES_IN_SECONDS = '7200';
      const config = appConfig();

      expect(config.session.expiresInSeconds).toBe(7200);
      expect(typeof config.session.expiresInSeconds).toBe('number');
    });

    it('should parse DB_PORT as integer', () => {
      process.env.DB_PORT = '3306';
      const config = appConfig();

      expect(config.db.port).toBe(3306);
      expect(typeof config.db.port).toBe('number');
    });

    it('should handle invalid SESSION_EXPIRES_IN_SECONDS gracefully', () => {
      process.env.SESSION_EXPIRES_IN_SECONDS = 'invalid';
      const config = appConfig();

      expect(config.session.expiresInSeconds).toBeNaN();
    });

    it('should handle invalid DB_PORT gracefully', () => {
      process.env.DB_PORT = 'invalid';
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
