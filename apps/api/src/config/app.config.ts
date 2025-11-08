export default () => ({
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'localhost:5173',
    port: process.env.PORT || 5000,
    backendUrl: process.env.BACKEND_URL || 'http://localhost:5000/api',
  },
  session: {
    expires: parseInt(process.env.SESSION_EXPIRES || '3600000', 10),
  },
  cookie: {
    httpOnly: process.env.COOKIE_HTTP_ONLY || false,
    secure: process.env.COOKIE_SECURE || false,
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
  },
});
