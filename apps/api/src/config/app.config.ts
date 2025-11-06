export default () => ({
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'localhost:3000',
    port: process.env.PORT || 5000,
    backendUrl: process.env.BACKEND_URL || 'http://localhost:5000/api',
  },
  session: {
    expires: process.env.SESSION_EXPIRES || 1000 * 60 * 60 * 24 * 7,
  },
  cookie: {
    httpOnly: process.env.COOKIE_HTTP_ONLY || false,
    secure: process.env.COOKIE_SECURE || false,
    sameSite: process.env.COOKIE_SAME_SITE || 'none',
  },
});
