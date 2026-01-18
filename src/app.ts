import express, { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import pinoHttp from 'pino-http';
import path from 'path';
import fs from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { PrismaClient } from '@prisma/client';
import { config } from './config';
import { logger } from './utils/logger';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { createRoutes } from './routes';

export function createApp(prisma: PrismaClient): Express {
  const app = express();

  // Trust proxy for accurate IP addresses
  app.set('trust proxy', true);

  // Request ID middleware (must be first)
  app.use(requestIdMiddleware);

  // Structured logging
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({
        requestId: req.context?.requestId,
      }),
    })
  );

  // Body parsing for JSON endpoints (not for webhook ingest)
  // Exclude /i/* routes from body parsing so rawBody middleware can capture raw bytes
  app.use((req, res, next) => {
    if (req.path.startsWith('/i/')) {
      return next(); // Skip body parsing for webhook ingest
    }
    express.json({ limit: '10mb' })(req, res, next);
  });
  app.use((req, res, next) => {
    if (req.path.startsWith('/i/')) {
      return next(); // Skip body parsing for webhook ingest
    }
    express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
  });

  // Swagger/OpenAPI setup
  const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Hooklog API',
        version: '1.0.0',
        description: 'Production-grade webhook capture and replay API',
      },
      servers: [
        {
          url: `http://localhost:${config.port}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes (must be BEFORE frontend serving to ensure API requests are handled correctly)
  app.use('/', createRoutes(prisma));

  // Serve frontend (after API routes so API calls are handled first)
  if (config.nodeEnv === 'production') {
    // In production, serve built frontend
    // Try multiple possible paths for frontend dist
    const possiblePaths = [
      path.join(__dirname, '../../frontend/dist'), // Relative to compiled dist
      path.join(process.cwd(), 'frontend/dist'), // Relative to project root
      path.resolve(__dirname, '../../frontend/dist'), // Absolute from dist
    ];
    
    let frontendPath: string | null = null;
    for (const testPath of possiblePaths) {
      const indexPath = path.join(testPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        frontendPath = testPath;
        logger.info({ frontendPath: testPath }, 'Found frontend build');
        break;
      }
    }
    
    if (frontendPath) {
      // Only serve static files for non-API routes
      app.use((req, res, next) => {
        // Skip static file serving for API routes
        if (
          req.path.startsWith('/auth') ||
          req.path.startsWith('/streams') ||
          req.path.startsWith('/events') ||
          req.path.startsWith('/i/') ||
          req.path.startsWith('/api-docs') ||
          req.path === '/health'
        ) {
          return next();
        }
        // Serve static files for other routes
        express.static(frontendPath!)(req, res, next);
      });
      
      // Catch-all for frontend routes (SPA fallback) - only for GET requests
      app.get('*', (req, res, next) => {
        // Skip if this is an API route
        if (
          req.path.startsWith('/auth') ||
          req.path.startsWith('/streams') ||
          req.path.startsWith('/events') ||
          req.path.startsWith('/i/') ||
          req.path.startsWith('/api-docs') ||
          req.path === '/health'
        ) {
          return next();
        }
        res.sendFile(path.join(frontendPath!, 'index.html'));
      });
    } else {
      // Frontend not found - serve API info instead
      logger.warn('Frontend build not found, serving API only');
      app.get('/', (req, res) => {
        res.json({
          name: 'Hooklog API',
          version: '1.0.0',
          message: 'API is running. Frontend build not found.',
          endpoints: {
            health: '/health',
            docs: '/api-docs',
            auth: '/auth/*',
            streams: '/streams',
            events: '/events',
            webhooks: '/i/:token',
          },
        });
      });
    }
  } else {
    // In development, proxy frontend requests to Vite dev server
    // This must be AFTER API routes so API calls are handled first
    const proxyMiddleware = createProxyMiddleware({
      target: 'http://localhost:5173',
      changeOrigin: true,
      ws: true,
    });

    // Proxy middleware that distinguishes between API calls and browser navigation
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      // Always skip these routes (they're API-only)
      if (
        req.path.startsWith('/api-docs') ||
        req.path === '/health' ||
        req.path.startsWith('/i/') ||
        req.path.startsWith('/auth') ||
        req.path.startsWith('/streams') ||
        req.path.startsWith('/events')
      ) {
        return next();
      }

      // Check if this is an API call
      const acceptHeader = req.headers.accept || '';
      const isApiCall = 
        acceptHeader.includes('application/json') ||
        (req.method !== 'GET' && req.method !== 'HEAD');

      // If it's an API call, let it continue (should have been handled by API routes)
      if (isApiCall) {
        return next();
      }

      // For browser navigation (GET requests), proxy to frontend
      // This allows React Router to handle /streams, /events, etc.
      try {
        proxyMiddleware(req, res, next);
      } catch (err) {
        if (!res.headersSent) {
          res.status(503).json({
            error: {
              message: 'Frontend dev server not running. Please start it with: cd frontend && npm run dev',
              frontendDevServer: 'http://localhost:5173',
            },
          });
        }
      }
    });
  }

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
