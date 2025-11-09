export default () => ({
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'localhost:5173',
    port: process.env.PORT || 5000,
    backendUrl: process.env.BACKEND_URL || 'http://localhost:5000/api',
  },
  session: {
    expiresInSeconds: parseInt(
      process.env.SESSION_EXPIRES_IN_SECONDS || '86400',
      10,
    ),
  },
  cookie: {
    httpOnly: process.env.COOKIE_HTTP_ONLY || true,
    secure: process.env.COOKIE_SECURE || false,
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
  },
});
