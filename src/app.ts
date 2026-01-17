import express, { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import pinoHttp from 'pino-http';
import path from 'path';
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
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

  // API routes
  app.use('/', createRoutes(prisma));

  // Serve frontend
  if (config.nodeEnv === 'production') {
    // In production, serve built frontend
    const frontendPath = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  } else {
    // In development, proxy frontend requests to Vite dev server
    // Proxy all non-API routes to the frontend dev server
    app.use(
      '/',
      (req, res, next) => {
        // Skip API routes - they're already handled above
        if (
          req.path.startsWith('/api') ||
          req.path.startsWith('/auth') ||
          req.path.startsWith('/streams') ||
          req.path.startsWith('/events') ||
          req.path.startsWith('/i/') ||
          req.path === '/health' ||
          req.path.startsWith('/api-docs')
        ) {
          return next();
        }
        // Proxy to Vite dev server
        createProxyMiddleware({
          target: 'http://localhost:5173',
          changeOrigin: true,
          ws: true,
        })(req, res, next);
      }
    );
  }

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
