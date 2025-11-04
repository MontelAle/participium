import session from 'express-session';
import SQLiteStore from 'connect-sqlite3';
import { RequestHandler } from 'express';

// this is needed because express-session evolved
// and connect-sqlite3's types are outdated
type SQLiteStoreType = new (options: any) => session.Store;
const SQLiteStoreConstructor = SQLiteStore(
  session,
) as unknown as SQLiteStoreType;

export function getSessionConfig(): RequestHandler {
  return session({
    secret: process.env.SESSION_SECRET || 'default_session_secret',
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStoreConstructor({
      db: process.env.DB_URL || './db/db.sqlite',
    }),
    cookie: {
      maxAge: Number(process.env.COOKIE_MAX_AGE) || 86400000,
      httpOnly: true,
      secure: Boolean(process.env.COOKIE_SECURE) || false,
      sameSite: 'lax',
    },
  });
}
