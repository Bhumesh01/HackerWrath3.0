import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import { env } from './config/env.js';
import { isDbConnected } from './config/db.js';
import { requestIdMiddleware } from './middleware/requestId.js';
<<<<<<< HEAD
import { anonymousIdentity } from './middleware/guestIdentity.js';
=======
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/errors.js';
import { sendSuccess } from './utils/response.js';
import apiV1Router from './routes/index.js';

export function createApp(): Express {
  const app = express();

  // Basic security and parsing
  app.disable('x-powered-by');

  // CORS configuration
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, postman) or if origin is in allowedOrigins
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
<<<<<<< HEAD
        } else if (env.NODE_ENV === 'development' && isLocalDevelopmentOrigin(origin)) {
          // Vite may select another port when its default port is already in use.
          callback(null, true);
=======
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
<<<<<<< HEAD
      allowedHeaders: ['Content-Type', 'X-Request-Id', 'X-Share-Token', 'X-Kaali-Guest-ID', 'Idempotency-Key'],
=======
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Share-Token', 'Idempotency-Key'],
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
      exposedHeaders: ['X-Request-Id', 'Retry-After'],
    })
  );

  // Request ID middleware
  app.use(requestIdMiddleware);

  // Request body parsing with strict size limits
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Health and Readiness probes (not versioned)
  app.get('/health', (_req: Request, res: Response) => {
    sendSuccess(res, {
      status: 'healthy',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/ready', (_req: Request, res: Response, next) => {
    const dbOk = isDbConnected();
    if (!dbOk) {
      return next(AppError.intelligenceUnavailable('Database connection is not ready'));
    }
    sendSuccess(res, {
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API v1 router
<<<<<<< HEAD
  app.use('/api/v1', anonymousIdentity, apiV1Router);
=======
  app.use('/api/v1', apiV1Router);
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c

  // 404 handler for unmatched routes
  app.use((_req: Request, _res: Response, next) => {
    next(AppError.notFound('Endpoint not found'));
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
<<<<<<< HEAD

function isLocalDevelopmentOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]') &&
      /^\d{1,5}$/.test(url.port);
  } catch {
    return false;
  }
}
=======
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
