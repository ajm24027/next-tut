import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  // Regex uses "Negative Lookahead" to match everything except routes that start with "api", "_next/static", "_next/image" and end with .png. So everything not included in this matcher path, should use NextAuth's Auth Config object.
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};

// Middleware will be invoked for every route in your project. Given this, it's crucial to use matchers to precisely target or exclude specific routes. The following is the execution order:
// headers from next.config.js
// redirects from next.config.js
// Middleware (rewrites, redirects, etc.)
// beforeFiles (rewrites) from next.config.js
// Filesystem routes (public/, _next/static/, pages/, app/, etc.)
// afterFiles (rewrites) from next.config.js
// Dynamic Routes (/blog/[slug])
// fallback (rewrites) from next.config.js
